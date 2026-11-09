"""
Clueless Closet API (FastAPI).

Run locally from inside api/:
    uv run uvicorn main:app --reload        # http://127.0.0.1:8000/docs
"""

import os
from contextlib import asynccontextmanager

import sklearn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from categories import APP_CATEGORY, SLOTS
from predictor import load_predictor
from schemas import ClassProbability, HealthResponse, PipelineInfo, PredictRequest, PredictResponse

state = {"predictor": None, "error": None}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the model ONCE per server process, never per request.
    state["predictor"], state["error"] = load_predictor()
    yield


app = FastAPI(
    title="Clueless Closet API",
    version="0.1.0",
    description="Predicts a clothing item's category and outfit slot from its name.",
    lifespan=lifespan,
)

# CORS: lets the browser call this API from the frontend.
# ALLOWED_ORIGINS = comma-separated list, e.g. "http://localhost:3000,https://clueless-fits.vercel.app"
origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Vercel preview deployments
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def get_predictor():
    if state["predictor"] is None:
        raise HTTPException(status_code=503, detail="Model not available")
    return state["predictor"]


@app.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "model_loaded": state["predictor"] is not None}


@app.get("/pipeline-info", response_model=PipelineInfo)
def pipeline_info():
    p = get_predictor()
    return PipelineInfo(
        model_name=p.name,
        model_version=p.version,
        sklearn_version=sklearn.__version__,
        classes=list(p.classes),
        is_stub=p.is_stub,
        metrics=p.metrics,
    )


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    p = get_predictor()
    probs = p.predict_proba(req.name, req.description)
    ranked = sorted(probs.items(), key=lambda kv: kv[1], reverse=True)
    best, conf = ranked[0]
    return PredictResponse(
        category=best,
        app_category=APP_CATEGORY[best],
        slots=SLOTS[best],
        confidence=round(conf, 4),
        top_3=[ClassProbability(category=c, probability=round(pr, 4)) for c, pr in ranked[:3]],
    )
