# Rebuild Instructions

## 1. Setup

Clone the repository and navigate to the model directory.

```bash
git clone https://github.com/parinthaokar/clueless-fits.git
cd clueless-fits/recommendation-model
```

Create a virtual environment and install the dependencies.

```bash
python -m venv .venv
```

Activate the environment on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

For macOS or Linux:

```bash
source .venv/bin/activate
```

Install the required packages.

```bash
python -m pip install -r requirements.txt rank_bm25 huggingface_hub
```

## 2. Download the Dataset

We use the Polyvore dataset from Hugging Face:
https://huggingface.co/datasets/owj0421/polyvore

Download `data-00000-of-00005.parquet` and save it as
`data/shard0.parquet` inside the recommendation-model folder.

We used the first shard, which contains 41,835 items.

## 3. Prepare the Data

```bash
python src/prepare.py
```

This script prepares the dataset and creates a 70/15/15
train, validation, and test split grouped by url_name
to prevent data leakage.

## 4. Rebuild the Model

Generate the CLIP and FashionCLIP embeddings.

```bash
python src/embed.py clip openai/clip-vit-base-patch32
python src/embed.py fashionclip patrickjohncyh/fashion-clip
```

Run the model comparison and simulated user evaluation.

```bash
python src/evaluate.py
python src/sim_users.py
```

The selected model uses FashionCLIP with a trained adapter
and category prior. The results are saved in `outputs/`.

The selected embeddings are saved as:

- `outputs/fashionclip_adapted_img.npy`
- `outputs/fashionclip_adapted_txt.npy`

The corresponding item metadata is stored in `data/meta.parquet`.

For the API, the fitted scikit-learn pipeline needs to be
saved separately as `api/artifacts/model.joblib`.

## 5. Run the API Locally

Navigate to the API folder from the recommendation-model directory.

```bash
cd ../api
uv sync
uv run pytest
```

Once the fitted pipeline is available, start the API in pipeline mode.

Windows PowerShell:

```powershell
$env:MODEL_MODE="pipeline"
uv run uvicorn main:app
```

macOS or Linux:

```bash
MODEL_MODE=pipeline uv run uvicorn main:app
```

Open http://127.0.0.1:8000/docs to test the API.

Check `/pipeline-info` to confirm that the fitted model
is loaded and `is_stub` is false.

## 6. Deploy to Modal

Before deploying, make sure the scikit-learn version in
`pyproject.toml` and `modal_app.py` matches the version
used to fit the pipeline.

Set `MODEL_MODE = "pipeline"` in `modal_app.py`.

Run the following commands from the API folder.

```bash
uv run modal setup
uv run modal deploy modal_app.py
```

Modal will return the deployed API URL. Add `/docs`
to the URL to access the API documentation.

## 7. Verify Outputs

Keep the local API running and open a second terminal
in the API folder.

```bash
uv run python verify_outputs.py --deployed YOUR_MODAL_URL --report verify_report.json
```

Replace `YOUR_MODAL_URL` with the deployed API URL.

The verification script compares 15 inputs between the
local and deployed APIs. Confirm that both APIs use the
fitted pipeline and return matching predictions.

## Remaining D4 Setup

The final pipeline training and export command still needs
to be added once the fitted model is available.
