// All mock data lives here. Swap these exports for real API calls later.
import type {
  Category,
  ChatMessage,
  ClothingItem,
  OutfitSuggestion,
  SavedOutfit,
} from "./types";

// The mock "today", so "added this week" stays stable between server and client renders.
export const MOCK_TODAY = "2026-11-09";

// Placeholder user and today's weather, shown in the navbar.
// TODO: replace currentUser with the logged-in user once auth exists.
export const currentUser = { name: "Guest", initial: "G" };
export const weather = { tempF: 58, city: "Charlotte", icon: "☀", summary: "sunny" };

export const categories: Category[] = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Outerwear",
  "Shoes",
  "Bags",
  "Accessories",
];

export const occasions = ["Class", "Work", "Dinner", "Interview", "Evening", "Weekend"];

// The demo closet: the pieces drawn in design/screens (wardrobe, stylist, fitting room).
const piece = (
  id: string,
  name: string,
  category: Category,
  kind: ClothingItem["kind"],
  color: ClothingItem["color"],
  addedAt: string,
  pattern: ClothingItem["pattern"] = "solid",
): ClothingItem => ({ id, name, category, kind, color, pattern, addedAt });

export const wardrobeItems: ClothingItem[] = [
  piece("i1", "Yellow Plaid Blazer", "Outerwear", "blazer", "mustard", "2026-11-08", "plaid"),
  piece("i2", "Pleated Mini Skirt", "Bottoms", "skirt", "mustard", "2026-11-07"),
  piece("i3", "White Baby Tee", "Tops", "tee", "white", "2026-11-05"),
  piece("i4", "Pink Slip Dress", "Dresses", "dress", "pink", "2026-10-28"),
  piece("i5", "Light-Wash Jeans", "Bottoms", "jeans", "denim", "2026-10-21"),
  piece("i6", "Platform Sneakers", "Shoes", "sneakers", "white", "2026-10-18"),
  piece("i7", "Knee-High Boots", "Shoes", "boots", "black", "2026-10-12"),
  piece("i8", "Mini Shoulder Bag", "Bags", "bag", "pink", "2026-10-09"),
  piece("i9", "White Silk Shell", "Tops", "shell", "white", "2026-10-02"),
  piece("i10", "Plaid Suit Trousers", "Bottoms", "trousers", "mustard", "2026-09-30", "plaid"),
  piece("i11", "Raspberry Pumps", "Shoes", "pumps", "raspberry", "2026-09-24"),
  piece("i12", "Denim Jacket", "Outerwear", "jacket", "blue", "2026-09-15"),
  piece("i13", "Tinted Sunglasses", "Accessories", "sunglasses", "lavender", "2026-09-10"),
];

const byId = (id: string) => wardrobeItems.find((i) => i.id === id)!;

// The two default model looks from design/model_v5/model_reference.html (used by /model-preview).
// Kept out of wardrobeItems so the demo closet and its counts stay as drawn in design/screens.
export const referenceLooks = {
  feminine: {
    title: "The Work look: white button-up, brown belt, wide-leg black trousers, pointed black pumps, tan top-handle bag",
    outfit: {
      Top: piece("r1", "White Button-Up Shirt", "Tops", "shirt", "white", "2026-11-01"),
      Belt: piece("r2", "Brown Leather Belt", "Accessories", "belt", "brown", "2026-11-01"),
      Bottom: piece("r3", "Black Wide-Leg Trousers", "Bottoms", "wideleg", "black", "2026-11-01"),
      Shoes: piece("r4", "Pointed Black Pumps", "Shoes", "pumps", "black", "2026-11-01"),
      Bag: piece("r5", "Tan Top-Handle Bag", "Bags", "tophandle", "camel", "2026-11-01"),
    },
  },
  masculine: {
    title: "Black leather jacket, white tee, black belt, stone wide-leg trousers, black loafers, black sunglasses",
    outfit: {
      Outerwear: piece("r6", "Black Leather Jacket", "Outerwear", "leather", "black", "2026-11-01"),
      Top: byId("i3"),
      Belt: piece("r7", "Black Belt", "Accessories", "belt", "black", "2026-11-01"),
      Bottom: piece("r8", "Stone Wide-Leg Trousers", "Bottoms", "wideleg", "stone", "2026-11-01"),
      Shoes: piece("r9", "Black Loafers", "Shoes", "loafers", "black", "2026-11-01"),
      Accessory: piece("r10", "Black Sunglasses", "Accessories", "sunglasses", "black", "2026-11-01"),
    },
  },
};

export const classLook: OutfitSuggestion = {
  id: "o1",
  occasion: "Class",
  items: [
    { slot: "Top", item: byId("i3") },
    { slot: "Bottom", item: byId("i2") },
    { slot: "Shoes", item: byId("i7") },
    { slot: "Accessory", item: byId("i13") },
  ],
  why: "A baby tee and pleated mini keep it easy for a long day; knee-high boots and tinted shades make it a look.",
};

export const alternateLook: OutfitSuggestion = {
  id: "o5",
  occasion: "Class",
  items: [
    { slot: "Top", item: byId("i9") },
    { slot: "Bottom", item: byId("i5") },
    { slot: "Shoes", item: byId("i6") },
    { slot: "Accessory", item: byId("i8") },
  ],
  why: "Softer and more relaxed: a silk shell with light-wash denim, platform sneakers, and a pink bag for color.",
};

export const savedOutfits: SavedOutfit[] = [
  { ...classLook, savedAt: "2026-10-20", rating: 5 },
  {
    id: "o2",
    occasion: "Evening",
    items: [
      { slot: "Top", item: byId("i9") },
      { slot: "Bottom", item: byId("i2") },
      { slot: "Shoes", item: byId("i11") },
      { slot: "Accessory", item: byId("i8") },
    ],
    why: "A white silk shell over the pleated mini, with raspberry pumps and the pink bag for color.",
    savedAt: "2026-10-14",
    rating: 4,
  },
  {
    id: "o3",
    occasion: "Interview",
    items: [
      { slot: "Top", item: byId("i9") },
      { slot: "Bottom", item: byId("i10") },
      { slot: "Shoes", item: byId("i11") },
      { slot: "Accessory", item: byId("i8") },
    ],
    why: "Plaid suit trousers with a white silk shell read polished; the pumps add confidence.",
    savedAt: "2026-10-02",
    rating: 3,
  },
  {
    id: "o4",
    occasion: "Weekend",
    items: [
      { slot: "Top", item: byId("i3") },
      { slot: "Bottom", item: byId("i5") },
      { slot: "Shoes", item: byId("i6") },
      { slot: "Accessory", item: byId("i13") },
    ],
    why: "A white tee and light-wash jeans, worn the way they should be.",
    savedAt: "2026-09-27",
    rating: 4,
  },
];

export const mockConversation: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    text: "Good morning. Tell me where you're headed, and I'll style something from your wardrobe.",
  },
  { id: "m2", role: "user", text: "I need something comfortable but put together for class tomorrow." },
  {
    id: "m3",
    role: "assistant",
    text: "Understood. I've put together a relaxed look in neutral tones. You'll find it alongside.",
    suggestion: classLook,
  },
];

export function getOutfitById(id: string | undefined) {
  return [...savedOutfits, classLook, alternateLook].find((o) => o.id === id) ?? classLook;
}
