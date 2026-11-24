// All mock data lives here. Swap these exports for real API calls later.
import { DEMO_PHOTOS } from "./demoPhotos";
import type {
  Category,
  ChatMessage,
  ClothingItem,
  ModelStyle,
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

export const occasions = ["Class", "Work", "Dinner", "Interview", "Party", "Weekend"];

// The demo closet: the pieces drawn in design/screens (wardrobe, stylist, fitting room)
// plus the v5 model pieces from design/model_v5.
const piece = (
  id: string,
  name: string,
  category: Category,
  kind: ClothingItem["kind"],
  color: ClothingItem["color"],
  addedAt: string,
  pattern: ClothingItem["pattern"] = "solid",
): ClothingItem => ({ id, name, category, kind, color, pattern, addedAt, photoUrl: DEMO_PHOTOS[id] });

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
  // v5 pieces (design/model_v5/notes.md)
  piece("i14", "White Button-Up Shirt", "Tops", "shirt", "white", "2026-09-06"),
  piece("i15", "Brown Leather Belt", "Accessories", "belt", "brown", "2026-09-06"),
  piece("i16", "Black Wide-Leg Trousers", "Bottoms", "wideleg", "black", "2026-09-03"),
  piece("i17", "Black Pointed Pumps", "Shoes", "pumps", "black", "2026-08-30"),
  piece("i18", "Tan Top-Handle Bag", "Bags", "tophandle", "camel", "2026-08-27"),
  piece("i19", "Black Leather Jacket", "Outerwear", "leather", "black", "2026-08-22"),
  piece("i20", "White Crew Tee", "Tops", "tee", "white", "2026-08-18"),
  piece("i21", "Black Belt", "Accessories", "belt", "black", "2026-08-18"),
  piece("i22", "Stone Wide-Leg Trousers", "Bottoms", "wideleg", "stone", "2026-08-14"),
  piece("i23", "Black Loafers", "Shoes", "loafers", "black", "2026-08-10"),
  piece("i24", "Black Sunglasses", "Accessories", "sunglasses", "black", "2026-08-06"),
  // v6 pieces (design/model_v6/notes.md)
  piece("i25", "Grey Double-Breasted Blazer", "Outerwear", "dbblazer", "slate", "2026-08-02"),
  piece("i26", "Grey Wide-Leg Trousers", "Bottoms", "suitpants", "slate", "2026-08-02"),
  piece("i27", "Tortoiseshell Glasses", "Accessories", "glasses", "tortoise", "2026-07-29"),
];

export const byId = (id: string) => wardrobeItems.find((i) => i.id === id);
const get = (id: string) => byId(id)!;

// Looks -------------------------------------------------------------------------------------

// design/screens/5_fitting_room
export const classLook: OutfitSuggestion = {
  id: "o1",
  occasion: "Class",
  items: [
    { slot: "Top", item: get("i3") },
    { slot: "Bottom", item: get("i2") },
    { slot: "Outerwear", item: get("i1") },
    { slot: "Shoes", item: get("i7") },
    { slot: "Accessory", item: get("i13") },
  ],
  why: "a baby tee and pleated mini under the plaid blazer keep it easy for a long day; knee-high boots and tinted shades make it a look.",
};

export const alternateLook: OutfitSuggestion = {
  id: "o5",
  occasion: "Class",
  items: [
    { slot: "Top", item: get("i9") },
    { slot: "Bottom", item: get("i5") },
    { slot: "Shoes", item: get("i6") },
    { slot: "Bag", item: get("i8") },
  ],
  why: "softer and more relaxed: a silk shell with light-wash denim, platform sneakers, and a pink bag for color.",
};

// design/screens/4_stylist
export const workLook: OutfitSuggestion = {
  id: "o6",
  occasion: "Work",
  items: [
    { slot: "Top", item: get("i9") },
    { slot: "Bottom", item: get("i10") },
    { slot: "Outerwear", item: get("i1") },
    { slot: "Shoes", item: get("i11") },
    { slot: "Bag", item: get("i8") },
  ],
  why: "the plaid blazer and trousers are a matching suit, the white silk shell keeps it crisp, and raspberry pumps and a pink purse add color.",
  closetGap: "you have no rain jacket. If it rains this week, consider adding one.",
};

// design/model_v6: the feminine model's default Work look (no bag)
const tailoredLook: OutfitSuggestion = {
  id: "o7",
  occasion: "Work",
  items: [
    { slot: "Bottom", item: get("i26") },
    { slot: "Outerwear", item: get("i25") },
    { slot: "Shoes", item: get("i17") },
    { slot: "Accessory", item: get("i27") },
  ],
  why: "a grey double-breasted suit is sharp on its own: a deep V under the blazer keeps it modern, pointed black pumps lengthen the wide legs, and tortoiseshell glasses add warmth.",
  closetGap: "you have no rain jacket. If it rains this week, consider adding one.",
};

// design/screens/6_fitting_room_masc
const weekendLook: OutfitSuggestion = {
  id: "o8",
  occasion: "Weekend",
  model: "masculine",
  items: [
    { slot: "Top", item: get("i20") },
    { slot: "Bottom", item: get("i5") },
    { slot: "Outerwear", item: get("i12") },
    { slot: "Shoes", item: get("i6") },
    { slot: "Accessory", item: get("i13") },
  ],
  why: "a crew tee, light-wash jeans and a denim jacket are an easy uniform; white sneakers and tinted shades keep it fun.",
};

// design/model_v5 masculine reference (v6: the black sunglasses are no longer part of it)
const leatherLook: OutfitSuggestion = {
  id: "o9",
  occasion: "Dinner",
  model: "masculine",
  items: [
    { slot: "Top", item: get("i20") },
    { slot: "Bottom", item: get("i22") },
    { slot: "Outerwear", item: get("i19") },
    { slot: "Shoes", item: get("i23") },
    { slot: "Belt", item: get("i21") },
  ],
  why: "a black leather jacket over a white tee is a classic; stone wide-leg trousers and loafers dress it up for dinner.",
};

const partyLook: OutfitSuggestion = {
  id: "o10",
  occasion: "Party",
  items: [
    { slot: "Top", item: get("i4") },
    { slot: "Outerwear", item: get("i19") },
    { slot: "Shoes", item: get("i7") },
    { slot: "Accessory", item: get("i24") },
  ],
  why: "the pink slip dress is the star; the leather jacket and knee-high boots give it an edge.",
};

// What the Fitting Room's model wears when the URL names no look (no ?outfit, ?items or ?saved):
// the v6 default for each body (design/model_v6/notes.md). The plaid Class look stays a Class
// suggestion and a saved look.
export const defaultLooks: Record<ModelStyle, OutfitSuggestion> = {
  feminine: tailoredLook,
  masculine: leatherLook,
};

export const savedOutfits: SavedOutfit[] = [
  { ...classLook, savedAt: "2026-10-20", rating: 5 },
  {
    id: "o2",
    occasion: "Dinner",
    items: [
      { slot: "Top", item: get("i9") },
      { slot: "Bottom", item: get("i2") },
      { slot: "Shoes", item: get("i11") },
      { slot: "Bag", item: get("i8") },
    ],
    why: "a white silk shell over the pleated mini, with raspberry pumps and the pink bag for color.",
    savedAt: "2026-10-14",
    rating: 4,
  },
  {
    id: "o3",
    occasion: "Interview",
    items: [
      { slot: "Top", item: get("i9") },
      { slot: "Bottom", item: get("i10") },
      { slot: "Shoes", item: get("i11") },
      { slot: "Bag", item: get("i8") },
    ],
    why: "plaid suit trousers with a white silk shell read polished; the pumps add confidence.",
    savedAt: "2026-10-02",
    rating: 3,
  },
  {
    id: "o4",
    occasion: "Weekend",
    items: [
      { slot: "Top", item: get("i3") },
      { slot: "Bottom", item: get("i5") },
      { slot: "Shoes", item: get("i6") },
      { slot: "Accessory", item: get("i13") },
    ],
    why: "a white tee and light-wash jeans, worn the way they should be.",
    savedAt: "2026-09-27",
    rating: 4,
  },
];

const saved = (id: string) => savedOutfits.find((o) => o.id === id)!;

// What the mock stylist suggests for each occasion pill; Shuffle cycles through the list.
export const looksByOccasion: Record<string, OutfitSuggestion[]> = {
  Class: [classLook, alternateLook],
  Work: [tailoredLook, workLook],
  Dinner: [saved("o2"), leatherLook],
  Interview: [saved("o3"), tailoredLook],
  Party: [partyLook, saved("o2")],
  Weekend: [weekendLook, saved("o4")],
};

// design/screens/4_stylist: the conversation shown when the page opens.
export const mockConversation: ChatMessage[] = [
  { id: "m1", role: "user", text: "Big presentation at work today. Polished but still fun?" },
  {
    id: "m2",
    role: "assistant",
    text: `It's ${weather.tempF}°F and ${weather.summary}, so a full suit works. Here's your look →`,
    suggestion: tailoredLook,
  },
];

const allLooks = [classLook, alternateLook, workLook, tailoredLook, weekendLook, leatherLook, partyLook, ...savedOutfits];

export function getOutfitById(id: string | undefined) {
  return allLooks.find((o) => o.id === id);
}
