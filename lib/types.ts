// Types shaped like what a real API would return.

export type Category =
  | "Tops"
  | "Bottoms"
  | "Dresses"
  | "Outerwear"
  | "Shoes"
  | "Bags"
  | "Accessories";

export type Slot = "Top" | "Bottom" | "Shoes" | "Accessory";

export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
}

export interface OutfitItem {
  slot: Slot;
  item: ClothingItem;
}

// What the AI stylist returns: structured data, not plain text.
export interface OutfitSuggestion {
  id: string;
  occasion: string;
  items: OutfitItem[];
  why: string;
}

export interface SavedOutfit extends OutfitSuggestion {
  savedAt: string; // ISO date
  rating: number; // 1-5
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  suggestion?: OutfitSuggestion; // assistant messages can carry a look
}
