// All mock data lives here. Swap these exports for real API calls later.
import type {
  Category,
  ChatMessage,
  ClothingItem,
  OutfitSuggestion,
  SavedOutfit,
} from "./types";

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

export const wardrobeItems: ClothingItem[] = [
  { id: "i1", name: "Ivory Cotton Tee", category: "Tops", imageUrl: "/items/i1.svg" },
  { id: "i2", name: "Taupe Knit Sweater", category: "Tops", imageUrl: "/items/i2.svg" },
  { id: "i3", name: "Slate Straight Jeans", category: "Bottoms", imageUrl: "/items/i3.svg" },
  { id: "i4", name: "Sand Wool Trousers", category: "Bottoms", imageUrl: "/items/i4.svg" },
  { id: "i5", name: "Black Slip Dress", category: "Dresses", imageUrl: "/items/i5.svg" },
  { id: "i6", name: "Olive Field Jacket", category: "Outerwear", imageUrl: "/items/i6.svg" },
  { id: "i7", name: "White Leather Sneakers", category: "Shoes", imageUrl: "/items/i7.svg" },
  { id: "i8", name: "Brown Leather Loafers", category: "Shoes", imageUrl: "/items/i8.svg" },
  { id: "i9", name: "Tan Leather Tote", category: "Bags", imageUrl: "/items/i9.svg" },
  { id: "i10", name: "Black Acetate Sunglasses", category: "Accessories", imageUrl: "/items/i10.svg" },
  { id: "i11", name: "Oat Ribbed Tank", category: "Tops", imageUrl: "/items/i11.svg" },
  { id: "i12", name: "Camel Wool Coat", category: "Outerwear", imageUrl: "/items/i12.svg" },
];

const byId = (id: string) => wardrobeItems.find((i) => i.id === id)!;

export const classLook: OutfitSuggestion = {
  id: "o1",
  occasion: "Class",
  items: [
    { slot: "Top", item: byId("i2") },
    { slot: "Bottom", item: byId("i3") },
    { slot: "Shoes", item: byId("i7") },
    { slot: "Accessory", item: byId("i10") },
  ],
  why: "Considered ease for a long day. The knit adds warmth, the denim keeps it relaxed, and clean white sneakers carry you across campus.",
};

export const alternateLook: OutfitSuggestion = {
  id: "o5",
  occasion: "Class",
  items: [
    { slot: "Top", item: byId("i11") },
    { slot: "Bottom", item: byId("i4") },
    { slot: "Shoes", item: byId("i8") },
    { slot: "Accessory", item: byId("i9") },
  ],
  why: "A softer, more tailored option. Oat and sand stay quiet together; the loafers and tote add structure.",
};

export const savedOutfits: SavedOutfit[] = [
  { ...classLook, savedAt: "2026-10-20", rating: 5 },
  {
    id: "o2",
    occasion: "Evening",
    items: [
      { slot: "Top", item: byId("i5") },
      { slot: "Bottom", item: byId("i12") },
      { slot: "Shoes", item: byId("i8") },
      { slot: "Accessory", item: byId("i9") },
    ],
    why: "A black slip dress under a camel coat. Simple, and nothing more is needed.",
    savedAt: "2026-10-14",
    rating: 4,
  },
  {
    id: "o3",
    occasion: "Interview",
    items: [
      { slot: "Top", item: byId("i11") },
      { slot: "Bottom", item: byId("i4") },
      { slot: "Shoes", item: byId("i8") },
      { slot: "Accessory", item: byId("i9") },
    ],
    why: "Polished and measured, in a tonal palette that reads as confident.",
    savedAt: "2026-10-02",
    rating: 3,
  },
  {
    id: "o4",
    occasion: "Weekend",
    items: [
      { slot: "Top", item: byId("i1") },
      { slot: "Bottom", item: byId("i3") },
      { slot: "Shoes", item: byId("i7") },
      { slot: "Accessory", item: byId("i10") },
    ],
    why: "A white tee and denim, worn the way it should be.",
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
