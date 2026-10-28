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

export const occasions = [
  "Class",
  "Work",
  "Date Night",
  "Interview",
  "Party",
  "Casual Weekend",
];

export const closetItems: ClothingItem[] = [
  { id: "i1", name: "Pink Baby Tee", category: "Tops", imageUrl: "/items/i1.svg" },
  { id: "i2", name: "Lavender Cardigan Top", category: "Tops", imageUrl: "/items/i2.svg" },
  { id: "i3", name: "Light Wash Jeans", category: "Bottoms", imageUrl: "/items/i3.svg" },
  { id: "i4", name: "Butter Yellow Trousers", category: "Bottoms", imageUrl: "/items/i4.svg" },
  { id: "i5", name: "Rosy Slip Dress", category: "Dresses", imageUrl: "/items/i5.svg" },
  { id: "i6", name: "Lilac Bomber Jacket", category: "Outerwear", imageUrl: "/items/i6.svg" },
  { id: "i7", name: "White Platform Sneakers", category: "Shoes", imageUrl: "/items/i7.svg" },
  { id: "i8", name: "Pink Mary Janes", category: "Shoes", imageUrl: "/items/i8.svg" },
  { id: "i9", name: "Yellow Mini Bag", category: "Bags", imageUrl: "/items/i9.svg" },
  { id: "i10", name: "Purple Sunglasses", category: "Accessories", imageUrl: "/items/i10.svg" },
  { id: "i11", name: "Mint Ribbed Tank", category: "Tops", imageUrl: "/items/i11.svg" },
  { id: "i12", name: "Blush Puffer Vest", category: "Outerwear", imageUrl: "/items/i12.svg" },
];

const byId = (id: string) => closetItems.find((i) => i.id === id)!;

export const classOutfit: OutfitSuggestion = {
  id: "o1",
  occasion: "Class",
  items: [
    { slot: "Top", item: byId("i1") },
    { slot: "Bottom", item: byId("i3") },
    { slot: "Shoes", item: byId("i7") },
    { slot: "Accessory", item: byId("i10") },
  ],
  why: "Easy, comfy pieces for a long day on campus. The pink tee adds a pop of color, the jeans go with everything, and the sneakers handle all the walking.",
};

export const savedOutfits: SavedOutfit[] = [
  { ...classOutfit, savedAt: "2026-10-20", rating: 5 },
  {
    id: "o2",
    occasion: "Date Night",
    items: [
      { slot: "Top", item: byId("i5") },
      { slot: "Bottom", item: byId("i6") },
      { slot: "Shoes", item: byId("i8") },
      { slot: "Accessory", item: byId("i9") },
    ],
    why: "A soft slip dress with a cozy jacket on top, finished with cute Mary Janes.",
    savedAt: "2026-10-14",
    rating: 4,
  },
  {
    id: "o3",
    occasion: "Interview",
    items: [
      { slot: "Top", item: byId("i2") },
      { slot: "Bottom", item: byId("i4") },
      { slot: "Shoes", item: byId("i8") },
      { slot: "Accessory", item: byId("i9") },
    ],
    why: "Polished but still you. Lavender and butter yellow keep it friendly.",
    savedAt: "2026-10-02",
    rating: 3,
  },
  {
    id: "o4",
    occasion: "Casual Weekend",
    items: [
      { slot: "Top", item: byId("i11") },
      { slot: "Bottom", item: byId("i3") },
      { slot: "Shoes", item: byId("i7") },
      { slot: "Accessory", item: byId("i10") },
    ],
    why: "Mint tank, jeans and sneakers: effortless for brunch or errands.",
    savedAt: "2026-09-27",
    rating: 4,
  },
];

export const mockConversation: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    text: "Hi! I'm your stylist. Tell me what you're dressing for and I'll pull an outfit from your closet.",
  },
  { id: "m2", role: "user", text: "I need something comfy but cute for class tomorrow." },
  {
    id: "m3",
    role: "assistant",
    text: "Got it! Here's a look that's comfy for a full day of lectures.",
    suggestion: classOutfit,
  },
];

// Used by "Show another" in the Stylist screen.
export const alternateOutfit: OutfitSuggestion = {
  id: "o5",
  occasion: "Class",
  items: [
    { slot: "Top", item: byId("i11") },
    { slot: "Bottom", item: byId("i4") },
    { slot: "Shoes", item: byId("i8") },
    { slot: "Accessory", item: byId("i9") },
  ],
  why: "A fresher take: mint tank with butter yellow trousers. Light, bright, and still easy to move in.",
};

export function getOutfitById(id: string | undefined) {
  return [...savedOutfits, classOutfit, alternateOutfit].find((o) => o.id === id) ?? classOutfit;
}
