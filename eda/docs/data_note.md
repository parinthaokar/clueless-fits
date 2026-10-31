# Data Note - Polyvore Outfit Item Metadata (D2)

**Project:** Clueless-inspired outfit recommender
**Dataset:** [`owj0421/polyvore`](https://huggingface.co/datasets/owj0421/polyvore) (Hugging Face)

## 1. Data source and access

We use `owj0421/polyvore`, a Hugging Face re-hosting of item-level metadata
and product images from Polyvore, a fashion styling site. The underlying
data traces back to the Polyvore Outfits dataset introduced by Vasileva et
al., *"Learning Type-Aware Embeddings for Fashion Compatibility"* (ECCV
2018). Licensing follows the original Polyvore Outfits terms (research use);
this note doesn't restate that license in full, so check the current
Hugging Face dataset card before any non-research use.

Access is via the `datasets` library (`load_dataset("owj0421/polyvore",
split="data")`), which streams/caches a one-time ~2.2 GB download. Our
pipeline (`eda/eda.py`) loads the metadata table separately from the image
bytes so all 251,008 images are never held in memory at once.

This dataset release is **item-level only**: one row per clothing item or
accessory (id, name, title, description, category, image). It does **not**
include outfit groupings or compatibility labels - see Section 6.

## 2. Audit findings

Full numbers are in `eda/reports/audit.md`. On the raw 251,008-row table:

| Check | Result |
|---|---|
| Rows / columns | 251,008 rows x 5 metadata columns (item_id, url_name, title, description, category) |
| Duplicate `item_id` | 0 |
| Duplicate full rows | 0 |
| Same `url_name` + `title` under different ids | 26,736 |
| URL-encoded `url_name` values (e.g. `%C3%A9`) | 5,558 |
| Items with non-ASCII text in title/description | 10,496 (4.2%) |
| Category imbalance (largest / smallest) | 9.2x |
| Missing title / description (null + empty string) | 70.2% / 71.3% |
| Image sample check (n=300) | 0 failed to open; all 300x300 |

## 3. Cleaning steps (with row counts)

Starting from 251,008 raw rows, `eda.py` applies, in order:

1. **Empty strings → missing.** Whitespace-only text treated as null:
   `url_name` 0, `title` 176,156, `description` 178,856 values converted.
2. **URL-decode `url_name`.** 5,558 values changed (e.g. `chlo%C3%A9` →
   `chloé`).
3. **Drop duplicate `item_id`** (keep first). 0 rows dropped (none found).
4. **Drop rows with no `category`.** 0 rows dropped (category is complete).
5. **Add derived helper columns**: `has_title`, `has_description`,
   `desc_len`, `non_ascii` (used for EDA, not modeling features yet).

**Final cleaned row count: 251,008** (no rows were removed by cleaning;
only text values were normalized/decoded).

## 4. Data dictionary summary

Full table in `eda/docs/data_dictionary.md`. 10 fields after cleaning: 5
raw (`item_id`, `image`, `url_name`, `title`, `description`, `category`)
plus 4 derived flags (`has_title`, `has_description`, `desc_len`,
`non_ascii`). `category` has 11 classes (accessories, all-body, bags,
bottoms, hats, jewellery, outerwear, scarves, shoes, sunglasses, tops) and
is the target for item-type classification. `title` and `description` are
the only fields with meaningful missingness (70.2% and 71.3%).

## 5. Plots and interpretations

Figures in `eda/figures/`; full interpretations in
`eda/docs/plot_interpretations.md`.

1. **Items per category** (`1_category_distribution.png`) - Shoes is
   largest (17.9%), scarves smallest (2.0%): a moderate ~9.2x imbalance.
   We'll use class-weighted loss / stratified sampling rather than drop any
   category.
2. **Missing text by category** (`2_missing_text_by_category.png`) - 70%
   missing title / 71% missing description overall, but sunglasses, hats,
   scarves, bags, jewellery, and accessories are ~100% missing both fields,
   while bottoms is "only" ~25-28% missing. Text is therefore unusable for
   most accessory-type categories; the recommender's core matching will run
   on images, with text as a bonus signal for categories (tops, bottoms,
   shoes, etc.) where it's actually present.
3. **Description length** (`3_description_length.png`) - Now shows n per
   category and restricts its headline to categories with n ≥ 100. Shoes
   has the longest trustworthy median (213 characters, n=22,251); bottoms,
   tops, all-body, and outerwear are similar. Accessories (n=1) and
   jewellery (n=1) have only a single description each, so their medians
   are not trustworthy. Separately, description length caps at exactly
   4,096 characters, suggesting truncation by the source rather than a
   natural stopping point.
4. **Sample product images** (`4_sample_images.png`) - A 6-per-category
   grid confirms clean, consistent 300x300 product photography overall, but
   a few jewellery/sunglasses items are sketch-style illustrations rather
   than real photos - a minor inconsistency to spot-check before relying on
   image embeddings for those categories.

## 6. Data-quality and sampling concerns

Full detail in `eda/docs/concerns.md`.

**Data quality:** missing titles/descriptions (~70% overall); descriptions
concentrated in clothing categories (shoes, bottoms, tops, all-body,
outerwear) and nearly absent for accessory categories; 26,736 possible
duplicates (url_name + title matches, many with blank titles, so not
confirmed true duplicates); 5,558 URL-encoded names (decoded during
cleaning); 4.2% non-ASCII text (mostly accented brand names plus some
genuinely non-English text); descriptions apparently truncated at 4,096
characters; and some sketch-style images in place of real photos.

**Sampling:** Polyvore's user base skewed toward women's and luxury fashion
around 2016, before the site shut down in 2018, so results may not
generalize to menswear, budget fashion, or current trends; images are
retail/catalog product photos, not real-closet photos, creating a domain
shift versus real user uploads; a moderate 9.2x category imbalance; text
collected unevenly by category (see Section 5, plot 2); and this dataset
version has **no outfit or compatibility labels**, which our research
question (recommending compatible outfits) requires - we'll need the
original Polyvore Outfits files (outfit-to-item mappings and compatibility
data) before moving from item-level EDA to outfit-level modeling.

## 7. Reserved test data

Before any plotting or exploration, `eda.py` reserves a **stratified 80/20
train/test split by `category`** (`train_test_split(..., test_size=0.20,
random_state=42, stratify=df["category"])`), saved to
`data/clean/train.parquet` and `data/clean/test.parquet`. All plots,
audits, and dashboard views in this note use the **train split only**; the
test split is excluded from EDA and from the dashboard and reserved for
later model evaluation.

## 8. Links

- **Repo:** https://github.com/parinthaokar/clueless-fits
- **Tag:** d2
- **Dashboard:**
  https://aviveka2--clueless-closet-d2-dashboard-run.us-east.modal.run
