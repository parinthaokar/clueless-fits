"""Clueless Closet recommendation API (Modal).

POST /search  {"query": "black leather ankle boots", "k": 10, "category": null}
  -> {"items": [{"item_id", "name", "category", "score", "image_url"}]}

Model = FashionCLIP text tower + trained text adapter + category prior (selected model C).
Item embeddings are precomputed; only the prompt is embedded per request (CPU is enough).

  modal volume put clueless-artifacts ../../clothing-rec-model/artifacts /   # once
  modal deploy modal_app.py
"""
import modal

MODEL_ID = "patrickjohncyh/fashion-clip"
vol = modal.Volume.from_name("clueless-artifacts", create_if_missing=True)


def _download_model():
    from transformers import CLIPModel, CLIPTokenizer
    CLIPModel.from_pretrained(MODEL_ID).save_pretrained("/models/fc")
    CLIPTokenizer.from_pretrained(MODEL_ID).save_pretrained("/models/fc")


image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("torch==2.15.0", index_url="https://download.pytorch.org/whl/cpu",
                 extra_index_url="https://pypi.org/simple")
    .pip_install("transformers==5.22.2", "numpy==2.5.4", "pandas==3.1.1", "pyarrow==26.0.1",
                 "scikit-learn==1.9.1", "fastapi[standard]")
    .run_function(_download_model)
)
app = modal.App("clueless-closet", image=image)


@app.cls(volumes={"/art": vol}, secrets=[modal.Secret.from_name("clueless-api")],
         min_containers=0, scaledown_window=300, cpu=2, memory=4096)
class Recommender:
    @modal.enter()
    def load(self):
        import json, os, pickle
        import numpy as np, pandas as pd, torch, torch.nn as nn, torch.nn.functional as F
        from transformers import CLIPModel, CLIPTokenizer

        class Head(nn.Module):  # same as src/evaluate.py
            def __init__(self, d, h=1024, p=0.1):
                super().__init__()
                self.net = nn.Sequential(nn.Linear(d, h), nn.GELU(), nn.Dropout(p), nn.Linear(h, d))
            def forward(self, x):
                return F.normalize(x + self.net(x), dim=-1)

        self.torch, self.np, self.F = torch, np, F
        cfg = json.load(open("/art/artifacts/config.json"))
        self.cfg, self.cats = cfg, cfg["categories"]
        self.lam = cfg["lambda"]
        self.model = CLIPModel.from_pretrained("/models/fc").eval()
        self.tok = CLIPTokenizer.from_pretrained("/models/fc")
        self.head = Head(cfg["dim"])
        self.head.load_state_dict(torch.load("/art/artifacts/text_adapter.pt", map_location="cpu"))
        self.head.eval()
        self.img = np.load("/art/artifacts/item_img.npy")  # [N,512], L2-normalised
        self.items = pd.read_parquet("/art/artifacts/items.parquet")
        self.gcat = self.items["category"].map({c: i for i, c in enumerate(self.cats)}).values
        clf = pickle.load(open("/art/artifacts/category_clf.pkl", "rb"))
        self.vec, self.clf = clf["vec"], clf["clf"]
        self.base = os.environ["IMAGE_BASE_URL"].rstrip("/")
        self.key = os.environ["API_KEY"]

    def _embed(self, text):
        with self.torch.no_grad():
            t = self.tok([text], padding=True, truncation=True, max_length=77, return_tensors="pt")
            f = self.model.get_text_features(**t)
            f = getattr(f, "pooler_output", f)
            f = self.F.normalize(f, dim=-1)
            return self.head(f).numpy()[0]

    def search(self, query, k, category=None):
        np = self.np
        q = self._embed(query)
        prior = self.clf.predict_proba(self.vec.transform([query.lower()]))[0][self.gcat]
        s = self.img @ q + self.lam * prior
        if category:
            s = np.where(self.gcat == self.cats.index(category), s, -1e9)
        top = np.argsort(-s)[:k]
        return [{"item_id": str(self.items.item_id.iat[i]), "name": self.items.url_name.iat[i],
                 "category": self.items.category.iat[i], "score": float(s[i]),
                 "image_url": f"{self.base}/{self.items.item_id.iat[i]}.jpg"} for i in top]

    @modal.asgi_app()
    def web(self):
        from fastapi import FastAPI, Header, HTTPException
        from pydantic import BaseModel, Field

        api = FastAPI(title="Clueless Closet")

        class SearchIn(BaseModel):
            query: str = Field(min_length=1, max_length=200)
            k: int = Field(10, ge=1, le=50)
            category: str | None = None

        @api.get("/health")
        def health():
            return {"ok": True, "items": len(self.items)}

        @api.post("/search")
        def search(body: SearchIn, x_api_key: str = Header(default="")):
            if x_api_key != self.key:
                raise HTTPException(401, "bad api key")
            if body.category and body.category not in self.cats:
                raise HTTPException(422, f"category must be one of {self.cats}")
            return {"items": self.search(body.query, body.k, body.category)}

        return api
