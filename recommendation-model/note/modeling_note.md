---
title: "Modeling Note: Text-to-Clothing Retrieval for the Recommendation App"
---

## 1. Task and data

The app needs a model that turns a user's request ("black leather ankle boots") into a ranked list of clothing items, and that can also rank items for a user from their taste history. We use the Polyvore dataset (`owj0421/polyvore`): per item an image, a category (11 classes), and mostly empty `title`/`description` fields (about 70% empty). The always-present `url_name` (about 5 words, e.g. "marc jacobs fold down army") is therefore used as the text prompt. We used the first of six shards (41,835 items) to keep embedding feasible on a laptop.

**Evaluation task.** Each unique `url_name` is a query; the gallery is the *images only* of one split; a result is relevant if it is the item with that name. **Split:** 70/15/15 train/val/test, grouped by `url_name` so no prompt text appears in two splits (verified: 0 names in more than one split). Val has 6,006 queries over 6,308 items, test 6,006 queries over 6,268 items. **Metrics (identical for every model):** Recall@1/5/10, MRR, and CatMatch@10 (share of the top-10 with the correct clothing category, a softer "right kind of item" score). Ties are scored at mid-rank so no model gains from tied scores. Models are selected on **val only**; test is reported once.

## 2. Models compared

| | Model | Idea |
|---|---|---|
| Baseline | TF-IDF + logistic regression | Guess the *category* from the prompt, return that category's items in random order. Never sees an image. |
| A | Zero-shot CLIP ViT-B/32; zero-shot FashionCLIP | Pretrained image and text encoders embed both in one space; rank by cosine similarity. No training. |
| B | A + trained adapter | Encoders frozen; a small residual MLP on each side trained with a contrastive loss on train pairs (identical prompts masked as false negatives), early-stopped on val MRR. |
| C | B + category prior | B's similarity plus λ·P(category \| prompt) from the baseline classifier; λ chosen on val. |

Each of A, B, C was run on two backbones (generic CLIP, fashion-specific FashionCLIP), giving six candidates.

## 3. Results

| Test set | Recall@1 | Recall@5 | Recall@10 | MRR | CatMatch@10 |
|---|---|---|---|---|---|
| Baseline: TF-IDF category guess | 0.0005 | 0.0070 | 0.0142 | 0.0092 | 0.8365 |
| A: CLIP (zero-shot) | 0.1096 | 0.2494 | 0.3347 | 0.1857 | 0.7215 |
| A: FashionCLIP (zero-shot) | 0.3556 | 0.6022 | 0.6916 | 0.4685 | 0.7840 |
| B: CLIP + adapter | 0.1380 | 0.3047 | 0.4023 | 0.2249 | 0.7400 |
| B: FashionCLIP + adapter | 0.3884 | 0.6472 | 0.7386 | 0.5068 | 0.7771 |
| C: CLIP + adapter + prior | 0.1470 | 0.3162 | 0.4182 | 0.2357 | 0.8390 |
| **C: FashionCLIP + adapter + prior** | **0.3913** | **0.6528** | **0.7408** | **0.5100** | 0.8317 |

![Test metrics (left) and CatMatch@10 by category, baseline vs. selected model (right).](../outputs/fig_comparison.png){width=95%}

**Selected model: C with FashionCLIP** (best val MRR 0.5165 vs. 0.5130 for B and 0.4717 for zero-shot). The justification has three parts. (1) *Backbone matters most*: FashionCLIP roughly doubles generic CLIP's MRR (0.47 vs. 0.19 zero-shot), so domain pretraining is the biggest lever. (2) *The adapter adds a real but moderate gain* (+0.04 MRR on FashionCLIP, +0.04 on CLIP), and its training curve peaks around epoch 5-6 then overfits, so early stopping is needed. (3) *The category prior is small for exact retrieval but fixes the type-level errors*: on FashionCLIP it adds only +0.0032 test MRR (paired bootstrap 95% CI [+0.0011, +0.0052]: significant but tiny) yet lifts CatMatch@10 from 0.777 to 0.832, matching the text-only baseline's 0.837. For a chatbot, returning the wrong *kind* of item is the most visible failure, so we prefer C. Over the baseline the MRR gain is +0.50 (CI [+0.49, +0.51]). The baseline is a useful reference rather than a strawman: it is the best at CatMatch among non-hybrid models but cannot pick an individual item.

## 4. Error Analysis & Personalization Check

### Performance by Category
* **Easiest to retrieve:** Distinct items like **hats** (87% Recall@10), **accessories** (79%), and **outerwear** (76%) perform best.
* **Hardest to isolate:** **Sunglasses** have the lowest exact-item recall (59%)—not because the model misses the category (88% CatMatch), but because so many pairs look nearly identical.
* **Category overlaps:** Broad labels cause the most confusion. **Scarves** (51% CatMatch@10) and **accessories** (56%) frequently overlap with bags and jewelry. Visual silhouettes also cause occasional mix-ups, with dresses mistaken for tops 12% of the time and outerwear mistaken for tops 7% of the time.

### Impact of Search Phrasing
* **Prompt length:** Very short queries (≤3 words) easily find the right *type* of item (90% CatMatch), but lack the detail needed to pinpoint the exact product (59% Recall@10 vs. 81% for 4-word queries).
* **Item descriptions:** Products with written descriptions score slightly higher (0.53 vs. 0.50 MRR), showing that branded, better-documented pieces give the model clearer signals.

### Why the Worst Misses Happen
* **Non-visual prompts:** The lowest-ranked predictions (rank > 3,400 out of ~6,300) happen when queries lack visual cues—such as URL-encoded non-English text (Japanese, Polish) or bare person/brand names (e.g., `"lucrecia berenschot"`).
* **"Good" misses:** Many items ranked just outside the top 10 (ranks 12–95) are still valid matches. Generic queries like `"earring set"` or `"silk georgette top"` have dozens of near-duplicates, meaning strict exact-item recall understates real-world usefulness.

### Personalization Sanity Check (Simulated Users)
To test recommendation mechanics without live user data, we generated **400 synthetic users** (each defined by two text-derived style preferences, 30 liked items, and 10 held-out test items):
* **Taste profiling:** Averaging a user's liked item embeddings achieves a **12.5% HitRate@10**, outperforming both a favorite-categories baseline (5.25%) and random guessing (2.25%).
* **Chat-steered recommendations:** Blending a user's taste vector with a chat prompt (e.g., `"show me more shoes"`) at weight `1.0` increases shoe recommendations from **58% to 92%** with zero drop in held-out recall—validating how daily picks can be steered via chat.

## 5. Limitations

- **Proxy queries.** Prompts are truncated URL slugs, not real user requests; real chat language (occasions, moods, "something for a wedding") is untested.
- **Relevance is exact-name only.** Near-duplicate items are counted as wrong, lowering recall; there is no human relevance judgment.
- **Scale and sampling.** One of six shards (~42k items) and a ~6k-item gallery; production catalogs are larger and metrics will drop. Shard category mix was not verified against the full set.
- **Simulated users.** Personalization results are on synthetic users, partly built from the same visual world; they show the mechanism works, not that real taste is predicted.
- **Pretraining overlap and licensing.** FashionCLIP's pretraining catalog may overlap with Polyvore products; the dataset license is "other" (original Polyvore terms).
- **Group analysis is limited** to category, prompt length and description presence: the dataset has no gender, body-type, price or region fields, so fairness across people cannot be examined. English-only brand-heavy prompts are favoured.
- **Single seed**, adapter hyper-parameters not tuned beyond early stopping and λ.

*Reproduce:* `python src/prepare.py`, `python src/embed.py clip openai/clip-vit-base-patch32`, `python src/embed.py fashionclip patrickjohncyh/fashion-clip`, `python src/evaluate.py`, `python src/sim_users.py`.
