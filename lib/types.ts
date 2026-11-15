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

// Slots the /predict API returns for an item.
export type Slot = "Top" | "Bottom" | "Shoes" | "Accessory";

// Slots a look can fill: the API slots plus the ones the Stylist and Fitting Room show.
export type LookSlot = Slot | "Outerwear" | "Belt" | "Bag";
export const lookSlots: LookSlot[] = ["Top", "Bottom", "Outerwear", "Shoes", "Belt", "Bag", "Accessory"];

// The two drawn model bodies (components/Model.tsx).
export type ModelStyle = "feminine" | "masculine";

// The drawing used for an item when there's no photo (see components/GarmentArt.tsx).
export type GarmentKind =
  | "blazer"
  | "jacket"
  | "leather" // leather jacket
  | "tee"
  | "shell"
  | "shirt" // button-up
  | "skirt"
  | "dress"
  | "trousers"
  | "wideleg" // wide-leg trousers
  | "jeans"
  | "belt"
  | "sneakers"
  | "boots"
  | "pumps"
  | "loafers"
  | "bag" // shoulder bag
  | "tophandle" // top-handle bag
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
  slot: LookSlot;
  item: ClothingItem;
}

// What the AI stylist returns: structured data, not plain text.
export interface OutfitSuggestion {
  id: string;
  occasion: string;
  items: OutfitItem[];
  why: string;
  closetGap?: string; // something the closet is missing for this occasion
  model?: ModelStyle; // body the look was styled on; the user can switch it in the Fitting Room
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
