"""Rebuild api/artifacts/model.joblib (the fitted Pipeline served by the API).

Pipeline = FashionCLIPTextAdapter (custom; the evaluated recommendation model's text side)
           -> LogisticRegression (item category from that embedding).
Data: ../recommendation-model/data/meta.parquet, same train/val/test split as the evaluation.
The API sends the item name as url_name, which is the prompt the model was evaluated with.

Rebuild (from inside api/; needs torch, transformers, scikit-learn==1.9.1, pyarrow):
    python train_pipeline.py            # ~5-10 min on CPU the first time
Also checks the transformer against the evaluated embeddings in
../recommendation-model/outputs/fashionclip_adapted_txt.npy.
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.pipeline import Pipeline

from categories import MODEL_CLASSES
from text_transformers import FashionCLIPTextAdapter

ROOT = Path(__file__).parent.parent / "recommendation-model"
OUT = Path(__file__).parent / "artifacts"


def frame(df):
    return pd.DataFrame({"url_name": df.url_name, "title": df.url_name, "description": ""})


if __name__ == "__main__":
    meta = pd.read_parquet(ROOT / "data" / "meta.parquet")
    emb = FashionCLIPTextAdapter()

    # 1. the transformer must reproduce the embeddings the model was evaluated with
    ref = np.load(ROOT / "outputs" / "fashionclip_adapted_txt.npy")
    idx = np.random.default_rng(0).choice(len(meta), 300, replace=False)
    got = emb.transform(frame(meta.iloc[idx]))
    cos = (got * ref[idx]).sum(1)
    print(f"transformer vs evaluated embeddings: min cosine {cos.min():.5f}, mean {cos.mean():.6f}")
    assert cos.min() > 0.999, "transformer does not match the evaluated model"

    # 2. fit the Pipeline (embeddings of every name computed once, then reused for scoring)
    tr, va, te = (meta[meta.split == s] for s in ("train", "val", "test"))
    pipe = Pipeline([("embed", emb),
                     ("clf", LogisticRegression(max_iter=2000, C=10.0))])
    Z = {n: emb.transform(frame(d)) for n, d in (("train", tr), ("val", va), ("test", te))}
    pipe.named_steps["clf"].fit(Z["train"], tr.category)
    assert sorted(pipe.classes_) == sorted(MODEL_CLASSES)

    def score(n, d):
        p = pipe.named_steps["clf"].predict(Z[n])
        return accuracy_score(d.category, p), f1_score(d.category, p, average="macro")

    (va_acc, va_f1), (te_acc, te_f1) = score("val", va), score("test", te)
    metrics = {"val_accuracy": va_acc, "val_macro_f1": va_f1, "test_accuracy": te_acc, "test_macro_f1": te_f1}
    OUT.mkdir(exist_ok=True)
    joblib.dump({"pipeline": pipe, "metadata": {
        "model_name": "fashionclip-adapter-logreg", "model_version": "1.0",
        "sklearn_version": sklearn.__version__, "metrics": metrics}}, OUT / "model.joblib")
    print(json.dumps({k: round(x, 4) for k, x in metrics.items()}, indent=2), "| train rows:", len(tr))
