"""Step 3: compare baseline + candidate models with ONE shared protocol.

Task    : text prompt -> ranked list of clothing items (gallery = images only).
Queries : each item's url_name (short natural-language description).
Relevant: gallery items whose url_name equals the query (the item itself + exact duplicates).
Split   : grouped by url_name -> train / val / test, no prompt text shared across splits.
Metrics : Recall@1/5/10 (hit rate), MRR, CatMatch@10 (share of the top-10 with the right clothing
          category - a softer "is this at least the right kind of item" score).
Selection uses VAL only; TEST is reported once at the end.

usage: python src/evaluate.py
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

SEED = 0
torch.manual_seed(SEED)
rng = np.random.default_rng(SEED)
OUT = "outputs"
meta = pd.read_parquet("data/meta.parquet")
CATS = sorted(meta["category"].unique())
cat_id = meta["category"].map({c: i for i, c in enumerate(CATS)}).values
TAGS = [t for t in ["clip", "fashionclip"] if os.path.exists(f"{OUT}/{t}_img.npy")]
EMB = {t: (np.load(f"{OUT}/{t}_txt.npy"), np.load(f"{OUT}/{t}_img.npy")) for t in TAGS}
NICE = {"clip": "CLIP ViT-B/32", "fashionclip": "FashionCLIP"}


# ----------------------------------------------------------------------------- evaluation core
class Split:
    """Queries (unique url_names) vs gallery (all items) of one split."""

    def __init__(self, name):
        self.g = np.where(meta["split"].values == name)[0]  # gallery rows
        names = meta["url_name"].values[self.g]
        codes, uniq = pd.factorize(names)
        first = pd.Series(np.arange(len(codes))).groupby(codes).first().values  # one query per name
        self.q = self.g[first]  # query rows (into meta)
        self.rel = codes[first][:, None] == codes[None, :]  # [nq, ng] relevance
        self.gcat = cat_id[self.g]
        self.qcat = cat_id[self.q]
        self.name = name


def evaluate(S, sp):
    """S: [nq, ng] score matrix (higher = better). Returns per-query DataFrame."""
    S = torch.as_tensor(S, dtype=torch.float32)
    rel = torch.as_tensor(sp.rel)
    best_rel = S.masked_fill(~rel, -1e9).max(1).values
    greater = (S > best_rel[:, None]).sum(1)
    ties = ((S == best_rel[:, None]) & ~rel).sum(1)  # non-relevant items with exactly the same score
    rank = 1 + greater + 0.5 * ties  # mid-rank: ties never get a free win
    top = torch.topk(S, 10, dim=1).indices.numpy()
    gcat = sp.gcat[top]
    return pd.DataFrame({
        "rank": rank.numpy(),
        "r1": (rank <= 1).numpy(), "r5": (rank <= 5).numpy(), "r10": (rank <= 10).numpy(),
        "rr": (1.0 / rank).numpy(),
        "cat10": (gcat == sp.qcat[:, None]).mean(1),
        "top1_cat": gcat[:, 0],
        "qcat": sp.qcat,
    })


def summarize(df):
    return pd.Series({"Recall@1": df.r1.mean(), "Recall@5": df.r5.mean(), "Recall@10": df.r10.mean(),
                      "MRR": df.rr.mean(), "CatMatch@10": df.cat10.mean()})


# ----------------------------------------------------------------------------- models
_CLF = {}


def cat_proba(sp):
    """P(category | prompt) from a TF-IDF + logistic-regression text classifier fit on TRAIN only."""
    if not _CLF:
        tr = meta[meta.split == "train"]
        vec = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)
        clf = LogisticRegression(max_iter=1000, C=5.0).fit(vec.fit_transform(tr["url_name"]), tr["category"])
        assert list(clf.classes_) == CATS
        _CLF.update(vec=vec, clf=clf)
    return _CLF["clf"].predict_proba(_CLF["vec"].transform(meta["url_name"].values[sp.q]))


def baseline_scores(sp):
    """Text-only baseline: predict the CATEGORY from the prompt, return items of the likeliest
    category in random order (it never looks at images)."""
    P = cat_proba(sp)
    return P[:, sp.gcat] + rng.random((len(sp.q), len(sp.g))) * 1e-5


def zero_shot_scores(tag, sp):
    T, I = EMB[tag]
    return T[sp.q] @ I[sp.g].T


class Head(nn.Module):
    """Residual MLP adapter: out = normalize(x + MLP(x)); starts as identity (= zero-shot model)."""

    def __init__(self, d, h=1024, p=0.1):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(d, h), nn.GELU(), nn.Dropout(p), nn.Linear(h, d))
        nn.init.zeros_(self.net[3].weight)
        nn.init.zeros_(self.net[3].bias)

    def forward(self, x):
        return F.normalize(x + self.net(x), dim=-1)


def train_adapter(tag, val, max_epochs=40, patience=4, bs=1024, lr=3e-4):
    """Candidate B: keep the big CLIP encoders frozen, learn small text+image adapters with a
    contrastive (InfoNCE) loss on TRAIN pairs. Early-stop on VAL MRR."""
    T, I = [torch.tensor(a) for a in EMB[tag]]
    tr = np.where(meta["split"].values == "train")[0]
    names = pd.factorize(meta["url_name"].values)[0]
    ht, hi = Head(T.shape[1]), Head(T.shape[1])
    log_scale = nn.Parameter(torch.tensor(np.log(50.0), dtype=torch.float32))
    opt = torch.optim.AdamW(list(ht.parameters()) + list(hi.parameters()) + [log_scale], lr=lr, weight_decay=1e-2)
    best, best_state, bad, hist = -1, None, 0, []

    def val_mrr():
        ht.eval(); hi.eval()
        with torch.no_grad():
            S = ht(T[val.q]) @ hi(I[val.g]).T
        return evaluate(S.numpy(), val).rr.mean()

    for ep in range(max_epochs):
        ht.train(); hi.train()
        perm = rng.permutation(tr)
        tot = 0
        for i in range(0, len(perm) - bs + 1, bs):
            b = perm[i:i + bs]
            logits = log_scale.exp() * ht(T[b]) @ hi(I[b]).T
            same = torch.tensor(names[b][:, None] == names[b][None, :]) & ~torch.eye(len(b), dtype=torch.bool)
            logits = logits.masked_fill(same, -1e4)  # identical prompts are not negatives
            y = torch.arange(len(b))
            loss = (F.cross_entropy(logits, y) + F.cross_entropy(logits.T, y)) / 2
            opt.zero_grad(); loss.backward(); opt.step()
            tot += loss.item()
        m = val_mrr()
        hist.append((ep + 1, tot / max(1, len(perm) // bs), m))
        print(f"  [{tag} adapter] epoch {ep + 1:2d} train_loss {hist[-1][1]:.3f} val_MRR {m:.4f}")
        if m > best:
            best, bad = m, 0
            best_state = ({k: v.clone() for k, v in ht.state_dict().items()}, {k: v.clone() for k, v in hi.state_dict().items()})
        else:
            bad += 1
            if bad >= patience:
                break
    ht.load_state_dict(best_state[0]); hi.load_state_dict(best_state[1]); ht.eval(); hi.eval()
    with torch.no_grad():
        At, Ai = ht(T).numpy(), hi(I).numpy()
    np.save(f"{OUT}/{tag}_adapted_txt.npy", At)
    np.save(f"{OUT}/{tag}_adapted_img.npy", Ai)
    pd.DataFrame(hist, columns=["epoch", "train_loss", "val_mrr"]).to_csv(f"{OUT}/{tag}_adapter_training.csv", index=False)
    return At, Ai


# ----------------------------------------------------------------------------- run
if __name__ == "__main__":
    val, test = Split("val"), Split("test")
    print(f"val: {len(val.q)} queries over {len(val.g)} items | test: {len(test.q)} queries over {len(test.g)} items")

    scorers = {"Baseline: TF-IDF category guess": lambda sp: baseline_scores(sp)}
    for t in TAGS:
        scorers[f"A: {NICE[t]} (zero-shot)"] = (lambda tag: lambda sp: zero_shot_scores(tag, sp))(t)
    for t in TAGS:
        At, Ai = train_adapter(t, val)
        scorers[f"B: {NICE[t]} + trained adapter"] = (lambda At, Ai: lambda sp: At[sp.q] @ Ai[sp.g].T)(At, Ai)

    # Candidate C: adapter visual score + lambda * P(category | prompt); lambda tuned on VAL only
    for t in TAGS:
        At, Ai = np.load(f"{OUT}/{t}_adapted_txt.npy"), np.load(f"{OUT}/{t}_adapted_img.npy")
        Pv = cat_proba(val)[:, val.gcat]
        grid = [0, 0.05, 0.1, 0.2, 0.3, 0.5, 1.0]
        mrrs = [evaluate(At[val.q] @ Ai[val.g].T + lam * Pv, val).rr.mean() for lam in grid]
        lam = grid[int(np.argmax(mrrs))]
        print(f"  [{t} hybrid] lambda grid {dict(zip(grid, np.round(mrrs, 4)))} -> chosen {lam}")
        scorers[f"C: {NICE[t]} adapter + category prior"] = (lambda At, Ai, lam: lambda sp: At[sp.q] @ Ai[sp.g].T + lam * cat_proba(sp)[:, sp.gcat])(At, Ai, lam)

    res = {"val": {}, "test": {}}
    per_q = {"val": {}, "test": {}}
    for name, fn in scorers.items():
        for sp in (val, test):
            d = evaluate(fn(sp), sp)
            per_q[sp.name][name] = d
            res[sp.name][name] = summarize(d)
    for s in ("val", "test"):
        tbl = pd.DataFrame(res[s]).T.round(4)
        tbl.to_csv(f"{OUT}/results_{s}.csv")
        print(f"\n=== {s.upper()} ===\n{tbl.to_string()}")

    # ---- model selection on VAL (MRR; candidates only)
    cands = [n for n in scorers if not n.startswith("Baseline")]
    ranked = sorted(cands, key=lambda n: -res["val"][n]["MRR"])
    sel, runner = ranked[0], ranked[1]
    print(f"\nSELECTED (best val MRR): {sel}\nRunner-up: {runner}")

    # ---- paired bootstrap CI for the selected vs runner-up (on TEST)
    a, b = per_q["test"][sel].rr.values, per_q["test"][runner].rr.values
    idx = rng.integers(0, len(a), (2000, len(a)))
    diff = (a[idx] - b[idx]).mean(1)
    print(f"Test MRR diff (selected - runner-up): {np.mean(a - b):+.4f}  95% CI [{np.percentile(diff, 2.5):+.4f}, {np.percentile(diff, 97.5):+.4f}]")
    base = [n for n in scorers if n.startswith("Baseline")][0]
    bb = per_q["test"][base].rr.values
    d2 = (a[idx] - bb[idx]).mean(1)
    print(f"Test MRR diff (selected - baseline): {np.mean(a - bb):+.4f}  95% CI [{np.percentile(d2, 2.5):+.4f}, {np.percentile(d2, 97.5):+.4f}]")

    # ---- error analysis on TEST: by group
    q_meta = meta.iloc[test.q].reset_index(drop=True)
    q_meta["Query length"] = pd.cut(q_meta.q_len, [0, 3, 4, 5, 20], labels=["<=3 words", "4 words", "5 words", "6+ words"])
    q_meta["Has description"] = np.where(q_meta.has_desc, "has description", "no description")
    q_meta["Category"] = q_meta["category"]
    rows = []
    for grp in ["Category", "Query length", "Has description"]:
        for model in (base, sel):
            d = per_q["test"][model].copy()
            d["g"] = q_meta[grp].values
            for gv, sub in d.groupby("g", observed=True):
                rows.append({"group_type": grp, "group": gv, "model": model, "n": len(sub), **summarize(sub).round(4).to_dict()})
    grp_df = pd.DataFrame(rows)
    grp_df.to_csv(f"{OUT}/error_by_group_test.csv", index=False)
    print("\n=== Selected model by group (TEST) ===")
    print(grp_df[grp_df.model == sel].drop(columns="model").to_string(index=False))

    # confusion: query category -> category of top-1 result
    d = per_q["test"][sel]
    conf = pd.crosstab(pd.Series(np.array(CATS)[d.qcat], name="true"), pd.Series(np.array(CATS)[d.top1_cat], name="top1"), normalize="index").round(3)
    conf.to_csv(f"{OUT}/confusion_top1_category_test.csv")
    print("\n=== top-1 category confusion (rows=query category) ===\n", conf.to_string())

    # worst failures (relevant item ranked > 100) for the write-up
    d = per_q["test"][sel].copy()
    d["query"] = q_meta.url_name.values
    d["category"] = q_meta.category.values
    d["top1_pred"] = np.array(CATS)[d.top1_cat]
    d.sort_values("rank", ascending=False).head(25)[["query", "category", "top1_pred", "rank"]].to_csv(f"{OUT}/worst_failures_test.csv", index=False)
    d[(d["rank"] > 10) & (d.cat10 >= 0.9)].sample(15, random_state=0)[["query", "category", "rank"]].to_csv(f"{OUT}/right_category_wrong_item_test.csv", index=False)

    # ---- figures
    names = list(scorers)
    fig, ax = plt.subplots(1, 2, figsize=(11, 3.8))
    t = pd.DataFrame(res["test"]).T.loc[names]
    t[["Recall@1", "Recall@10", "MRR"]].plot.bar(ax=ax[0], rot=25)
    ax[0].set_title("Test retrieval metrics"); ax[0].set_xticklabels([n.replace(": ", ":\n", 1) for n in names], fontsize=6, ha="right")
    g = grp_df[(grp_df.group_type == "Category")].pivot(index="group", columns="model", values="CatMatch@10")[[base, sel]]
    g.plot.bar(ax=ax[1], rot=35); ax[1].set_title("CatMatch@10 by category (test)"); ax[1].legend(fontsize=6)
    plt.tight_layout(); plt.savefig(f"{OUT}/fig_comparison.png", dpi=160)

    with open(f"{OUT}/selected_model.txt", "w") as f:
        f.write(sel)
