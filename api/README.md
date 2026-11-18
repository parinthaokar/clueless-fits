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
| `tests/test_pipeline_mode.py` | pytest: loading and serving a saved Pipeline, using a small practice model |
| `verify_outputs.py` | D4 check that the local and deployed APIs give the same outputs |
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
What the model file needs (`tests/test_pipeline_mode.py` checks all of this with a small
practice model, so the switch is tested before the real model exists):
- A scikit-learn `Pipeline` with `predict_proba`, taking a DataFrame with columns
  `url_name`, `title`, `description` (empty strings when missing).
- `classes_` exactly the 11 labels in `categories.py`. Any other label set is refused at
  startup (503) instead of failing on the first request.
- The custom transformer defined in its own module inside `api/` (not in a notebook or
  `__main__`), so joblib can import it on Modal.
- Saved with joblib to `artifacts/model.joblib` as
  `{"pipeline": pipe, "metadata": {"model_name", "model_version", "sklearn_version", "metrics"}}`
  (a bare Pipeline also works). A `sklearn_version` that differs from the server's is refused (503).

Steps:
1. Save the fitted Pipeline to `artifacts/model.joblib`.
2. Pin `scikit-learn` in `pyproject.toml` and `modal_app.py` to the exact training version.
3. Set `MODEL_MODE = "pipeline"` in `modal_app.py`.
4. `uv run pytest`, then `modal deploy modal_app.py`.
5. Check local and deployed outputs match (below), then rerun Postman.

## Checking local and deployed outputs match (D4)
`verify_outputs.py` sends the same 15 inputs to the local API and the deployed one and
compares the full responses, plus `/pipeline-info`. It exits with an error if anything differs.
```bash
MODEL_MODE=pipeline uv run uvicorn main:app             # terminal 1 (MODEL_MODE=stub before D4)
uv run python verify_outputs.py                         # terminal 2
uv run python verify_outputs.py --report verify_report.json   # also save every response
```
PowerShell for terminal 1: `$env:MODEL_MODE="pipeline"; uv run uvicorn main:app`.
