"""Custom scikit-learn transformer: the selected recommendation model's text side.

FashionCLIPTextAdapter = frozen FashionCLIP text encoder + the trained text adapter from
recommendation-model (model C: FashionCLIP + adapter + category prior). It turns an item name
into the 512-number vector that lives in the same space as the adapted item-image embeddings
the model was evaluated with. Lives in its own module so joblib can import it on Modal.
"""

from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from sklearn.base import BaseEstimator, TransformerMixin

HERE = Path(__file__).parent


class _Head(nn.Module):
    """Residual MLP adapter, identical to Head in recommendation-model/src/evaluate.py."""

    def __init__(self, d=512, h=1024, p=0.1):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(d, h), nn.GELU(), nn.Dropout(p), nn.Linear(h, d))

    def forward(self, x):
        return F.normalize(x + self.net(x), dim=-1)


class FashionCLIPTextAdapter(BaseEstimator, TransformerMixin):
    """DataFrame/Series of item names -> array [n, 512] of adapted, L2-normalised embeddings.

    Stateless (the encoder and adapter were trained earlier), but a real transformer. The
    weights are NOT pickled into the Pipeline: only the two settings below are, and the
    encoder is loaded from the Hugging Face cache on first use. The adapter weights are
    api/artifacts/text_adapter.pt (exported from the evaluated run).
    """

    def __init__(self, model_id="patrickjohncyh/fashion-clip", adapter_path="artifacts/text_adapter.pt",
                 batch_size=256):
        self.model_id = model_id
        self.adapter_path = adapter_path
        self.batch_size = batch_size

    def fit(self, X, y=None):
        return self

    def __getstate__(self):
        state = self.__dict__.copy()
        state.pop("_loaded", None)
        return state

    def _load(self):
        if getattr(self, "_loaded", None) is None:
            from transformers import CLIPModel, CLIPTokenizer
            # Apple GPU when present (torch 2.15 on a Mac CPU returns NaN for this model); Linux CPU is fine.
            dev = "mps" if torch.backends.mps.is_available() else "cpu"
            model = CLIPModel.from_pretrained(self.model_id).eval().to(dev)
            tok = CLIPTokenizer.from_pretrained(self.model_id)
            head = _Head()
            path = Path(self.adapter_path)
            head.load_state_dict(torch.load(path if path.is_absolute() else HERE / path, map_location="cpu"))
            head = head.to(dev)
            self._loaded = (model, tok, head.eval())
        return self._loaded

    @staticmethod
    def _names(X):
        if isinstance(X, pd.DataFrame):
            col = X["url_name"] if "url_name" in X else X["title"]
            return col.fillna("").astype(str).tolist()
        return [str(x) for x in X]

    def transform(self, X):
        model, tok, head = self._load()
        names, out = self._names(X), []
        with torch.no_grad():
            for i in range(0, len(names), self.batch_size):
                t = tok(names[i:i + self.batch_size], padding=True, truncation=True, max_length=77, return_tensors="pt").to(model.device)
                f = model.get_text_features(**t)
                f = getattr(f, "pooler_output", f)
                out.append(head(F.normalize(f, dim=-1)).cpu().numpy())
        return np.concatenate(out).astype(np.float32)
