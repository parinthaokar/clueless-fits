"""
Pipeline-mode tests with a small practice model, so the D4 switch is proven before the real
model arrives. Run from inside api/:
    uv run pytest

The practice model is trained here on a handful of made-up names and saved to a temp folder;
nothing is written to api/artifacts/ and nothing is deployed. It's built like the real one
should be: a custom transformer, then TF-IDF, then logistic regression, saved with joblib as
{"pipeline": ..., "metadata": {...}}.
"""

import re

import joblib
import pandas as pd
import pytest
import sklearn
from fastapi.testclient import TestClient
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

import main
from categories import MODEL_CLASSES
from predictor import PipelinePredictor, load_predictor


class TextCombiner(BaseEstimator, TransformerMixin):
    """Practice custom transformer: joins url_name, title and description into one clean string."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        cols = X[["url_name", "title", "description"]].fillna("")
        text = cols["url_name"] + " " + cols["title"] + " " + cols["description"]
        return text.str.lower().map(lambda s: re.sub(r"[^a-z ]+", " ", s))


# Two made-up names per label; enough for the practice model to learn each one.
EXAMPLES = {
    "accessories": ["leather belt", "wool gloves"],
    "all-body": ["red midi dress", "black jumpsuit"],
    "bags": ["leather tote bag", "mini shoulder bag"],
    "bottoms": ["light wash jeans", "pleated mini skirt"],
    "hats": ["straw sun hat", "knit beanie"],
    "jewellery": ["gold hoop earrings", "silver necklace"],
    "outerwear": ["wool trench coat", "denim jacket"],
    "scarves": ["silk scarf", "plaid wool scarf"],
    "shoes": ["black leather ankle boots", "white sneakers"],
    "sunglasses": ["cat eye sunglasses", "aviator sunglasses"],
    "tops": ["white baby tee", "striped button up shirt"],
}


def practice_pipeline():
    rows = [(name, label) for label, names in EXAMPLES.items() for name in names]
    X = pd.DataFrame({"url_name": [n for n, _ in rows], "title": "", "description": ""})
    y = [label for _, label in rows]
    pipe = Pipeline([
        ("text", TextCombiner()),
        ("tfidf", TfidfVectorizer()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    return pipe.fit(X, y)


def bundle(pipe, **meta):
    metadata = {
        "model_name": "practice-tfidf-logreg",
        "model_version": "0.0-practice",
        "sklearn_version": sklearn.__version__,
        "metrics": {"val_accuracy": 0.5},
    }
    return {"pipeline": pipe, "metadata": {**metadata, **meta}}


@pytest.fixture(scope="module")
def pipe():
    return practice_pipeline()


@pytest.fixture
def model_file(tmp_path, pipe):
    path = tmp_path / "model.joblib"
    joblib.dump(bundle(pipe), path)
    return path


@pytest.fixture
def client(monkeypatch, model_file):
    monkeypatch.setenv("MODEL_MODE", "pipeline")
    monkeypatch.setenv("MODEL_PATH", str(model_file))
    with TestClient(main.app) as c:
        yield c


def test_loads_saved_bundle(monkeypatch, model_file):
    monkeypatch.setenv("MODEL_MODE", "pipeline")
    monkeypatch.setenv("MODEL_PATH", str(model_file))
    predictor, error = load_predictor()
    assert error is None
    assert predictor.name == "practice-tfidf-logreg"
    assert sorted(predictor.classes) == sorted(MODEL_CLASSES)
    probs = predictor.predict_proba("black leather ankle boots", None)
    assert sum(probs.values()) == pytest.approx(1.0)


def test_loads_bare_pipeline(pipe):
    assert PipelinePredictor(pipe).classes == list(pipe.classes_)


def test_pipeline_info_reports_real_model(client):
    body = client.get("/pipeline-info").json()
    assert body["is_stub"] is False
    assert body["model_name"] == "practice-tfidf-logreg"
    assert body["metrics"] == {"val_accuracy": 0.5}


def test_predict_uses_pipeline(client):
    r = client.post("/predict", json={"name": "Black leather ankle boots"})
    assert r.status_code == 200
    body = r.json()
    assert body["category"] == "shoes"
    assert body["app_category"] == "Shoes"
    assert len(body["top_3"]) == 3


def test_predict_with_description(client):
    r = client.post("/predict", json={"name": "Red midi dress", "description": "Silk, ankle length"})
    assert r.status_code == 200
    assert r.json()["app_category"] == "Dresses"


def test_wrong_sklearn_version_returns_503(monkeypatch, tmp_path, pipe):
    path = tmp_path / "old.joblib"
    joblib.dump(bundle(pipe, sklearn_version="0.0.0"), path)
    monkeypatch.setenv("MODEL_MODE", "pipeline")
    monkeypatch.setenv("MODEL_PATH", str(path))
    with TestClient(main.app) as c:
        assert c.post("/predict", json={"name": "boots"}).status_code == 503


def test_wrong_labels_returns_503(monkeypatch, tmp_path):
    # e.g. "jewelry" instead of "jewellery": the API would have no app category for it.
    X = pd.DataFrame({"url_name": ["gold ring", "white tee"], "title": "", "description": ""})
    pipe = Pipeline([("text", TextCombiner()), ("tfidf", TfidfVectorizer()), ("clf", LogisticRegression())])
    pipe.fit(X, ["jewelry", "tops"])
    path = tmp_path / "bad_labels.joblib"
    joblib.dump(bundle(pipe), path)
    monkeypatch.setenv("MODEL_MODE", "pipeline")
    monkeypatch.setenv("MODEL_PATH", str(path))
    with TestClient(main.app) as c:
        assert c.get("/health").json()["model_loaded"] is False
        assert c.post("/predict", json={"name": "gold ring"}).status_code == 503
