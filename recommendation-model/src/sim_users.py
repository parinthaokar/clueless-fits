"""Step 4 (secondary): SIMULATED users to test the "daily picks + steer with a prompt" idea.

There is no real user data in Polyvore-items, so users are synthetic and results are only a sanity
check of the recommender mechanics, NOT evidence of real-world taste prediction.

How fake users are made (kept independent of the image model):
  * items from the TEST split are clustered into "styles" using only their TEXT (TF-IDF -> SVD -> KMeans)
  * each user favours 2 styles (70/30 mix); likes 40 items (10% random noise); 30 = history, 10 = held-out
Recommenders see only the user's history item IMAGES (taste vector = mean image embedding).

usage: python src/sim_users.py
"""
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer

OUT = "outputs"
rng = np.random.default_rng(1)
meta = pd.read_parquet("data/meta.parquet")
sel = open(f"{OUT}/selected_model.txt").read()
tag = "fashionclip" if "FashionCLIP" in sel else "clip"
print("using embeddings of:", tag)

test = np.where(meta.split.values == "test")[0]
cats = meta.category.values
raw_img = np.load(f"{OUT}/{tag}_img.npy")
ad_img, ad_txt = np.load(f"{OUT}/{tag}_adapted_img.npy"), np.load(f"{OUT}/{tag}_adapted_txt.npy")

# ---- fake users --------------------------------------------------------------------------
X = TfidfVectorizer(min_df=2, sublinear_tf=True).fit_transform(meta.url_name.values[test])
Z = TruncatedSVD(40, random_state=0).fit_transform(X)
K = 25
style = KMeans(K, n_init=3, random_state=0).fit_predict(Z / (np.linalg.norm(Z, axis=1, keepdims=True) + 1e-9))
by_style = [np.where(style == k)[0] for k in range(K)]  # indices into `test`
N_USERS = 400
users = []
for _ in range(N_USERS):
    s = rng.choice(K, 2, replace=False)
    liked = list(rng.choice(by_style[s[0]], 28, replace=len(by_style[s[0]]) < 28)) + \
            list(rng.choice(by_style[s[1]], 8, replace=len(by_style[s[1]]) < 8)) + list(rng.choice(len(test), 4, replace=False))
    liked = rng.permutation(np.unique(liked))
    users.append((liked[:-10], liked[-10:]))  # history, held-out (indices into `test`)
print(f"{N_USERS} simulated users, {K} text-derived styles")

G_cat = cats[test]


def run(score_fn, k=10):
    rec, hit = [], []
    for hist, held in users:
        sc = score_fn(hist).copy()
        sc[hist] = -1e9  # never re-recommend seen items
        top = np.argpartition(-sc, k)[:k]
        n = len(set(top) & set(held))
        rec.append(n / len(held)); hit.append(n > 0)
    return np.mean(rec), np.mean(hit)


def taste(img, hist):
    v = img[test][hist].mean(0)
    return img[test] @ (v / np.linalg.norm(v))


def cat_freq(hist):  # baseline: favour the categories seen most in history, random inside
    vc = pd.Series(G_cat[hist]).value_counts(normalize=True)
    return pd.Series(G_cat).map(vc).fillna(0).values + rng.random(len(test)) * 1e-5


rows = [("Random", lambda h: rng.random(len(test))),
        ("Baseline: favourite-categories", cat_freq),
        (f"A: {tag} zero-shot taste vector", lambda h: taste(raw_img, h)),
        (f"Selected ({tag} adapted) taste vector", lambda h: taste(ad_img, h))]
res = pd.DataFrame([(n, *run(f)) for n, f in rows], columns=["recommender", "Recall@10 (held-out likes)", "HitRate@10"]).round(4)
res.to_csv(f"{OUT}/sim_users_daily_picks.csv", index=False)
print("\n=== Daily picks (taste vector from history only) ===\n", res.to_string(index=False))

# ---- steering: taste vector + a text prompt ("show me more <category>") -----------------------
# prompt vector = average adapted TEXT embedding of train prompts of that category
tr = np.where(meta.split.values == "train")[0]
proto = {c: (lambda v: v / np.linalg.norm(v))(ad_txt[tr[cats[tr] == c]].mean(0)) for c in np.unique(cats)}
rows = []
for alpha in [0, 0.25, 0.5, 1.0, 2.0, 4.0]:
    follow, rec = [], []
    for hist, held in users:
        c = pd.Series(G_cat[held]).mode()[0]  # the user's "prompt": a category they will like next
        v = ad_img[test][hist].mean(0); v /= np.linalg.norm(v)
        sc = ad_img[test] @ v + alpha * (ad_img[test] @ proto[c])
        sc[hist] = -1e9
        top = np.argpartition(-sc, 10)[:10]
        follow.append((G_cat[top] == c).mean())
        held_c = [h for h in held if G_cat[h] == c]
        rec.append(len(set(top) & set(held_c)) / max(1, len(held_c)))
    rows.append((alpha, np.mean(follow), np.mean(rec)))
st = pd.DataFrame(rows, columns=["prompt weight alpha", "prompt-following (share of top10 in asked category)", "Recall@10 of held-out likes in that category"]).round(4)
st.to_csv(f"{OUT}/sim_users_steering.csv", index=False)
print("\n=== Steering with a prompt ===\n", st.to_string(index=False))
