"""
Clueless Closet - D2 data dashboard (Streamlit, reads from Supabase).

Run locally:   streamlit run app.py
Deploy:        modal deploy modal_app.py

Needs SUPABASE_URL and SUPABASE_ANON_KEY, from a local .env file,
.streamlit/secrets.toml, or (on Modal) a Modal secret. The anon key is
read-only because schema.sql only allows SELECT.
"""

import os

import altair as alt
import pandas as pd
import streamlit as st
from supabase import create_client

st.set_page_config(page_title="Clueless Closet: D2 Data Dashboard", page_icon="👗", layout="wide")


# ----------------------------------------------------------------------------- data access
def get_secret(name):
    if os.environ.get(name):
        return os.environ[name]
    try:
        return st.secrets[name]
    except Exception:
        return None


@st.cache_resource
def get_client():
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
    url, key = get_secret("SUPABASE_URL"), get_secret("SUPABASE_ANON_KEY")
    if not url or not key:
        st.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY. Add them to .env or your Modal secret.")
        st.stop()
    return create_client(url, key)


@st.cache_data(ttl=600)
def fetch_table(table):
    """Read a whole table, 1,000 rows per request (Supabase's default page size)."""
    sb, rows, start = get_client(), [], 0
    while True:
        page = sb.table(table).select("*").range(start, start + 999).execute().data
        rows.extend(page)
        if len(page) < 1000:
            break
        start += 1000
    return pd.DataFrame(rows)


summary = fetch_table("category_summary")
stats = fetch_table("dataset_stats")
items = fetch_table("items")

if summary.empty or items.empty:
    st.warning("Supabase tables are empty. Run `python load_supabase.py` first.")
    st.stop()

stat = dict(zip(stats["stat"], stats["value"])) if not stats.empty else {}

# ----------------------------------------------------------------------------- header
st.title("👗 Clueless Closet: Polyvore data dashboard")
st.caption("D2 data preparation and EDA. Every number here comes from the **training split**; "
           "the test split is reserved and not explored. Source: Hugging Face `owj0421/polyvore`.")

k = st.columns(5)
k[0].metric("Train items", f"{int(stat.get('train_items', summary['n_items'].sum())):,}")
k[1].metric("Test items (reserved)", f"{int(stat.get('test_items_reserved', 0)):,}")
k[2].metric("Categories", int(stat.get("n_categories", len(summary))))
k[3].metric("Titles missing", f"{stat.get('pct_missing_title', 0):.1f}%")
k[4].metric("Descriptions missing", f"{stat.get('pct_missing_desc', 0):.1f}%")

tab_cat, tab_missing, tab_text, tab_browse, tab_gallery, tab_notes = st.tabs(
    ["Categories", "Missing text", "Description length", "Item browser", "Image gallery", "Data quality"])

order = summary.sort_values("n_items", ascending=False)["category"].tolist()

# ----------------------------------------------------------------------------- tabs
with tab_cat:
    st.subheader("How many items are in each category?")
    chart = alt.Chart(summary).mark_bar().encode(
        x=alt.X("n_items:Q", title="Items in training split"),
        y=alt.Y("category:N", sort=order, title=None),
        tooltip=["category", alt.Tooltip("n_items:Q", format=","), alt.Tooltip("pct_of_items:Q", title="% of items")],
    )
    st.altair_chart(chart, width="stretch")
    ratio = stat.get("imbalance_ratio")
    if ratio:
        st.info(f"The largest category is **{ratio:.0f}x** the smallest. Accuracy alone would hide weak "
                "performance on rare categories, so we will report macro-F1 and per-class results.")

with tab_missing:
    st.subheader("Which categories are missing text?")
    long = summary.melt(id_vars="category", value_vars=["pct_missing_title", "pct_missing_desc"],
                        var_name="field", value_name="pct_missing")
    long["field"] = long["field"].map({"pct_missing_title": "Title", "pct_missing_desc": "Description"})
    chart = alt.Chart(long).mark_bar().encode(
        x=alt.X("pct_missing:Q", title="% of items missing", scale=alt.Scale(domain=[0, 100])),
        y=alt.Y("category:N", sort=order, title=None),
        yOffset="field:N",
        color=alt.Color("field:N", title="Field"),
        tooltip=["category", "field", alt.Tooltip("pct_missing:Q", format=".1f")],
    )
    st.altair_chart(chart, width="stretch")
    st.caption("Text is missing for many items, so images are the main signal and text is optional.")

with tab_text:
    st.subheader("How long are descriptions, when they exist?")
    chart = alt.Chart(summary).mark_bar().encode(
        x=alt.X("median_desc_len:Q", title="Median description length (characters)"),
        y=alt.Y("category:N", sort="-x", title=None),
        tooltip=["category", alt.Tooltip("median_desc_len:Q", format=".0f")],
    )
    st.altair_chart(chart, width="stretch")

with tab_browse:
    st.subheader(f"Browse a stratified sample of {len(items):,} training items")
    c1, c2, c3 = st.columns([2, 2, 1])
    cats = c1.multiselect("Category", order, default=[])
    query = c2.text_input("Search name or title")
    only_desc = c3.checkbox("Has description")
    view = items.copy()
    if cats:
        view = view[view["category"].isin(cats)]
    if query:
        text = view["url_name"].fillna("") + " " + view["title"].fillna("")
        view = view[text.str.contains(query, case=False, regex=False)]
    if only_desc:
        view = view[view["has_description"] == True]  # noqa: E712
    st.write(f"{len(view):,} items")
    st.dataframe(view[["item_id", "category", "url_name", "title", "description", "desc_len"]],
                 width="stretch", hide_index=True)

with tab_gallery:
    st.subheader("Sample product images")
    with_img = items[items["image_url"].notna()]
    if with_img.empty:
        st.info("No images uploaded. Rerun `python load_supabase.py` without `--no-images`.")
    else:
        cat = st.selectbox("Category", [c for c in order if c in set(with_img["category"])])
        pics = with_img[with_img["category"] == cat].head(20)
        cols = st.columns(5)
        for i, (_, r) in enumerate(pics.iterrows()):
            cols[i % 5].image(r["image_url"], caption=str(r["url_name"])[:40], width="stretch")
        st.caption("Clean retail photos on white backgrounds. Real closet photos will look different (domain shift).")

with tab_notes:
    st.subheader("Data-quality and sampling concerns")
    st.markdown(f"""
**Data quality**
- **{stat.get('pct_missing_title', 0):.0f}%** of items have no title and **{stat.get('pct_missing_desc', 0):.0f}%** have no description (often stored as empty strings, not nulls).
- Duplicate item ids were removed during cleaning; some products may still appear under different ids.
- Some names were URL-encoded (for example `chlo%C3%A9`) and were decoded. **{stat.get('pct_non_ascii', 0):.1f}%** of items contain non-ASCII text, often non-English.

**Sampling**
- Polyvore was a fashion community; items skew toward women's fashion and luxury brands, around 2016.
- Retail product photos, not photos taken in a real closet.
- Strong category imbalance (see the Categories tab).
- This Hugging Face version has **no outfit or compatibility labels**, which the research question needs. We will add the original Polyvore Outfits files before modeling.

**Test data**
- A stratified 20% test split (seed 42) is reserved and is not shown or explored here.
""")
