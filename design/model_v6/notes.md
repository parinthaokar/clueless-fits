# Model v6: approved changes

`model_reference.html` has the new feminine model in all five skin tones, all six hair colours and the three new thumbnails, as inline SVG (model viewBox `0 0 200 330`, thumbnails `0 0 120 120`). Copy the paths from there. `feminine_v6.png`, `feminine_v6_closeup.png` and `hair_colors.png` are screenshots. `models_v6.py` is the generator, kept only as a readable source of the paths. It won't run on its own.

## Feminine
- **Hair:** a layered blowout with a side part at x = 95. It sits flush on the head, with no raised dome. The curtain layers fall along the cheeks, open away from the face at cheekbone level, and flip outward around the collarbone (y ≈ 107).
  - **Draw order:** the back mass first; the front left and right sections last, after the face and glasses.
  - **Colour:** with the default Brown, a vertical balayage gradient, `userSpaceOnUse`, y 18 → 108. Root colour to 34%, ends colour from 78%. Other hair colours are a plain fill. Strand lines are always in the highlight colour.
- **Default outfit (Work look):**
  - Grey double-breasted blazer `#9a9da2`, details `#7a7d82` / `#b4b7bb`: structured shoulders, nipped waist, hip-length. Peak lapels, a deep V with skin showing (no shirt) and a thin gold chain. Six buttons `#2b2b2e`, princess seams, flap pockets, a breast welt pocket, and long sleeves with cuff buttons.
  - Matching grey wide-leg trousers, full length, with pressed creases.
  - Pointed black pumps under the hem (same as v5).
  - Tortoiseshell glasses, worn by default.
  - No bag.
- **Tortoiseshell glasses:** soft rectangles with lifted outer corners. The frames use a greige `#bdb79c` pattern with `#4e3b2c` brown and `#86ab9c` mint spots. Lenses are white at 14% opacity with a small shine line.

## Masculine
- No change to the drawing or the hair cut.
- The **black sunglasses are no longer in the default outfit**. They stay a closet item that can be swapped on.
- Hair colour now comes from the hair picker, not from skin tone.

## Hair colour (new setting, both models)
Everyone starts on **Brown**. The user can pick another colour, and the choice is saved like skin tone. Eyebrows use the hair's root colour.

Only **Brown** (the default) keeps the balayage (root fading to lighter ends). The other five are a **solid colour** with the lighter strand lines as the only detail: draw them with a plain fill, no gradient.

| Name | Fill (root) | Strands | Ends |
|---|---|---|---|
| Black | `#141010` | `#3a302c` | same as fill |
| Dark brown | `#33231a` | `#5e4434` | same as fill |
| **Brown (default)** | `#4a2c1d` | `#7a5038` | `#a87a4e` (balayage) |
| Light brown | `#6b4430` | `#9a6a4c` | same as fill |
| Blonde | `#b8894a` | `#dcb87c` | same as fill |
| Auburn | `#7a3220` | `#a8573a` | same as fill |

**Picker:** a "Hair" row directly under "Skin tone" in the Fitting Room.
- Six round swatches in the fill colour (Brown's swatch shows its root-to-ends gradient).
- The selected swatch gets the same ring as skin tone.
- The colour name sits next to the row.
- Each swatch needs an aria-label with its colour name.
