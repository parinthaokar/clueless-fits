"""Rebuild api/artifacts/model.joblib (the fitted Pipeline served by the API).

Pipeline = ItemTextCleaner (custom) -> TfidfVectorizer -> LogisticRegression.
Data: ../recommendation-model/data/meta.parquet (url_name, category, train/val/test split from
the D3 modeling work; same grouped split, no prompt text shared across splits).
The API sends name as both url_name and title, so training does the same.

Run from inside api/ (scikit-learn must match pyproject.toml / modal_app.py):
    uv run --with pyarrow python train_pipeline.py
"""

import json
from pathlib import Path

import joblib
import pandas as pd
import sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.pipeline import Pipeline

from categories import MODEL_CLASSES
from text_transformers import ItemTextCleaner

META = Path(__file__).parent.parent / "recommendation-model" / "data" / "meta.parquet"
OUT = Path(__file__).parent / "artifacts"


def frame(df):
    return pd.DataFrame({"url_name": df.url_name, "title": df.url_name, "description": ""})


if __name__ == "__main__":
    meta = pd.read_parquet(META)
    tr, va, te = (meta[meta.split == s] for s in ("train", "val", "test"))
    pipe = Pipeline([
        ("text", ItemTextCleaner()),
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)),
        ("clf", LogisticRegression(max_iter=1000, C=5.0)),
    ]).fit(frame(tr), tr.category)
    assert sorted(pipe.classes_) == sorted(MODEL_CLASSES)

    def score(d):
        p = pipe.predict(frame(d))
        return {"accuracy": accuracy_score(d.category, p), "macro_f1": f1_score(d.category, p, average="macro")}

    v, t = score(va), score(te)
    metrics = {"val_accuracy": v["accuracy"], "val_macro_f1": v["macro_f1"],
               "test_accuracy": t["accuracy"], "test_macro_f1": t["macro_f1"]}
    OUT.mkdir(exist_ok=True)
    joblib.dump({"pipeline": pipe, "metadata": {
        "model_name": "cleaner-tfidf-logreg", "model_version": "1.0",
        "sklearn_version": sklearn.__version__, "metrics": metrics}}, OUT / "model.joblib")
    print(json.dumps({k: round(x, 4) for k, x in metrics.items()}, indent=2), "| train rows:", len(tr))
