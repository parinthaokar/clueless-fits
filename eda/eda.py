"""
D2 - Data preparation and EDA for the Polyvore dataset (owj0421/polyvore).

What this script does, in order:
  1. Load    - downloads the dataset from Hugging Face (or reads a local parquet with --input)
  2. Audit   - missing values, empty strings, duplicates, category balance, text quirks
  3. Clean   - normalizes text, decodes URL names, drops duplicate ids, adds helper flags
  4. Split   - reserves a stratified 20% TEST set (seed 42) BEFORE any plotting
  5. Dictionary - writes docs/data_dictionary.md
  6. Plots   - 4 figures made from the TRAIN set only, saved to figures/

Usage:
  pip install datasets pandas pyarrow matplotlib scikit-learn pillow
  python eda.py                      # full dataset from Hugging Face (~2.2 GB download, cached)
  python eda.py --input my.parquet   # a local parquet file instead (useful for quick tests)

Outputs:
  data/clean/train.parquet, data/clean/test.parquet   (test = reserved, do not explore)
  reports/audit.md        - audit numbers to quote in the data note
  docs/data_dictionary.md - data dictionary
  figures/*.png           - the 4 plots
"""

import argparse
import io
import os
import re
from urllib.parse import unquote

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker
import pandas as pd
from sklearn.model_selection import train_test_split

SEED = 42
TEST_SIZE = 0.20
TEXT_COLS = ["url_name", "title", "description"]
OUT_DIRS = ["data/clean", "reports", "docs", "figures"]


# --------------------------------------------------------------------------- 1. Load
def load_data(input_path=None):
    """Return (metadata DataFrame without images, image source).

    The image source is either the Hugging Face dataset object (images decoded
    lazily, so we never hold 251K images in memory) or the local DataFrame.
    """
    if input_path:
        df = pd.read_parquet(input_path)
        meta = df.drop(columns=["image"], errors="ignore")
        return meta, df

    from datasets import load_dataset

    ds = load_dataset("owj0421/polyvore", split="data")
    meta = ds.remove_columns("image").to_pandas()
    return meta, ds


def get_image(source, row_idx):
    """Fetch one image as a PIL image from either a HF dataset or a DataFrame."""
    from PIL import Image

    if isinstance(source, pd.DataFrame):
        img = source.iloc[row_idx]["image"]
        if isinstance(img, dict):  # parquet stores images as {"bytes": ..., "path": ...}
            return Image.open(io.BytesIO(img["bytes"]))
        return img
    return source[int(row_idx)]["image"]


# --------------------------------------------------------------------------- 2. Audit
def audit(meta):
    """Collect data-quality facts. Returns a dict of tables and numbers."""
    n = len(meta)
    a = {"rows": n, "columns": list(meta.columns)}

    # Missing = real nulls OR empty/whitespace-only strings (common in this dataset)
    missing = {}
    for col in meta.columns:
        s = meta[col]
        null = s.isna()
        is_text = not pd.api.types.is_numeric_dtype(s) and not pd.api.types.is_bool_dtype(s)
        empty = (s.astype(str).str.strip().eq("") & ~null) if is_text else (null & False)
        missing[col] = {"null": int(null.sum()), "empty_string": int(empty.sum()),
                        "pct_missing_total": round(100 * (null | empty).mean(), 2)}
    a["missing"] = pd.DataFrame(missing).T

    a["dup_item_id"] = int(meta["item_id"].duplicated().sum())
    a["dup_full_row"] = int(meta.duplicated().sum())
    # Same product listed twice under different ids (same name + title)
    a["dup_name_title"] = int(meta.duplicated(subset=["url_name", "title"]).sum())

    counts = meta["category"].value_counts()
    a["category_counts"] = counts
    a["imbalance_ratio"] = round(counts.max() / counts.min(), 1)

    a["url_encoded_names"] = int(meta["url_name"].astype(str).str.contains(r"%[0-9A-Fa-f]{2}").sum())
    text = (meta["title"].fillna("") + " " + meta["description"].fillna("")).astype(str)
    a["non_ascii_text"] = int(text.str.contains(r"[^\x00-\x7F]").sum())
    a["desc_len_describe"] = meta["description"].fillna("").str.len().describe().round(1)
    return a


def image_audit(source, meta, n=300):
    """Check a random sample of images: do they open, and what size are they?"""
    sample = meta.sample(min(n, len(meta)), random_state=SEED).index
    sizes, broken = [], 0
    for i in sample:
        try:
            img = get_image(source, i)
            sizes.append(img.size)
        except Exception:
            broken += 1
    size_counts = pd.Series([f"{w}x{h}" for w, h in sizes]).value_counts()
    return {"checked": len(sample), "broken": broken, "sizes": size_counts.head(10)}


def write_audit(a, img_a, path="reports/audit.md"):
    lines = [
        "# Data audit - Polyvore (owj0421/polyvore)\n",
        f"- Rows: **{a['rows']:,}**  |  Columns: {', '.join(a['columns'])}",
        f"- Duplicate item_id: **{a['dup_item_id']:,}**  |  Duplicate full rows: {a['dup_full_row']:,}",
        f"- Same url_name + title under different ids (possible duplicate products): {a['dup_name_title']:,}",
        f"- URL-encoded url_name values (e.g. %C3%A9): {a['url_encoded_names']:,}",
        f"- Items with non-English / non-ASCII text in title or description: {a['non_ascii_text']:,}",
        f"- Category imbalance (largest / smallest class): **{a['imbalance_ratio']}x**",
        f"- Image check: {img_a['checked']} sampled, {img_a['broken']} failed to open\n",
        "## Missing values (null + empty string)\n",
        a["missing"].to_markdown(),
        "\n## Category counts\n",
        a["category_counts"].rename("count").to_frame()
        .assign(pct=lambda d: (100 * d["count"] / d["count"].sum()).round(2)).to_markdown(),
        "\n## Description length (characters, empty counted as 0)\n",
        a["desc_len_describe"].to_frame("chars").to_markdown(),
        "\n## Image sizes in sample\n",
        img_a["sizes"].rename("count").to_frame().to_markdown(),
    ]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


# --------------------------------------------------------------------------- 3. Clean
def clean(meta):
    """Return a cleaned copy plus a log of what each step changed."""
    df, log = meta.copy(), []

    # Empty / whitespace-only strings -> real missing values
    for col in TEXT_COLS:
        df[col] = df[col].astype("string").str.strip()
        n_empty = int(df[col].eq("").sum())
        df.loc[df[col].eq(""), col] = pd.NA
        log.append(f"{col}: {n_empty:,} empty strings set to missing")

    # Decode URL-encoded names, e.g. 'chlo%C3%A9' -> 'chloé'
    before = df["url_name"].copy()
    df["url_name"] = df["url_name"].map(lambda s: unquote(s) if isinstance(s, str) else s)
    log.append(f"url_name: {int((before != df['url_name']).fillna(False).sum()):,} values URL-decoded")

    # Drop duplicate item ids (keep first)
    n0 = len(df)
    df = df.drop_duplicates(subset="item_id", keep="first")
    log.append(f"duplicate item_id rows dropped: {n0 - len(df):,}")

    # Drop rows with no category (cannot be used as a labeled example)
    n0 = len(df)
    df = df.dropna(subset=["category"])
    log.append(f"rows without category dropped: {n0 - len(df):,}")

    # Helper features for EDA and later modeling
    df["has_title"] = df["title"].notna()
    df["has_description"] = df["description"].notna()
    df["desc_len"] = df["description"].fillna("").str.len()
    text = (df["title"].fillna("") + " " + df["description"].fillna("")).astype(str)
    df["non_ascii"] = text.str.contains(r"[^\x00-\x7F]")
    log.append(f"final rows: {len(df):,}")
    return df, log


# --------------------------------------------------------------------------- 4. Split
def split(df):
    """Stratified train/test split by category. Test set is saved and NOT explored."""
    train, test = train_test_split(df, test_size=TEST_SIZE, random_state=SEED, stratify=df["category"])
    return train, test


# --------------------------------------------------------------------------- 5. Data dictionary
DESCRIPTIONS = {
    "item_id": "Unique Polyvore item identifier (string). Primary key.",
    "image": "300px product photo (stored as image bytes). Not in the metadata table.",
    "url_name": "Short item name taken from the product URL; URL-decoded during cleaning.",
    "title": "Product title from the retailer. Often missing.",
    "description": "Retailer description; may mention color, material, pattern, size. Often missing.",
    "category": "Item category (11 classes, e.g. tops, bottoms, shoes). Target for item classification.",
    "has_title": "Derived: True if title is present.",
    "has_description": "Derived: True if description is present.",
    "desc_len": "Derived: description length in characters (0 if missing).",
    "non_ascii": "Derived: True if title/description contains non-ASCII text (often non-English).",
}


def write_dictionary(raw, df, path="docs/data_dictionary.md"):
    rows = []
    for col in ["item_id", "image"] + [c for c in df.columns if c != "item_id"]:
        if col == "image":
            rows.append(["image", "image (bytes)", "raw", DESCRIPTIONS["image"], "-", "300x300 JPEG"])
            continue
        s = df[col]
        source = "raw" if col in raw.columns else "derived"
        example = s.dropna().astype(str).iloc[0][:40] if s.notna().any() else ""
        rows.append([col, str(s.dtype), source, DESCRIPTIONS.get(col, ""),
                     f"{100 * s.isna().mean():.1f}%", example])
    table = pd.DataFrame(rows, columns=["Field", "Type", "Source", "Description", "% missing", "Example"])
    cats = ", ".join(sorted(df["category"].unique()))
    with open(path, "w", encoding="utf-8") as f:
        f.write("# Data dictionary - Polyvore (cleaned)\n\n")
        f.write(f"One row = one clothing item or accessory. Rows after cleaning: {len(df):,}.\n\n")
        f.write(table.to_markdown(index=False))
        f.write(f"\n\n**Category values:** {cats}\n")


# --------------------------------------------------------------------------- 6. Plots
# One consistent look for every figure: white background, gray text, no box,
# a faint grid behind the bars, and titles that state the finding.
# Colors: change these three lines to restyle every plot.
PRIMARY = "#c2185b"     # raspberry pink - main bars and boxes
SECONDARY = "#6250d6"   # violet - second series (title missing)
PRIMARY_LIGHT = "#f8d7e4"  # pale pink box fill
# PRIMARY and SECONDARY were checked to stay distinct for colorblind readers.
INK, INK_2, GRID = "#1f1f1e", "#6b6a66", "#e6e5e1"


def set_style():
    plt.rcParams.update({
        "figure.facecolor": "white", "axes.facecolor": "white",
        "font.size": 10, "axes.titlesize": 13, "axes.titleweight": "bold",
        "axes.titlelocation": "left", "axes.titlepad": 22,
        "axes.edgecolor": GRID, "axes.labelcolor": INK_2,
        "text.color": INK, "xtick.color": INK_2, "ytick.color": INK,
        "axes.spines.top": False, "axes.spines.right": False,
        "axes.grid": True, "axes.grid.axis": "x", "grid.color": GRID, "grid.linewidth": 0.8,
        "axes.axisbelow": True, "xtick.major.size": 0, "ytick.major.size": 0,
    })


def finish(fig, ax, subtitle, path):
    """Gray subtitle under the bold title, a source note, and save."""
    ax.text(0, 1.02, subtitle, transform=ax.transAxes, color=INK_2, fontsize=9.5, va="bottom")
    ax.spines["left"].set_visible(False)
    fig.text(0.01, 0.01, "Source: Hugging Face owj0421/polyvore (training split)",
             color=INK_2, fontsize=8)
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(path, dpi=200)
    plt.close(fig)


def plot_category_distribution(train):
    counts = train["category"].value_counts().sort_values()
    pct = 100 * counts / counts.sum()
    fig, ax = plt.subplots(figsize=(8, 5.2))
    ax.barh(counts.index, counts.values, color=PRIMARY, height=0.7)
    for i, (v, p) in enumerate(zip(counts.values, pct.values)):
        ax.text(v, i, f"  {v:,}  ({p:.1f}%)", va="center", fontsize=9, color=INK_2)
    ax.set_xlim(0, counts.max() * 1.25)
    ax.xaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x, _: f"{x:,.0f}"))
    ax.set_xlabel("Items")
    ratio = counts.max() / counts.min()
    ax.set_title("Items per category")
    finish(fig, ax, f"{counts.index[-1].capitalize()} is the largest category, {ratio:.0f}x the smallest",
           "figures/1_category_distribution.png")


def plot_missing_by_category(train):
    miss = 100 * (1 - train.groupby("category")[["has_title", "has_description"]].mean())
    miss = miss.sort_values("has_description")
    y = range(len(miss))
    h = 0.38
    fig, ax = plt.subplots(figsize=(8, 5.6))
    ax.barh([i + h / 2 for i in y], miss["has_title"], height=h, color=SECONDARY, label="Title missing")
    ax.barh([i - h / 2 for i in y], miss["has_description"], height=h, color=PRIMARY, label="Description missing")
    for i, (t, d) in enumerate(zip(miss["has_title"], miss["has_description"])):
        ax.text(t, i + h / 2, f" {t:.0f}%", va="center", fontsize=8, color=INK_2)
        ax.text(d, i - h / 2, f" {d:.0f}%", va="center", fontsize=8, color=INK_2)
    ax.set_yticks(list(y), miss.index)
    ax.set_xlim(0, 110)
    ax.set_xticks(range(0, 101, 25), [f"{v}%" for v in range(0, 101, 25)])
    ax.set_xlabel("Share of items missing the field")
    ax.legend(loc="lower right", frameon=False, ncol=2, bbox_to_anchor=(1, 1.0), fontsize=9)
    overall_t = 100 * (1 - train["has_title"].mean())
    overall_d = 100 * (1 - train["has_description"].mean())
    ax.set_title(f"{overall_t:.0f}% of items have no title and {overall_d:.0f}% no description")
    finish(fig, ax, "Missing text by category", "figures/2_missing_text_by_category.png")


def plot_description_length(train):
    has = train[train["has_description"]]
    order = has.groupby("category")["desc_len"].median().sort_values().index
    data = [has.loc[has["category"] == c, "desc_len"] for c in order]
    fig, ax = plt.subplots(figsize=(8, 5.2))
    style = dict(patch_artist=True, showfliers=False, widths=0.6,
                 boxprops=dict(facecolor=PRIMARY_LIGHT, edgecolor=PRIMARY, linewidth=1.2),
                 medianprops=dict(color=PRIMARY, linewidth=2.2),
                 whiskerprops=dict(color=PRIMARY, linewidth=1), capprops=dict(color=PRIMARY, linewidth=1))
    try:  # matplotlib >= 3.10
        ax.boxplot(data, orientation="horizontal", **style)
    except TypeError:  # older matplotlib
        ax.boxplot(data, vert=False, **style)
    counts = has["category"].value_counts()
    # Label each row with how many descriptions it is based on, so tiny samples are visible.
    ax.set_yticks(range(1, len(order) + 1), [f"{c}  (n={counts[c]:,})" for c in order])
    ax.set_xlabel("Description length (characters)")
    medians = has.groupby("category")["desc_len"].median()
    # Headline only categories with enough descriptions to trust the median.
    MIN_N = 100
    reliable = medians[counts.reindex(medians.index) >= MIN_N]
    if len(reliable):
        ax.set_title(f"{reliable.idxmax().capitalize()} have the longest descriptions "
                     f"(median {reliable.max():.0f} characters)")
    else:
        ax.set_title("Description length by category")
    finish(fig, ax, f"Items with a description only (n per category); headline uses n ≥ {MIN_N}",
           "figures/3_description_length.png")


def plot_image_grid(train, source, per_cat=6):
    cats = train["category"].value_counts().index.tolist()  # largest category first
    fig, axes = plt.subplots(len(cats), per_cat, figsize=(per_cat * 1.5, len(cats) * 1.6))
    if len(cats) == 1:
        axes = [axes]
    for r, cat in enumerate(cats):
        pool = train[train["category"] == cat]
        idx = pool.sample(min(per_cat, len(pool)), random_state=SEED).index
        for c in range(per_cat):
            ax = axes[r][c]
            ax.set_axis_off()
            if c < len(idx):
                try:
                    ax.imshow(get_image(source, idx[c]))
                except Exception:
                    ax.text(0.5, 0.5, "could not load", ha="center", va="center", color=INK_2, fontsize=8)
        axes[r][0].text(-0.08, 0.5, cat, transform=axes[r][0].transAxes, ha="right", va="center",
                        fontsize=10, color=INK)
    height = fig.get_figheight()  # place title lines a fixed distance (in inches) from the top
    fig.text(0.02, 1 - 0.15 / height, "Sample product images by category", ha="left", va="top",
             fontsize=14, fontweight="bold")
    fig.text(0.02, 1 - 0.45 / height, f"{per_cat} random training items per category, largest category first",
             ha="left", va="top", color=INK_2, fontsize=9.5)
    fig.tight_layout(rect=(0.08, 0, 1, 1 - 0.75 / height))
    fig.savefig("figures/4_sample_images.png", dpi=150)
    plt.close(fig)

# --------------------------------------------------------------------------- main
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", help="local parquet instead of downloading from Hugging Face")
    args = parser.parse_args()
    for d in OUT_DIRS:
        os.makedirs(d, exist_ok=True)

    print("1/6 Loading data ...")
    meta, source = load_data(args.input)
    meta = meta.reset_index(drop=True)
    print(f"    {len(meta):,} rows, columns: {list(meta.columns)}")

    print("2/6 Auditing ...")
    a = audit(meta)
    img_a = image_audit(source, meta)

    print("3/6 Cleaning ...")
    df, log = clean(meta)
    for line in log:
        print("    " + line)
    write_audit(a, img_a)
    with open("reports/audit.md", "a", encoding="utf-8") as f:
        f.write("\n## Cleaning log\n\n" + "\n".join(f"- {l}" for l in log) + "\n")

    print("4/6 Reserving test set ...")
    train, test = split(df)
    train.to_parquet("data/clean/train.parquet")
    test.to_parquet("data/clean/test.parquet")
    print(f"    train {len(train):,} | test {len(test):,} (test is reserved - do not explore)")

    print("5/6 Writing data dictionary ...")
    write_dictionary(meta, df)

    print("6/6 Plotting (train set only) ...")
    set_style()
    plot_category_distribution(train)
    plot_missing_by_category(train)
    plot_description_length(train)
    plot_image_grid(train, source)
    print("Done. See reports/audit.md, docs/data_dictionary.md, figures/")


if __name__ == "__main__":
    main()
