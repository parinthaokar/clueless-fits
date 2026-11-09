"""
Predictors. The API talks to a predictor, never to the model directly, so we
can swap the placeholder for the real D4 Pipeline without changing endpoints.

MODEL_MODE=stub      -> StubPredictor (keyword rules; works today, no model file)
MODEL_MODE=pipeline  -> PipelinePredictor (loads the fitted scikit-learn Pipeline
                        saved with joblib, once per server process)
"""

import os
from pathlib import Path

import sklearn

from categories import MODEL_CLASSES

DEFAULT_MODEL_PATH = Path(__file__).parent / "artifacts" / "model.joblib"

# Simple keyword rules for the stub. Order matters: first match wins.
KEYWORDS = [
    ("sunglasses", ["sunglass", "glasses", "eyewear"]),
    ("all-body", ["dress", "gown", "jumpsuit", "romper", "playsuit"]),
    ("outerwear", ["coat", "jacket", "blazer", "cardigan", "parka", "trench", "poncho", "vest"]),
    ("shoes", ["shoe", "boot", "sneaker", "heel", "pump", "sandal", "loafer", "flat", "mule", "oxford", "espadrille"]),
    ("bottoms", ["jean", "pant", "trouser", "short", "skirt", "legging", "jogger"]),
    ("tops", ["top", "shirt", "blouse", "tee", "sweater", "tank", "cami", "hoodie", "sweatshirt", "pullover", "bodysuit"]),
    ("bags", ["bag", "tote", "clutch", "backpack", "purse", "satchel", "wallet", "crossbody"]),
    ("hats", ["hat", "cap", "beanie", "beret", "fedora"]),
    ("scarves", ["scarf", "scarves", "shawl", "bandana"]),
    ("jewellery", ["necklace", "ring", "bracelet", "earring", "watch", "pendant", "jewel", "bangle", "anklet"]),
    ("accessories", ["belt", "glove", "headband", "hair clip", "tie", "keychain"]),
]


class StubPredictor:
    """Placeholder until the real model is ready. Same output shape as the real one."""

    name = "stub-keyword-rules"
    version = "0.1-stub"
    is_stub = True
    classes = MODEL_CLASSES
    metrics: dict[str, float] = {}

    def predict_proba(self, name: str, description: str | None) -> dict[str, float]:
        text = f"{name} {description or ''}".lower()
        guess = next((cat for cat, words in KEYWORDS if any(w in text for w in words)), "tops")
        top = 0.6 if guess != "tops" or "top" in text else 0.3
        rest = (1 - top) / (len(self.classes) - 1)
        return {c: (top if c == guess else rest) for c in self.classes}


class PipelinePredictor:
    """Wraps the fitted scikit-learn Pipeline saved in D4."""

    is_stub = False

    def __init__(self, obj):
        # Accept either a bare Pipeline or a bundle dict {"pipeline": ..., "metadata": {...}}.
        # Adjust to the exact HW4 bundle format when D4 is built.
        if isinstance(obj, dict):
            self.pipeline = obj["pipeline"]
            meta = obj.get("metadata", {})
        else:
            self.pipeline, meta = obj, {}
        self.name = meta.get("model_name", type(self.pipeline[-1]).__name__)
        self.version = str(meta.get("model_version", "1.0"))
        self.metrics = {k: float(v) for k, v in meta.get("metrics", {}).items()}
        self.classes = [str(c) for c in self.pipeline.classes_]
        trained = meta.get("sklearn_version")
        if trained and trained != sklearn.__version__:
            raise RuntimeError(f"Model saved with scikit-learn {trained}, server has {sklearn.__version__}")

    def predict_proba(self, name: str, description: str | None) -> dict[str, float]:
        import pandas as pd
        X = pd.DataFrame([{"url_name": name, "title": name, "description": description or ""}])
        probs = self.pipeline.predict_proba(X)[0]
        return dict(zip(self.classes, map(float, probs)))


def load_predictor():
    """Returns (predictor, error). predictor is None if the model can't load -> API returns 503."""
    mode = os.getenv("MODEL_MODE", "stub")
    if mode == "stub":
        return StubPredictor(), None
    path = Path(os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH))
    try:
        import joblib
        return PipelinePredictor(joblib.load(path)), None
    except Exception as e:  # missing file, version mismatch, corrupt artifact...
        return None, f"{type(e).__name__}: {e}"
