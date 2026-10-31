# Plot interpretations - Polyvore EDA

Two data-quality caveats worth keeping in mind across all four plots, since they
don't get their own chart: the 26,736 items that share a `url_name` + `title`
with another item are only **possible duplicates**, since many of them have
blank titles and could be matching on that alone rather than being true repeat
listings. Separately, the 4.2% of items flagged with non-ASCII characters are
better described as items with **non-ASCII text** (accented brand names like
"Chloé", plus some genuinely non-English text) rather than "non-English" as a
whole category.

## 1. Items per category (`1_category_distribution.png`)

Shoes is the largest category at 35,880 items (17.9%) versus scarves at just
3,919 (2.0%) - a **moderate** ~9x imbalance (9.2x on the full dataset). This
matters because a classifier or embedding model trained on raw counts will see
shoes, jewellery, and bags far more often than scarves or hats, biasing it
toward recommending/recognizing the big categories. We'll address this with
class-weighted loss or stratified sampling during training rather than
discarding any categories, since none are rare enough to drop.

## 2. Missing text by category (`2_missing_text_by_category.png`)

Overall 70% of items have no title and 71% have no description, but it's
extremely uneven by category: sunglasses, hats, scarves, bags, jewellery, and
accessories are essentially 100% missing both fields, while bottoms is "only"
25-28% missing. For an outfit recommender this means text-based features
(titles/descriptions) are unusable for most accessory-type categories, so
compatibility there will have to rely on image embeddings and category/color
metadata instead. We'll build the recommender's core matching on images, and
treat title/description as a bonus signal only for the categories (tops,
bottoms, shoes) where it's actually present often enough to be useful.

## 3. Description length (`3_description_length.png`)

The plot now shows n per category and restricts its headline to categories
with at least 100 descriptions: among those, shoes has the longest median
description at 213 characters (n=22,251), with bottoms, tops, all-body, and
outerwear all in a similar 150-220 character range. Accessories (n=1) and
jewellery (n=1) each have only a single item with a description, so their
lines on the chart are single slivers, not real medians, and should be
ignored - this matches the ~100% missing rate for those categories in plot 2.
Separately, the dataset-wide description length caps out at a 4,096-character
maximum, which suggests descriptions were truncated by the source rather than
naturally ending there. We'll trust median description length only for
categories with n ≥ 100 (shoes, bottoms, tops, all-body, outerwear), treat
accessories/jewellery as having effectively no usable description data, and
avoid building any feature that assumes descriptions are complete, uncut
text.

## 4. Sample product images (`4_sample_images.png`)

A 6-per-category grid shows mostly clean, consistent product photography
(centered items, white/plain backgrounds), confirming the 300x300 image-size
check from the audit held up visually, not just numerically. A few jewellery
and sunglasses examples are line-drawing/sketch style rather than real photos
(e.g., the crown-of-thorns necklace and one faint sunglasses outline), which
is a minor but real inconsistency for an image-embedding model to handle. Since
images are the most complete and visually consistent field, they'll be the
primary signal for the recommender, and we'll spot-check for more
illustration/placeholder-style outliers before relying on embeddings for those
two categories.
