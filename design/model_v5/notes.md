# Model v5 — approved changes

`model_reference.html` has both models in all five skin tones as inline SVG (viewBox 0 0 200 330).
Copy the paths from there into `components/Model.tsx`. `model_reference.png` is a screenshot of it.

## What changed from v4

### Feminine
- **Hair:** long hair with a centre part, sleek and flat on top, falling past the chest in soft, close waves (gentle ripples, not big curls), with lighter strand lines. The wavy edges are generated as a sine wave (amplitude about 1.3, period about 15 units in the 200 x 330 viewBox). Back hair is drawn first; the front pieces are drawn last, after the face and over the shirt.
- **Default outfit** (the Work look): white button-up (tucked, open collar with a skin V, 3 buttons, sleeves rolled to the forearm), brown belt with a gold buckle, high-waisted wide-leg black trousers with front creases reaching the floor, pointed black pumps peeking under the hem, and a tan structured top-handle bag in her left hand (viewer's right).

### Masculine
- **Hair:** same cut as v4; only the colour now follows skin tone.
- **Default outfit:** open black leather jacket (cropped at the waist, wide collar edged in grey `#5a5654`, zipper lines, bunched cuffs, soft shine), white tee tucked in (no necklace), black belt with a silver buckle, stone high-waisted wide-leg trousers (`#d9ccb6`, pleats and crease `#b3a38a`), black loafers, black sunglasses worn on the face.

## Hair colour by skin tone (both models)

| Skin tone | Hair | Strand highlight |
|---|---|---|
| `#f3d4bf` | `#6b4430` | `#9a6a4c` |
| `#e2b08c` | `#4a2c1d` | `#7a5038` |
| `#c98e6b` | `#33231a` | `#5e4434` |
| `#9a6646` | `#211611` | `#4a352a` |
| `#5e3b28` | `#141010` | `#3a302c` |

## New garment shapes the Model component needs
- Button-up shirt (with collar, placket, rolled sleeves and bare forearms)
- Wide-leg trousers (both bodies), with crease lines in a slightly lighter/darker shade of the item colour
- Belt (with buckle)
- Leather jacket (masculine shape; can reuse for feminine at the narrower shoulders)
- Loafers, pointed pumps (front view, under a long hem)
- Top-handle bag held in the hand
- Long, sleek, centre-part wavy hair (feminine); short hair (masculine) — both coloured from the table above
- Sunglasses worn on the face
