"""
Deploy the FastAPI app on Modal.

One-time setup:
    modal setup                       # log in from your browser

Run from inside api/:
    modal serve modal_app.py          # temporary URL, stops on Ctrl+C
    modal deploy modal_app.py         # permanent URL (send this to the frontend)

The API docs are at <URL>/docs.

Switching from the stub to the real model (D4):
    1. Save the fitted Pipeline to api/artifacts/model.joblib
    2. Change MODEL_MODE below to "pipeline"
    3. Pin scikit-learn below to the EXACT version used to train it
    4. modal deploy modal_app.py
"""

from pathlib import Path

import modal

API_DIR = Path(__file__).parent

MODEL_MODE = "pipeline"  # fitted Pipeline in artifacts/model.joblib (rebuild: train_pipeline.py)
FRONTEND_ORIGINS = "http://localhost:3000"  # add the Vercel URL here, comma-separated

def _download_model():
    from transformers import CLIPModel, CLIPTokenizer
    CLIPModel.from_pretrained("patrickjohncyh/fashion-clip")
    CLIPTokenizer.from_pretrained("patrickjohncyh/fashion-clip")


image = (
    modal.Image.debian_slim(python_version="3.13")
    .pip_install("torch==2.15.0", index_url="https://download.pytorch.org/whl/cpu",
                 extra_index_url="https://pypi.org/simple")
    .pip_install(
        "fastapi[standard]>=0.115",
        "pydantic>=2.7",
        "scikit-learn==1.9.1",  # MUST match the version the model was trained with
        "transformers==5.22.2",
        "joblib>=1.4",
        "pandas>=2.2",
    )
    .run_function(_download_model)  # bake the FashionCLIP weights into the image
    .env({"MODEL_MODE": MODEL_MODE, "ALLOWED_ORIGINS": FRONTEND_ORIGINS})
    .add_local_dir(API_DIR, "/root/api", ignore=["__pycache__", ".venv", "tests", "*.pyc"])
)

app = modal.App(name="clueless-closet-api", image=image)


@app.function(min_containers=1, scaledown_window=600, cpu=2, memory=4096)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def fastapi_app():
    import sys
    sys.path.insert(0, "/root/api")
    from main import app as web_app
    return web_app
