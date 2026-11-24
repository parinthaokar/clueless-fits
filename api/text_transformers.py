"""Custom scikit-learn transformer for the category Pipeline.

Lives in its own module (not a notebook or __main__) so joblib can import it on Modal.
"""

import re
import unicodedata
from urllib.parse import unquote

import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

COLUMNS = ["url_name", "title", "description"]


def clean_text(s: str) -> str:
    """URL-decode, fold accents to ASCII, lowercase, keep letters only, collapse spaces."""
    s = unquote(s)
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-z]+", " ", s.lower())
    return s.strip()


class ItemTextCleaner(BaseEstimator, TransformerMixin):
    """Turns the item's text fields into ONE clean string for TF-IDF.

    Why it matters for Polyvore data:
      * ~70% of items have no title/description, so the short url_name is often the only text.
      * names are URL slugs, sometimes percent-encoded or accented ("%E3%83..", "t-shirt").
      * the API sends the same text as both url_name and title, and the dataset has repeats;
        identical fields are counted once so the same words aren't double-weighted.
      * digits and sizes ("2pcs", "xl", "32") don't say what kind of item it is, so they are dropped.
      * description is capped to its first `max_description_words` words (long ones swamp the name).
    Stateless (nothing to learn), but a real transformer: fit/transform with sklearn's API,
    pickled inside the Pipeline.
    """

    def __init__(self, max_description_words: int = 30):
        self.max_description_words = max_description_words

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        df = pd.DataFrame(X).reindex(columns=COLUMNS).fillna("").astype(str)
        out = []
        for name, title, desc in df.itertuples(index=False):
            parts, seen = [], set()
            desc = " ".join(clean_text(desc).split()[: self.max_description_words])
            for field in (name, title):
                c = clean_text(field)
                if c and c not in seen:
                    seen.add(c)
                    parts.append(c)
            if desc and desc not in seen:
                parts.append(desc)
            out.append(" ".join(parts))
        return pd.Series(out)
