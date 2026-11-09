# Backend: Clueless Closet API

FastAPI + Pydantic service that predicts a clothing item's category and outfit
slot from its name. Deployed on Modal. The frontend contract is in
[`CONTRACT.md`](CONTRACT.md).

Right now it runs a **placeholder keyword model** (`MODEL_MODE=stub`) so the
frontend can connect immediately. In D4 it switches to the fitted
scikit-learn Pipeline without any change to the endpoints.

## Files
| File | What it does |
|---|---|
| `main.py` | FastAPI app: `/health`, `/pipeline-info`, `/predict`, CORS, 503 handling |
| `schemas.py` | Pydantic request/response models (input validation → 422) |
| `predictor.py` | Stub predictor now; loads the saved Pipeline once per process in D4 |
| `categories.py` | Maps the 11 model labels to the frontend's categories and slots |
| `modal_app.py` | Modal deployment |
| `tests/test_api.py` | pytest: valid requests, 422 cases, and the 503 case |
| `postman/` | Postman collection with assertions for the deployed URL |

## Run locally (from inside `api/`)
```bash
uv sync                                   # install dependencies
uv run uvicorn main:app --reload          # open http://127.0.0.1:8000/docs
uv run pytest                             # run the tests
```

Test the 503 case locally (doesn't affect the live app):
```bash
MODEL_MODE=pipeline MODEL_PATH=missing.joblib uv run uvicorn main:app
# PowerShell: $env:MODEL_MODE="pipeline"; $env:MODEL_PATH="missing.joblib"; uv run uvicorn main:app
```

## Deploy to Modal
```bash
uv run modal setup                        # one time: log in
uv run modal deploy modal_app.py          # prints the permanent URL
```
Then:
1. Send the URL and `<URL>/docs` to the frontend owner.
2. Paste the URL into `CONTRACT.md` and the Postman `baseUrl` variable.
3. When the Vercel URL exists, add it to `FRONTEND_ORIGINS` in `modal_app.py` and redeploy.

## Postman
1. Import `postman/clueless-closet-api.postman_collection.json`.
2. Set the collection variable `baseUrl` to the Modal URL (no trailing slash).
3. Run the collection. All tests should pass. Screenshot the results for D5.
4. Export the collection again after any edits and commit it.

## Switching to the real model (D4)
1. Save the fitted Pipeline (with the custom transformer) to `artifacts/model.joblib`,
   following the HW4 bundle format. `predictor.py` accepts a bare Pipeline or
   `{"pipeline": ..., "metadata": {...}}`. Adjust it to match HW4 exactly.
2. Pin `scikit-learn` in `pyproject.toml` and `modal_app.py` to the exact training version.
3. Set `MODEL_MODE = "pipeline"` in `modal_app.py`.
4. Check that local and deployed `/predict` give the same output for the same inputs.
5. `modal deploy modal_app.py`, then rerun Postman.
