# CLAUDE.md

## Project

Clueless-inspired outfit recommender. Builds outfit recommendations from the
Hugging Face dataset [`owj0421/polyvore`](https://huggingface.co/datasets/owj0421/polyvore).

## Layout

- `eda/` — the D2 code (`eda.py`, `app.py`, `load_supabase.py`, `modal_app.py`,
  `schema.sql`, `requirements.txt`).

## Running the code

**The D2 code must be run from inside `eda/`** — it assumes `eda/` is the
working directory, so `cd eda` first rather than invoking it as `eda/eda.py`
from the repo root.

## Environment

- Windows, PowerShell is the shell to use for commands.
- Conda environment named `clueless`:

```powershell
conda activate clueless
cd eda
pip install -r requirements.txt
```

## Ignored paths

`.gitignore` excludes `.venv/`, `.env`, `data/`, and `__pycache__/`. Keep
datasets and secrets out of git.
