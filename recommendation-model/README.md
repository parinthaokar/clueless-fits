# Clothing Recommendation Model (Polyvore)

Everything about the modeling part of the project, in one place. Read top to bottom.

---

## 1. What this project is

We're building a clothing recommendation app with:
1. an **AI chatbot** that recommends clothes from a user's prompt ("black leather ankle boots"), and
2. **daily picks** (like a Spotify daily playlist) that the user can steer with a prompt ("show me more shoes").

**My part is only the model.** The graded deliverable: compare a baseline and at least two candidate models using the same validation method and metrics, justify the selection, examine errors across groups, and submit runnable evaluation code plus a 2-3 page modeling note (`note/modeling_note.docx`).

## 2. The data

- Dataset: https://huggingface.co/datasets/owj0421/polyvore (items, ~200k rows).
- Each row: `item_id`, `image`, `url_name`, `title`, `description`, `category` (11 classes: shoes, jewellery, bags, tops, bottoms, all-body, outerwear, sunglasses, accessories, hats, scarves).
- **No users, no purchases, no outfits** in this version. That's why the "users" in the daily-picks test are simulated (fake).
- **About 70% of items have an empty `title` and `description`.** So I used `url_name` (about 5 words, e.g. "marc jacobs fold down army") as the text prompt.
- I used **only the first shard**: 41,835 items. Embedding all 200k on an 8 GB Mac would take much longer.

## 3. The task being tested

> Given a text prompt, rank clothing items (images only). Is the right item near the top?

- **Query:** an item's `url_name`.
- **Gallery:** the images of one split. Models only see images, not item text.
- **Relevant result:** the item with that name.
- **Split:** 70% train / 15% val / 15% test, **grouped by `url_name`**, so the same prompt text never appears in two splits (checked: 0 overlaps).
- **Same for every model:** same split, same queries, same gallery, same metrics.
- **Model choice uses val only.** Test was looked at once at the end.

### Metrics (plain words)
- **Recall@K:** in what share of queries is the right item in the top K results? (K = 1, 5, 10)
- **MRR:** average of 1/rank of the right item. 1.0 = always first, 0.5 = typically second. Higher is better.
- **CatMatch@10:** share of the top 10 results that are the right *category*. A softer "at least the right kind of item" score.
- Ties are scored at mid-rank, so a model can't win by returning tied scores.

## 4. The models (concepts first)

### Key idea: embeddings
An **embedding** is a list of numbers (here 512) that represents an image or a sentence. A model like CLIP is trained so that a picture and its description get *similar* numbers. Then "find items for this prompt" = "find images whose numbers are closest to the prompt's numbers" (cosine similarity).

### Baseline: TF-IDF + logistic regression
- Reads the words of the prompt and predicts the **category** only (e.g. "ankle boots" → shoes).
- Returns random items from that category.
- **Never looks at an image.**
- Purpose: a simple reference point. It's near zero on exact items but good at category.

### A: CLIP and FashionCLIP, zero-shot (no training)
- **CLIP** (`openai/clip-vit-base-patch32`): pretrained on millions of image-caption pairs from the internet.
- **FashionCLIP** (`patrickjohncyh/fashion-clip`): the same design, further trained on fashion catalog data.
- We embed every image and every prompt, then rank by closeness. No training on our data.

### B: A + trained adapter
- Freeze the big CLIP/FashionCLIP model. Add two tiny neural networks on top (one for text, one for images).
- Trained with a **contrastive loss**: a prompt should be close to its own item and far from the other items in the same batch (identical prompts are not counted as negatives).
- **Early stopping** on val MRR. It overfits after about epoch 5-6.
- Cheap to train: the big model is never re-run.

### C: B + category prior (the selected model, with FashionCLIP)
- Score = B's similarity + λ × P(category | prompt), where the category probability comes from the baseline classifier.
- In words: "look similar, and be the right kind of thing."
- λ was chosen on val (0.05 for FashionCLIP, 0.1 for CLIP).

Each of A, B, C was run on both CLIP and FashionCLIP, so there are **6 candidates + 1 baseline**.

## 5. Results (test set, 6,006 queries over 6,268 items)

| Model | Recall@1 | Recall@5 | Recall@10 | MRR | CatMatch@10 |
|---|---|---|---|---|---|
| Baseline: TF-IDF category guess | 0.0005 | 0.0070 | 0.0142 | 0.0092 | 0.8365 |
| A: CLIP (zero-shot) | 0.1096 | 0.2494 | 0.3347 | 0.1857 | 0.7215 |
| A: FashionCLIP (zero-shot) | 0.3556 | 0.6022 | 0.6916 | 0.4685 | 0.7840 |
| B: CLIP + adapter | 0.1380 | 0.3047 | 0.4023 | 0.2249 | 0.7400 |
| B: FashionCLIP + adapter | 0.3884 | 0.6472 | 0.7386 | 0.5068 | 0.7771 |
| C: CLIP + adapter + prior | 0.1470 | 0.3162 | 0.4182 | 0.2357 | 0.8390 |
| **C: FashionCLIP + adapter + prior (selected)** | **0.3913** | **0.6528** | **0.7408** | **0.5100** | 0.8317 |

### Why C with FashionCLIP
1. **Backbone matters most.** FashionCLIP roughly doubles generic CLIP's MRR (0.47 vs 0.19 zero-shot).
2. **The adapter helps moderately** (about +0.04 MRR on both backbones).
3. **The category prior is tiny for exact items** (+0.0032 MRR, 95% CI [+0.0011, +0.0052]) **but fixes wrong-type results** (CatMatch@10 0.777 → 0.832). For a chatbot, returning the wrong kind of item is the most visible failure.
4. Selected on val MRR: 0.5165 (C) vs 0.5130 (B) vs 0.4717 (A).

## 6. Error analysis (selected model, test)

- **By category:** easiest are hats (Recall@10 0.87), accessories (0.79), outerwear (0.76). Hardest is sunglasses (0.59): many near-identical products.
- **Confusing categories:** scarves (CatMatch 0.51) and accessories (0.56) are vague, overlapping classes. All-body items (dresses) are mistaken for tops 12% of the time.
- **By prompt length:** very short prompts (3 words or fewer) are worst for exact items (Recall@10 0.59 vs 0.81 for 4 words). Items that have a description score slightly higher (MRR 0.53 vs 0.50).
- **Worst failures:** prompts with no visual meaning, such as URL-encoded Japanese, Polish or other non-English text and bare brand or person names.
- **Many "misses" are near-duplicates:** "earring set" has dozens of valid answers, so exact-item recall *understates* usefulness.

## 7. Daily picks + steering (simulated users)

There is no real user data, so I created **400 fake users**:
- Items are clustered into 25 "styles" using only their text.
- Each user favours 2 styles, likes 40 items, and 10 are held out to test on.

**How the recommender works:** a user's *taste vector* = the average image embedding of their liked items. Recommend the nearest items they haven't seen.

| Recommender | HitRate@10 |
|---|---|
| Random | 0.0225 |
| Favourite-categories baseline | 0.0525 |
| FashionCLIP zero-shot taste vector | 0.0925 |
| Selected (adapted) taste vector | 0.1250 |

**Steering with a prompt:** add the prompt's embedding to the taste vector (weight α).
- α = 0: 58% of results are in the asked category.
- α = 1: 92%, with no loss of held-out recall.

This shows the mechanism works (chat message → shifts the picks). **It does not prove real taste prediction.**

## 8. Limitations (important for the note)

- Prompts are truncated URL slugs, **not real user chat** ("something for a wedding" is untested).
- Relevance = exact item name only. Near-duplicates count as wrong, which lowers recall. There are no human judgments.
- One shard (about 42k items) and a gallery of about 6k. Production catalogs are bigger, so metrics would drop.
- Users are simulated, partly built from the same visual world.
- FashionCLIP's pretraining data may overlap with Polyvore products. The dataset license is "other" (original Polyvore terms).
- The dataset has no gender, body-type, price or region fields, so group analysis is only by category, prompt length and description presence.
- English and brand-heavy prompts are favoured. Single random seed. Hyper-parameters were not tuned beyond early stopping and λ.

## 9. Files

```
README.md                      this file
requirements.txt               pinned Python packages
src/prepare.py                 loads data, makes the leak-free split
src/embed.py                   embeds all images + prompts with a CLIP-style model
src/evaluate.py                baseline + A/B/C comparison, metrics, error analysis, figure
src/sim_users.py               fake users: daily picks + prompt steering test
note/modeling_note.md/.docx    the 2-3 page write-up to submit
outputs/results_val.csv        val metrics for all models
outputs/results_test.csv       test metrics for all models
outputs/error_by_group_test.csv   metrics by category / prompt length / has-description
outputs/confusion_top1_category_test.csv   which categories get mixed up
outputs/worst_failures_test.csv, right_category_wrong_item_test.csv   example failures
outputs/*_adapter_training.csv training curves
outputs/fig_comparison.png     comparison figure (used in the note)
outputs/sim_users_*.csv        simulated-user results
outputs/selected_model.txt     name of the chosen model
```

## 10. How to run (about 15 min on an 8 GB Apple-silicon Mac)

```bash
cd recommendation-model   # from the repo root
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt rank_bm25 huggingface_hub
# download data-00000-of-00005.parquet from the Hugging Face dataset page to data/shard0.parquet
.venv/bin/python src/prepare.py
.venv/bin/python src/embed.py clip openai/clip-vit-base-patch32
.venv/bin/python src/embed.py fashionclip patrickjohncyh/fashion-clip
.venv/bin/python src/evaluate.py       # prints the comparison tables, writes outputs/
.venv/bin/python src/sim_users.py
```

Notes:
- The embedding steps take about 5 min each and need about 1.5 GB of disk for the model weights.
- Committed so you can use the selected model right away: `data/meta.parquet` (row order = embedding row order) and `outputs/fashionclip_adapted_{img,txt}.npy` (the selected model's embeddings, 512-d, one row per item/prompt).
- Not committed (regenerate with the steps above): the 352 MB raw shard `data/shard0.parquet` and the other `.npy` embeddings.

## 11. Glossary

- **Embedding:** a list of numbers representing an image or text, where similar things get similar numbers.
- **Zero-shot:** using a pretrained model as-is, with no training on our data.
- **Contrastive loss:** a training objective that pulls matching pairs together and pushes non-matching pairs apart.
- **Adapter:** a small trainable layer added on top of a frozen model.
- **Early stopping:** stop training when validation score stops improving, to avoid overfitting.
- **Bootstrap CI:** a confidence interval made by resampling queries many times, used to check whether a difference between two models is real.
- **Gallery / query:** the pool of items being searched / the prompt being searched with.
