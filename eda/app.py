"""
Clueless Closet - D2 data dashboard (Streamlit, reads from Supabase).

Run locally:   streamlit run app.py        (from inside eda/, so .streamlit/config.toml is used)
Deploy:        modal deploy modal_app.py

Needs SUPABASE_URL and SUPABASE_ANON_KEY, from a local .env file,
.streamlit/secrets.toml, or (on Modal) a Modal secret. The anon key is
read-only because schema.sql only allows SELECT.

Look: 90s plaid-preppy. Mustard plaid header, cream page, rounded white cards
with black outlines and mustard drop shadows, raspberry + denim-blue charts.
"""

import html
import os

import altair as alt
import pandas as pd
import streamlit as st
from supabase import create_client

st.set_page_config(page_title="Clueless Closet: D2 Data Dashboard", page_icon="👗", layout="wide")

# ----------------------------------------------------------------------------- style
INK = "#1d1a16"        # near-black text and outlines
CREAM = "#fffaf0"      # page background
MUSTARD = "#f6c544"    # plaid + card shadows
RASPBERRY = "#c2185b"  # main bars / descriptions
DENIM = "#2a78d6"      # titles (contrasts with raspberry, colorblind-safe pair)
TRACK = "#f4eee2"      # light bar track
MUTED = "#6b665e"      # secondary text

PLAID = (
    "repeating-linear-gradient(0deg, rgba(29,26,22,0) 0 22px, rgba(29,26,22,.55) 22px 26px, "
    "rgba(29,26,22,0) 26px 44px, rgba(255,255,255,.35) 44px 46px, rgba(29,26,22,0) 46px 66px),"
    "repeating-linear-gradient(90deg, rgba(29,26,22,0) 0 22px, rgba(29,26,22,.55) 22px 26px, "
    "rgba(29,26,22,0) 26px 44px, rgba(255,255,255,.35) 44px 46px, rgba(29,26,22,0) 46px 66px),"
    "repeating-linear-gradient(90deg, rgba(194,24,91,0) 0 60px, rgba(194,24,91,.35) 60px 63px, "
    "rgba(194,24,91,0) 63px 132px)"
)

st.markdown(f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Libre+Baskerville:wght@700&display=swap');
html, body, .stApp, [class*="st-"] {{ font-family: 'Inter', sans-serif; }}
.stApp {{ background: {CREAM}; color: {INK}; }}
header[data-testid="stHeader"] {{ background: transparent; }}
.block-container {{ padding-top: 1.2rem; max-width: 1240px; }}

/* plaid header */
.cc-hero {{ background-color: {MUSTARD}; background-image: {PLAID}; border-radius: 0 0 26px 26px;
  border: 2px solid {INK}; border-top: none; padding: 30px 36px 26px; margin: -1.2rem -1rem 22px; }}
.cc-title {{ display: inline-block; background: {CREAM}; padding: 10px 20px; border: 3px solid {INK};
  font-family: 'Libre Baskerville', Georgia, serif; font-size: 42px; font-weight: 700; color: {INK};
  box-shadow: 6px 6px 0 {INK}; line-height: 1.15; }}
.cc-sub {{ display: inline-block; margin-top: 14px; background: {INK}; color: {MUSTARD}; padding: 5px 14px;
  border-radius: 999px; font-size: 13px; font-weight: 600; letter-spacing: .03em; }}

/* KPI cards */
.cc-kpis {{ display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }}
.cc-kpi {{ background: #fff; border: 2px solid {INK}; border-radius: 22px; padding: 14px 16px;
  box-shadow: 0 6px 0 {MUSTARD}; }}
.cc-kpi .l {{ font-size: 11.5px; letter-spacing: .08em; text-transform: uppercase; color: {INK}; }}
.cc-kpi .n {{ font-size: 30px; font-weight: 800; color: {RASPBERRY}; margin-top: 2px; }}
@media (max-width: 900px) {{ .cc-kpis {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
  .cc-title {{ font-size: 30px; }} }}

/* pill tabs (newer Streamlit uses stTab; older uses baseweb buttons) */
[role="tablist"], div[data-baseweb="tab-list"] {{ gap: 8px; flex-wrap: wrap; border: none !important;
  box-shadow: none !important; }}
[data-testid="stTab"], button[data-baseweb="tab"] {{ background: #fff; border: 2px solid {INK} !important;
  border-radius: 999px; padding: 6px 16px !important; height: auto; box-shadow: none !important; }}
[data-testid="stTab"]::after, [data-testid="stTab"]::before {{ display: none !important; }}
[data-testid="stTab"] p, button[data-baseweb="tab"] p {{ font-size: 13.5px; font-weight: 700; color: {INK} !important; }}
[data-testid="stTab"][aria-selected="true"], button[data-baseweb="tab"][aria-selected="true"] {{ background: {INK}; }}
[data-testid="stTab"][aria-selected="true"] p, button[data-baseweb="tab"][aria-selected="true"] p {{ color: {MUSTARD} !important; }}
div[data-baseweb="tab-highlight"], div[data-baseweb="tab-border"], .react-aria-SelectionIndicator,
[role="tablist"]::after {{ display: none !important; }}

/* each tab's content sits in a rounded card */
div[role="tabpanel"] {{ background: #fff; border: 2px solid {INK}; border-radius: 26px;
  box-shadow: 0 8px 0 {MUSTARD}; padding: 22px 26px 18px; margin-top: 14px; }}
div[role="tabpanel"] h3 {{ font-weight: 800; color: {INK}; }}

/* notes */
.cc-note {{ background: #fde7ef; border: 2px dashed {RASPBERRY}; border-radius: 14px;
  padding: 10px 14px; font-size: 14px; margin-top: 8px; color: {INK}; }}
.cc-warn {{ background: #fff3c4; border: 2px dashed #b8860b; border-radius: 14px;
  padding: 10px 14px; font-size: 14px; margin-top: 8px; color: {INK}; }}
.cc-cap {{ color: {MUTED}; font-size: 13px; margin: -6px 0 8px; }}
.cc-foot {{ color: {MUTED}; font-size: 12px; margin-top: 26px; text-align: center; }}

/* gallery images */
div[data-testid="stImage"] img {{ border-radius: 16px; border: 2px solid {INK}; background: #fff; }}
</style>
""", unsafe_allow_html=True)


def note(text, kind="note"):
    st.markdown(f'<div class="cc-{kind}">{text}</div>', unsafe_allow_html=True)


def caption(text):
    st.markdown(f'<div class="cc-cap">{text}</div>', unsafe_allow_html=True)


def style_chart(chart, height=None, step=None):
    size = {"height": alt.Step(step)} if step else {"height": height}
    return (chart.properties(background="transparent", **size)
            .configure_view(stroke=None)
            .configure_axis(labelFont="Inter", titleFont="Inter", labelColor=INK, titleColor=MUTED,
                            labelFontSize=12, titleFontSize=12, grid=False, domain=False, ticks=False)
            .configure_legend(labelFont="Inter", titleFont="Inter", labelColor=INK, orient="top",
                              title=None, labelFontSize=13, symbolType="square")
            .configure_text(font="Inter"))


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
order = summary.sort_values("n_items", ascending=False)["category"].tolist()

# ----------------------------------------------------------------------------- header + KPIs
st.markdown("""
<div class="cc-hero">
  <div class="cc-title">Clueless Closet</div><br>
  <div class="cc-sub">Polyvore data dashboard · training split only · test split reserved</div>
</div>""", unsafe_allow_html=True)

kpis = [
    ("Train items", f"{int(stat.get('train_items', summary['n_items'].sum())):,}"),
    ("Test reserved", f"{int(stat.get('test_items_reserved', 0)):,}"),
    ("Categories", f"{int(stat.get('n_categories', len(summary)))}"),
    ("Titles missing", f"{stat.get('pct_missing_title', 0):.1f}%"),
    ("Descriptions missing", f"{stat.get('pct_missing_desc', 0):.1f}%"),
]
st.markdown('<div class="cc-kpis">' + "".join(
    f'<div class="cc-kpi"><div class="l">{l}</div><div class="n">{n}</div></div>' for l, n in kpis)
    + "</div>", unsafe_allow_html=True)

tab_cat, tab_missing, tab_text, tab_browse, tab_gallery, tab_notes = st.tabs(
    ["Categories", "Missing text", "Description length", "Item browser", "Image gallery", "Data quality"])

# ----------------------------------------------------------------------------- tabs
with tab_cat:
    st.subheader("How many items are in each category?")
    base = alt.Chart(summary).encode(y=alt.Y("category:N", sort=order, title=None))
    track = base.mark_bar(color=TRACK, cornerRadius=8, height=16).encode(
        x=alt.X("max_items:Q", title="Items in training split"))
    bars = base.mark_bar(color=RASPBERRY, cornerRadius=8, height=16).encode(
        x="n_items:Q",
        tooltip=["category", alt.Tooltip("n_items:Q", format=",", title="items"),
                 alt.Tooltip("pct_of_items:Q", title="% of items")])
    labels = base.mark_text(align="left", dx=6, color=INK, fontSize=12).encode(
        x="max_items:Q", text=alt.Text("n_items:Q", format=","))
    chart = (track + bars + labels).transform_joinaggregate(max_items="max(n_items)")
    st.altair_chart(style_chart(chart, step=30), width="stretch")
    ratio = stat.get("imbalance_ratio")
    if ratio:
        level = "a moderate" if ratio < 15 else "a strong"
        note(f"<b>{html.escape(order[0].capitalize())}</b> is the largest category, about <b>{ratio:.0f}x</b> "
             f"the smallest. That's {level} imbalance, so we'll report macro-F1 and per-class results "
             "to keep rare categories from being hidden.")

with tab_missing:
    st.subheader("Which categories are missing text?")
    long = summary.melt(id_vars="category", value_vars=["pct_missing_title", "pct_missing_desc"],
                        var_name="field", value_name="pct_missing")
    long["field"] = long["field"].map({"pct_missing_title": "Title missing",
                                       "pct_missing_desc": "Description missing"})
    long["full"] = 100
    long["pct_label"] = long["pct_missing"].round().astype(int).astype(str) + "%"
    fields = ["Title missing", "Description missing"]
    base = alt.Chart(long).encode(
        y=alt.Y("category:N", sort=order, title=None),
        yOffset=alt.YOffset("field:N", sort=fields))
    track = base.mark_bar(color=TRACK, cornerRadius=6, height=9).encode(
        x=alt.X("full:Q", title="% of items missing", scale=alt.Scale(domain=[0, 112]),
                axis=alt.Axis(values=[0, 25, 50, 75, 100])))
    bars = base.mark_bar(cornerRadius=6, height=9).encode(
        x="pct_missing:Q",
        color=alt.Color("field:N", sort=fields, scale=alt.Scale(domain=fields, range=[DENIM, RASPBERRY])),
        tooltip=["category", "field", alt.Tooltip("pct_missing:Q", format=".1f", title="% missing")])
    labels = base.mark_text(align="left", dx=4, color=INK, fontSize=10.5).encode(
        x="full:Q", text="pct_label:N")
    st.altair_chart(style_chart(track + bars + labels, 40 * len(summary)), width="stretch")
    note("Clothing has text, but accessories almost never do. Images will be the main signal and text a bonus.")

with tab_text:
    st.subheader("How long are descriptions, when they exist?")
    MIN_N = 100
    caption(f"Median length · only categories with at least {MIN_N} descriptions, so each median is trustworthy")
    desc = summary.copy()
    desc["n_desc"] = (desc["n_items"] * (1 - desc["pct_missing_desc"] / 100)).round().astype(int)
    reliable = desc[desc["n_desc"] >= MIN_N].copy()
    too_few = desc[desc["n_desc"] < MIN_N].sort_values("n_desc", ascending=False)
    if not reliable.empty:
        reliable["label"] = reliable["median_desc_len"].round().astype(int).astype(str) + " chars"
        base = alt.Chart(reliable).encode(y=alt.Y("category:N", sort="-x", title=None))
        bars = base.mark_bar(color=RASPBERRY, cornerRadius=10, height=22).encode(
            x=alt.X("median_desc_len:Q", title="Median description length (characters)"),
            tooltip=["category", alt.Tooltip("median_desc_len:Q", format=".0f", title="median length"),
                     alt.Tooltip("n_desc:Q", format=",", title="descriptions")])
        labels = base.mark_text(align="left", dx=6, color=INK, fontSize=12).encode(
            x="median_desc_len:Q", text="label:N")
        st.altair_chart(style_chart(bars + labels, step=42), width="stretch")
    if not too_few.empty:
        listed = ", ".join(f"{html.escape(r.category)} ({r.n_desc:,})" for r in too_few.itertuples())
        note(f"<b>Too few descriptions to chart:</b> {listed}. Text is almost absent for these categories, "
             "so the model will rely on images for them.", kind="warn")

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
    caption(f"{len(view):,} items")
    st.dataframe(view[["item_id", "category", "url_name", "title", "description", "desc_len"]],
                 width="stretch", hide_index=True)

with tab_gallery:
    st.subheader("Sample product images")
    with_img = items[items["image_url"].notna()]
    if with_img.empty:
        note("No images uploaded. Rerun <code>python load_supabase.py</code> without <code>--no-images</code>.",
             kind="warn")
    else:
        cat = st.selectbox("Category", [c for c in order if c in set(with_img["category"])])
        pics = with_img[with_img["category"] == cat].head(20)
        cols = st.columns(5)
        for i, (_, r) in enumerate(pics.iterrows()):
            cols[i % 5].image(r["image_url"], caption=str(r["url_name"])[:40], width="stretch")
        note("Clean retail photos on white backgrounds. Real closet photos will look different (domain shift).")

with tab_notes:
    st.subheader("Data-quality and sampling concerns")
    st.markdown(f"""
**Data quality**
- **{stat.get('pct_missing_title', 0):.0f}%** of items have no title and **{stat.get('pct_missing_desc', 0):.0f}%** have no description (often stored as empty strings, not nulls).
- Text exists mostly for clothing categories and is nearly absent for accessories (see the Missing text tab).
- No duplicate item ids were found, but some items share the same name and title under different ids: these are *possible* duplicates (many have blank titles).
- Some names were URL-encoded (for example `chlo%C3%A9`) and were decoded. **{stat.get('pct_non_ascii', 0):.1f}%** of items contain non-ASCII text, such as accented brand names and some non-English.

**Sampling**
- Polyvore was a fashion community; items skew toward women's fashion and luxury brands, around 2016.
- Retail product photos, not photos taken in a real closet.
- Moderate category imbalance (see the Categories tab).
- This Hugging Face version has **no outfit or compatibility labels**, which the research question needs. We will add the original Polyvore Outfits files before modeling.

**Test data**
- A stratified 20% test split (seed 42) is reserved and is not shown or explored here.
""")

st.markdown('<div class="cc-foot">Source: Hugging Face owj0421/polyvore (Vasileva et al., 2018) · '
            'data served from Supabase · deployed on Modal</div>', unsafe_allow_html=True)
