// Turns what the recommendation model returns (a catalog item name + dataset category) into the
// app's ClothingItem: a garment drawing (kind, colour, pattern) guessed from the name.
// The catalog photo (Supabase item-images bucket) is the picture; the drawing is only the fallback.
import type { ColorName } from "./colors";
import type { Category, ClothingItem, GarmentKind, Pattern } from "./types";


const has = (s: string, words: string[]) => words.some((w) => s.includes(w));

function kindFor(category: Category, n: string): GarmentKind {
  switch (category) {
    case "Tops":
      return has(n, ["tank", "cami", "shell", "sleeveless", "camisole"]) ? "shell" : has(n, ["shirt", "blouse", "button", "oxford"]) && !has(n, ["t-shirt", "tee"]) ? "shirt" : "tee";
    case "Bottoms":
      return has(n, ["skirt"]) ? "skirt" : has(n, ["jean", "denim"]) ? "jeans" : has(n, ["wide"]) ? "wideleg" : "trousers";
    case "Outerwear":
      return has(n, ["leather", "biker", "moto"]) ? "leather" : has(n, ["blazer", "suit"]) ? "blazer" : "jacket";
    case "Shoes":
      return has(n, ["boot"]) ? "boots" : has(n, ["loafer", "oxford", "brogue", "derby"]) ? "loafers" : has(n, ["pump", "heel", "stiletto", "sandal", "wedge", "slingback"]) ? "pumps" : "sneakers";
    case "Bags":
      return has(n, ["tote", "top handle", "satchel", "handle"]) ? "tophandle" : "bag";
    case "Dresses":
      return "dress";
    case "Accessories":
      return has(n, ["belt"]) ? "belt" : has(n, ["sunglass"]) ? "sunglasses" : "glasses";
  }
}

// Word -> drawn colour. First match wins, so put the specific words first.
const COLOR_WORDS: [string[], ColorName][] = [
  [["navy"], "navy"], [["black"], "black"], [["white", "ivory"], "white"], [["cream", "beige", "off-white"], "cream"],
  [["raspberry", "fuchsia", "magenta", "burgundy", "wine"], "raspberry"], [["red", "scarlet"], "red"],
  [["pink", "blush", "rose"], "pink"], [["lavender", "lilac", "purple", "violet"], "lavender"],
  [["denim", "light wash", "indigo"], "denim"], [["blue", "cobalt", "teal", "turquoise"], "blue"],
  [["green", "olive", "khaki", "sage", "mint"], "green"], [["brown", "chocolate", "espresso", "cognac"], "brown"],
  [["camel"], "camel"], [["tan", "nude", "sand"], "tan"], [["yellow", "mustard", "gold", "orange"], "mustard"],
  [["grey", "gray", "silver", "charcoal"], "grey"], [["stone", "taupe", "oatmeal"], "stone"],
];

function colorFor(n: string): ColorName {
  const words = n.split(/[^a-z-]+/);
  for (const [keys, color] of COLOR_WORDS) {
    if (keys.some((k) => (k.includes(" ") ? n.includes(k) : words.includes(k)))) return color;
  }
  return "stone";
}

const patternFor = (n: string): Pattern => (has(n, ["plaid", "check", "tartan", "gingham"]) ? "plaid" : has(n, ["stripe", "striped"]) ? "stripe" : "solid");

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** `hit.name` is the catalog's short product name, e.g. "vetements black leather ankle boots". */
export function toClothingItem(hit: { item_id: string; name: string; image_url?: string }, category: Category): ClothingItem {
  const n = hit.name.toLowerCase();
  return {
    id: `rec-${hit.item_id}`,
    name: titleCase(hit.name),
    photoUrl: hit.image_url,
    category,
    kind: kindFor(category, n),
    color: colorFor(n),
    pattern: patternFor(n),
    addedAt: new Date().toISOString().slice(0, 10),
  };
}
