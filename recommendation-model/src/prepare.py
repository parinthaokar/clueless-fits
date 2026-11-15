"""Step 1: load shard, build metadata, make a LEAK-FREE train/val/test split.

Split is done by url_name (the text prompt) so identical prompts never appear in
both train and eval. Output: data/meta.parquet (row order == parquet row order).
"""
import numpy as np
import pandas as pd
import pyarrow.parquet as pq

SEED = 42
SHARD = "data/shard0.parquet"

df = pq.read_table(SHARD, columns=["item_id", "url_name", "title", "description", "category"]).to_pandas()
df["url_name"] = df["url_name"].fillna("").str.strip().str.lower()
df["has_desc"] = (df["description"].fillna("").str.strip() != "")
df["row"] = np.arange(len(df))

# group split by url_name
rng = np.random.default_rng(SEED)
groups = np.array(df["url_name"].unique().tolist())
rng.shuffle(groups)
n = len(groups)
split_of = {}
for i, g in enumerate(groups):
    split_of[g] = "train" if i < 0.70 * n else ("val" if i < 0.85 * n else "test")
df["split"] = df["url_name"].map(split_of)
df["q_len"] = df["url_name"].str.split().str.len()

df[["row", "item_id", "url_name", "category", "has_desc", "q_len", "split"]].to_parquet("data/meta.parquet")
print(df["split"].value_counts())
print(df.groupby("split")["category"].value_counts(normalize=True).unstack(0).round(3))
