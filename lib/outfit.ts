// Helpers shared by the Stylist and Fitting Room: slots, closet pools and passing a look in the URL.
import { lookSlots, type ClothingItem, type LookSlot, type ModelStyle, type OutfitItem, type OutfitSuggestion } from "./types";

/** The slot an item fills. Dresses fill Top (a dress replaces top + bottom). */
export function slotFor(item: ClothingItem): LookSlot {
  switch (item.category) {
    case "Tops":
    case "Dresses":
      return "Top";
    case "Bottoms":
      return "Bottom";
    case "Outerwear":
      return "Outerwear";
    case "Shoes":
      return "Shoes";
    case "Bags":
      return "Bag";
    case "Accessories":
      return item.kind === "belt" ? "Belt" : "Accessory";
  }
}

/** Closet items that can be swapped into a slot (‹ › in the Fitting Room). */
export const closetFor = (slot: LookSlot, closet: ClothingItem[]) => closet.filter((i) => slotFor(i) === slot);

/** Items in display order: Top, Bottom, Outerwear, Shoes, Belt, Bag, Accessory. */
export const sortBySlot = (items: OutfitItem[]) =>
  [...items].sort((a, b) => lookSlots.indexOf(a.slot) - lookSlots.indexOf(b.slot));

/** One item per slot, the shape components/Model.tsx takes. */
export function toModelOutfit(items: OutfitItem[]) {
  return Object.fromEntries(items.map(({ slot, item }) => [slot, item])) as Partial<Record<LookSlot, ClothingItem>>;
}

export const isDress = (item: ClothingItem | undefined) => item?.category === "Dresses";

// A look in the URL: /fitting-room?items=i9,i10,i1&occasion=Work&model=feminine
// (and back: /stylist?items=…). Item ids rather than a look id, so a shuffled or swapped look
// carries over exactly. Ids are looked up in the user's closet from lib/store.tsx.
export function lookToQuery(look: Pick<OutfitSuggestion, "items" | "occasion">, model?: ModelStyle | null) {
  const params = new URLSearchParams({ items: look.items.map((i) => i.item.id).join(","), occasion: look.occasion });
  if (model) params.set("model", model);
  return params.toString();
}

export function lookFromQuery(
  items: string,
  closet: ClothingItem[],
  occasion = "Styled for you",
): OutfitSuggestion | undefined {
  const picked: OutfitItem[] = [];
  for (const id of items.split(",")) {
    const item = closet.find((i) => i.id === id.trim());
    if (item && !picked.some((p) => p.slot === slotFor(item))) picked.push({ slot: slotFor(item), item });
  }
  if (picked.length === 0) return undefined;
  return { id: "from-url", occasion, items: sortBySlot(picked), why: "" };
}
