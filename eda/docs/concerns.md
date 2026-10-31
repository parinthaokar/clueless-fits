# Concerns - Polyvore (owj0421/polyvore)

## Data-quality concerns

- **Missing titles and descriptions.** About 70% of items have no title
  (70.2%) and 71% have no description (71.3%) overall. We'll treat text
  fields as a supplementary signal only, not something every item can be
  expected to have, and build the recommender's core matching on images and
  category/color metadata instead.

- **Descriptions concentrated in clothing categories, nearly absent in
  accessories.** Descriptions exist mainly for shoes, bottoms, tops,
  all-body, and outerwear (the only categories with enough descriptions,
  n ≥ 100, to trust a median length), while sunglasses, hats, scarves, bags,
  jewellery, and accessories are ~100% missing both title and description.
  We'll only use text features for the categories where they're actually
  present often enough, and rely on images alone for the accessory-type
  categories.

- **Possible duplicates.** 26,736 items share a `url_name` + `title` with
  another item under a different `item_id`. Many of these have blank titles,
  so the match may just reflect missing text rather than a true duplicate
  listing - we'll flag these as *possible* duplicates, not drop them
  outright, and de-duplicate on a stricter signal (e.g. matching image) if
  they turn out to distort training.

- **URL-encoded names.** 5,558 `url_name` values contained URL-encoded
  characters (e.g. `%C3%A9`). These were decoded during cleaning (e.g.
  `chlo%C3%A9` → `chloé`), so this is already handled.

- **Non-ASCII text.** 4.2% of items (10,496) have non-ASCII text in their
  title or description - mostly accented brand names (e.g. "Chloé") plus
  some genuinely non-English text, not a blanket "non-English" category.
  We'll keep this text as-is (it's still meaningful, e.g. for brand
  matching) rather than stripping or discarding it.

- **Descriptions apparently truncated.** Description length caps out at
  exactly 4,096 characters, which looks like a hard truncation by the source
  rather than a natural stopping point. We won't build any feature that
  assumes descriptions are complete, uncut text (e.g. counting on a closing
  sentence or full product copy).

- **Sketch-style images instead of photos.** A few sample items (e.g. a
  jewellery piece rendered as a crown-of-thorns line drawing, one faint
  sunglasses outline) are illustrations or placeholder-style graphics rather
  than real product photos, even though the broader image set is clean and
  consistently sized (300x300). We'll spot-check for more of these outliers
  before relying on image embeddings, especially for jewellery and
  accessories.

## Sampling concerns

- **Polyvore's user base skews toward women's and luxury fashion, circa
  2016.** Polyvore was a styling community popular with a mostly female user
  base and leaned toward higher-end/designer items, and the site itself shut
  down in 2018, so this data reflects roughly mid-2010s fashion. Recommendations
  trained on it may underrepresent menswear, budget fashion, and current
  trends - we'll call this out as a known bias rather than claim the
  recommender generalizes to all users or eras.

- **Retail product photos, not real closet photos (domain shift).** Every
  image is a clean studio/catalog shot (plain background, centered item), not
  a photo of an item as it actually appears in someone's closet or worn in
  the wild. A recommender trained purely on this will likely need
  fine-tuning or augmentation before it generalizes to real user-uploaded
  photos.

- **Moderate 9.2x category imbalance.** The largest category (shoes) has
  9.2x as many items as the smallest (scarves). We'll use class-weighted
  loss or stratified sampling during training so the model doesn't
  underperform on the smaller categories, rather than dropping any category.

- **Text collected unevenly by category.** Beyond the missing-text concern
  above, the fact that text exists almost exclusively for clothing
  categories and not accessories means any text-based feature will be
  systematically biased toward certain categories. We'll avoid comparing
  items across categories using text-derived features alone.

- **No outfit or compatibility labels in this version.** This release of
  `owj0421/polyvore` is item-level metadata only (item_id, url_name, title,
  description, category, image) - it has no outfit groupings or
  compatibility labels, which our research question (recommending
  compatible outfits) needs. We'll need to pull in the original Polyvore
  Outfits files (outfit-to-item mappings and compatibility data) before we
  can move from item-level EDA to outfit-level modeling.
