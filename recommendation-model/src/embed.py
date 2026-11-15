"""Step 2: embed every item image and every url_name text with a CLIP-style model.

usage: python src/embed.py <tag> <hf_model_id>
  e.g. python src/embed.py clip openai/clip-vit-base-patch32
       python src/embed.py fashionclip patrickjohnp/fashion-clip
Saves outputs/<tag>_img.npy, outputs/<tag>_txt.npy (L2-normalised, float32).
"""
import io
import sys
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pandas as pd
import pyarrow.parquet as pq
import torch
from PIL import Image
from tqdm import tqdm
from transformers import CLIPModel, CLIPTokenizer

tag, model_id = sys.argv[1], sys.argv[2]
dev = "mps" if torch.backends.mps.is_available() else "cpu"
model = CLIPModel.from_pretrained(model_id).to(dev).eval()
tok = CLIPTokenizer.from_pretrained(model_id)
meta = pd.read_parquet("data/meta.parquet")

MEAN = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
STD = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)


def prep(raw):
    """bytes -> 3x224x224 float array (resize shorter side, centre crop, normalise)."""
    if isinstance(raw, dict):
        raw = raw["bytes"]
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    w, h = im.size
    s = 224 / min(w, h)
    im = im.resize((max(224, round(w * s)), max(224, round(h * s))), Image.BICUBIC)
    w, h = im.size
    l, t = (w - 224) // 2, (h - 224) // 2
    a = (np.asarray(im.crop((l, t, l + 224, t + 224)), dtype=np.float32) / 255.0 - MEAN) / STD
    return a.transpose(2, 0, 1)


@torch.no_grad()
def embed_images():
    pf = pq.ParquetFile("data/shard0.parquet")
    out, pool = [], ThreadPoolExecutor(6)
    bar = tqdm(total=pf.metadata.num_rows, desc=f"{tag} images")
    for batch in pf.iter_batches(batch_size=128, columns=["image"]):
        raws = batch.column("image").to_pylist()
        x = torch.from_numpy(np.stack(list(pool.map(prep, raws)))).to(dev)
        f = model.get_image_features(pixel_values=x)
        f = f.pooler_output if hasattr(f, "pooler_output") else f
        out.append(torch.nn.functional.normalize(f, dim=-1).cpu().numpy())
        bar.update(len(raws))
    return np.concatenate(out).astype(np.float32)


@torch.no_grad()
def embed_text(texts):
    out = []
    for i in range(0, len(texts), 512):
        t = tok(texts[i:i + 512], padding=True, truncation=True, max_length=77, return_tensors="pt").to(dev)
        f = model.get_text_features(**t)
        f = f.pooler_output if hasattr(f, "pooler_output") else f
        out.append(torch.nn.functional.normalize(f, dim=-1).cpu().numpy())
    return np.concatenate(out).astype(np.float32)


np.save(f"outputs/{tag}_txt.npy", embed_text(meta["url_name"].tolist()))
np.save(f"outputs/{tag}_img.npy", embed_images())
print("done", tag)
