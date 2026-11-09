// Types shaped like what a real API would return.
import type { ColorName } from "./colors";

export type Category =
  | "Tops"
  | "Bottoms"
  | "Dresses"
  | "Outerwear"
  | "Shoes"
  | "Bags"
  | "Accessories";

export type Slot = "Top" | "Bottom" | "Shoes" | "Accessory";

// The drawing used for an item when there's no photo (see components/GarmentArt.tsx).
export type GarmentKind =
  | "blazer"
  | "jacket"
  | "tee"
  | "shell"
  | "skirt"
  | "dress"
  | "trousers"
  | "jeans"
  | "sneakers"
  | "boots"
  | "pumps"
  | "bag"
  | "sunglasses";

export type Pattern = "solid" | "plaid" | "stripe";

export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  kind: GarmentKind;
  color: ColorName; // see lib/colors.ts
  pattern: Pattern;
  description?: string;
  photoUrl?: string; // the user's own photo, used as the picture only; never a Polyvore image
  addedAt: string; // ISO date
}

// POST /predict (contract: api/CONTRACT.md on the backend-api branch)
export interface PredictRequest {
  name: string;
  description?: string;
}

export interface PredictResponse {
  category: string; // raw model label (11 values)
  app_category: Category; // use this one in the UI
  slots: Slot[];
  confidence: number; // 0–1
  top_3: { category: string; probability: number }[];
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
