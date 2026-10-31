"""
Load the cleaned TRAINING data into Supabase for the D2 dashboard.

Run eda.py first (it creates data/clean/train.parquet and test.parquet).
Then run schema.sql once in the Supabase SQL Editor, and:

    python load_supabase.py               # summary tables + 5,000-item sample + sample images
    python load_supabase.py --no-images   # skip image upload (faster)

Needs a .env file (never commit it) with:
    SUPABASE_URL=https://<your-project>.supabase.co
    SUPABASE_SERVICE_KEY=<service_role key>   # Settings -> API. Used only here, never in the app.

What gets uploaded (sized for the Supabase free tier):
  - category_summary : per-category counts and missing-text rates, computed on the FULL train set
  - dataset_stats    : headline numbers (train/test size, overall % missing, ...)
  - items            : a stratified sample of 5,000 train items for the item browser
  - item-images      : ~30 images per category in Storage, linked from items.image_url
The test set is only counted, never uploaded or explored.
"""

import argparse
import io
import json
import os

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

SEED = 42
SAMPLE_SIZE = 5000
MIN_PER_CATEGORY = 50
IMAGES_PER_CATEGORY = 30
BUCKET = "item-images"
BATCH = 500


def to_records(df):
    """DataFrame -> list of JSON-safe dicts (NaN -> None, numpy types -> Python)."""
    return json.loads(df.to_json(orient="records"))


def upsert(sb, table, df):
    rows = to_records(df)
    for i in range(0, len(rows), BATCH):
        sb.table(table).upsert(rows[i:i + BATCH]).execute()
    print(f"  {table}: {len(rows):,} rows")


def category_summary(train):
    g = train.groupby("category")
    out = pd.DataFrame({
        "n_items": g.size(),
        "pct_missing_title": (100 * (1 - g["has_title"].mean())).round(2),
        "pct_missing_desc": (100 * (1 - g["has_description"].mean())).round(2),
        "median_desc_len": g["desc_len"].apply(lambda s: float(s[s > 0].median()) if (s > 0).any() else 0.0),
    })
    out["pct_of_items"] = (100 * out["n_items"] / out["n_items"].sum()).round(2)
    return out.reset_index()


def dataset_stats(train, n_test):
    stats = [
        ("train_items", len(train), "Rows in the training split (used for all EDA)"),
        ("test_items_reserved", n_test, "Rows in the reserved test split (not explored)"),
        ("n_categories", train["category"].nunique(), "Number of item categories"),
        ("pct_missing_title", round(100 * (1 - train["has_title"].mean()), 2), "% of train items with no title"),
        ("pct_missing_desc", round(100 * (1 - train["has_description"].mean()), 2), "% of train items with no description"),
        ("pct_non_ascii", round(100 * train["non_ascii"].mean(), 2), "% with non-ASCII (often non-English) text"),
        ("imbalance_ratio", round(train["category"].value_counts().max() / train["category"].value_counts().min(), 1),
         "Largest category / smallest category"),
    ]
    return pd.DataFrame(stats, columns=["stat", "value", "note"])


def stratified_sample(train):
    """About SAMPLE_SIZE rows, proportional to category size, at least MIN_PER_CATEGORY each."""
    parts = []
    for _, g in train.groupby("category"):
        n = max(MIN_PER_CATEGORY, round(SAMPLE_SIZE * len(g) / len(train)))
        parts.append(g.sample(min(n, len(g)), random_state=SEED))
    return pd.concat(parts)


def upload_images(sb, sample):
    """Upload IMAGES_PER_CATEGORY images per category and return {item_id: public_url}.

    Row positions in train.parquet's index match the Hugging Face dataset rows,
    because eda.py keeps the original index through cleaning and splitting.
    """
    from datasets import load_dataset

    ds = load_dataset("owj0421/polyvore", split="data")  # uses the cached download
    urls = {}
    picks = sample.groupby("category", group_keys=False).head(IMAGES_PER_CATEGORY)
    for n, (row_idx, row) in enumerate(picks.iterrows(), 1):
        img = ds[int(row_idx)]["image"].convert("RGB")
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=85)
        path = f"{row['category']}/{row['item_id']}.jpg"
        sb.storage.from_(BUCKET).upload(path, buf.getvalue(),
                                        {"content-type": "image/jpeg", "upsert": "true"})
        urls[row["item_id"]] = sb.storage.from_(BUCKET).get_public_url(path)
        if n % 50 == 0:
            print(f"  images uploaded: {n}/{len(picks)}")
    print(f"  images uploaded: {len(urls)}")
    return urls


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-images", action="store_true")
    args = parser.parse_args()

    load_dotenv()
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    train = pd.read_parquet("data/clean/train.parquet")
    n_test = len(pd.read_parquet("data/clean/test.parquet", columns=["item_id"]))
    print(f"Train rows: {len(train):,} | test rows reserved: {n_test:,}")

    print("Uploading summary tables ...")
    upsert(sb, "category_summary", category_summary(train))
    upsert(sb, "dataset_stats", dataset_stats(train, n_test))

    print("Uploading item sample ...")
    sample = stratified_sample(train)
    cols = ["item_id", "url_name", "title", "description", "category",
            "has_title", "has_description", "desc_len", "non_ascii"]
    items = sample[cols].copy()
    items["image_url"] = None
    if not args.no_images:
        urls = upload_images(sb, sample)
        items["image_url"] = items["item_id"].map(urls)
    upsert(sb, "items", items)
    print("Done. Open the dashboard with: streamlit run app.py")


if __name__ == "__main__":
    main()
