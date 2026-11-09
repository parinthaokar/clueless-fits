"""
API tests. Run from inside api/:
    uv run pytest
"""

import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("MODEL_MODE", "stub")
    with TestClient(main.app) as c:  # `with` runs the startup (model loading)
        yield c


@pytest.fixture
def client_no_model(monkeypatch, tmp_path):
    # Simulates a missing model file -> should return 503, without touching the live app.
    monkeypatch.setenv("MODEL_MODE", "pipeline")
    monkeypatch.setenv("MODEL_PATH", str(tmp_path / "missing.joblib"))
    with TestClient(main.app) as c:
        yield c


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "model_loaded": True}


def test_pipeline_info(client):
    r = client.get("/pipeline-info")
    assert r.status_code == 200
    body = r.json()
    assert len(body["classes"]) == 11
    assert body["is_stub"] is True


def test_predict_valid(client):
    r = client.post("/predict", json={"name": "Black leather ankle boots"})
    assert r.status_code == 200
    body = r.json()
    assert body["category"] == "shoes"
    assert body["app_category"] == "Shoes"
    assert body["slots"] == ["Shoes"]
    assert 0 <= body["confidence"] <= 1
    assert len(body["top_3"]) == 3


def test_dress_fills_two_slots(client):
    body = client.post("/predict", json={"name": "Red midi dress"}).json()
    assert body["app_category"] == "Dresses"
    assert body["slots"] == ["Top", "Bottom"]


@pytest.mark.parametrize("payload", [
    {},                                  # missing name
    {"name": ""},                        # empty
    {"name": "   "},                     # blank
    {"name": 123},                       # wrong type
    {"name": "x" * 201},                 # too long
    {"name": "boots", "color": "black"}, # unknown field
])
def test_predict_invalid_returns_422(client, payload):
    assert client.post("/predict", json=payload).status_code == 422


def test_missing_model_returns_503(client_no_model):
    assert client_no_model.get("/health").json()["model_loaded"] is False
    assert client_no_model.get("/pipeline-info").status_code == 503
    r = client_no_model.post("/predict", json={"name": "boots"})
    assert r.status_code == 503
    assert r.json() == {"detail": "Model not available"}
