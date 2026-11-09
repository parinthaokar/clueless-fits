# Clueless Closet — front-end design spec

The approved look for the website. `screens/` has a PNG of every screen; `html/` has the same
screens as self-contained HTML (inline CSS and SVG) — copy exact colors, sizes and SVG paths from there.
These are mockups: rebuild them as Next.js + Tailwind components, don't paste the HTML in.

## Screens

| Route | Mockup | What's on it |
|---|---|---|
| `/` | `1_landing` | Plaid hero, "What should I wear today?", Start my closet / Try the demo closet, 3 steps, garment strip, footer |
| `/wardrobe` | `2_wardrobe` | Title + count, "+ Add a piece", category filter pills with counts, 4-column item cards |
| `/wardrobe` (drawer or `/wardrobe/new`) | `3_add_piece` | Photo on the left; "Tagged from your photo" card: top-3 category confidence bars, editable name / category / color / pattern / notes, note, Save / Cancel |
| `/stylist` | `4_stylist` | Occasion pills + chat on the left; "Today's look" card: model + item tiles, why it works, closet gap, Save / Open in Fitting Room, 1–5 rating |
| `/fitting-room` | `5_fitting_room`, `6_fitting_room_masc` | Model stage with Feminine / Masculine switch, Turn, skin tones; outfit list with ‹ › swap per slot; rules note; Save / Ask the stylist |
| model reference | `model_styles` | Both model styles side by side |

## Colors (put these in the `@theme` block of `app/globals.css`)

| Token | Hex | Use |
|---|---|---|
| ink | `#1d1a16` | Text, all outlines, dark pills |
| cream | `#fffaf0` | Page background |
| mustard | `#f6c544` | Plaid, card drop shadows, text on dark pills |
| raspberry | `#c2185b` | Primary buttons, main bars, KPI numbers, accents |
| denim | `#2a78d6` | Secondary bars (pairs with raspberry; colorblind-safe) |
| track | `#f4eee2` | Bar tracks, soft tags, image backgrounds `#fbf7ee` |
| muted | `#6b665e` | Secondary text |
| note-pink | `#fde7ef` (border raspberry, dashed) | Info notes |
| warn-yellow | `#fff3c4` (border `#b8860b`, dashed) | Warnings ("Closet gap") |

## Type

- **Inter** (400–900) for everything; **Libre Baskerville 700** for the logo and the landing headline. Load both with `next/font/google`.
- Page titles 28px / 900. Card titles 20–22px / 900. Body 15px. Small caps labels 11–12px / 800, uppercase, letter-spacing .06em.

## Components

- **Logo box:** serif, cream fill, 2.5–3px ink border, hard shadow `4px 4px 0 ink` (landing headline: `7px 7px 0`).
- **Plaid band:** mustard background + three `repeating-linear-gradient`s (copy from `html/1_landing.html`). Landing hero only.
- **Card:** white, 2px ink border, radius 22–26px, shadow `0 6px 0 mustard` (no blur).
- **Pill:** 2px ink border, fully rounded, 700 weight; selected = ink fill + mustard text. Used for nav, filters, occasions.
- **Button:** pill-shaped, 2px border, shadow `0 4px 0 ink`; primary raspberry with white text, secondary white.
- **Tag:** small rounded label, track fill, 1.5px border.
- **Confidence bar:** 12px tall rounded bar on track; top choice raspberry, others denim; percent at the right.
- **Rating:** five dots, filled raspberry / empty track.

## The model (Fitting Room + Stylist)

- A drawing, never a photo of the user. Built from SVG layers, back to front: hair (back), legs, shoes, top, bottom, outerwear, purse, hands, head, neck, face, hair (front).
- Two body styles: Feminine and Masculine. Five skin tones: `#f3d4bf #e2b08c #c98e6b #9a6646 #5e3b28`.
- Each clothing layer is a shape per category (tee, shell, trousers, skirt, jeans, blazer, denim jacket, pumps, boots, sneakers…) filled with the item's tagged color, with a plaid/stripe pattern clipped inside when tagged.
- The neck is drawn after the head so it joins the jaw with no chin line.
- Exact SVG paths: `html/model_styles.html`.

## Content rules from our EDA

- Tag from the photo first (about 70% of catalog items had no title/description); always let the user edit tags.
- 7 app categories = merged from the 11 Polyvore categories (jewellery, hats, scarves, sunglasses, accessories → Accessories; all-body → Dresses).
- Show the model's top-3 category confidences so users can catch mistakes on rare categories.
- Ratings (1–5) are the "style fit" evaluation from our proposal — store them.
- Item pictures in mockups are placeholders; never publish Polyvore images on the live site.

## Accessibility

- Every image/SVG gets alt text or `aria-label`; the model gets one describing the outfit.
- Never rely on color alone (bars have percentages, selected pills change fill AND text color).
- Mobile: nav collapses, card grids drop to 2 columns then 1, model stage stacks above the outfit list.
