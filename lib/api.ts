// One place for backend calls. Contract: api/CONTRACT.md on the backend-api branch.
import type { Category, PredictRequest, PredictResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// User-facing error messages, worded as in the contract.
export const API_ERRORS = {
  invalid: "Please enter a valid item name.", // 422
  unavailable: "The stylist is unavailable right now. Try again soon.", // 503
  unknown: "Something went wrong.",
} as const;

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function predictCategory(body: PredictRequest, signal?: AbortSignal): Promise<PredictResponse> {
  if (!API_URL) {
    throw new ApiError(`${API_ERRORS.unknown} (NEXT_PUBLIC_API_URL is not set.)`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(API_ERRORS.unknown); // network or CORS failure
  }

  if (res.status === 422) throw new ApiError(API_ERRORS.invalid, 422);
  if (res.status === 503) throw new ApiError(API_ERRORS.unavailable, 503);
  if (!res.ok) throw new ApiError(API_ERRORS.unknown, res.status);
  return res.json();
}

// Raw model label → app category (the contract's mapping table).
export const LABEL_TO_CATEGORY: Record<string, Category> = {
  tops: "Tops",
  bottoms: "Bottoms",
  "all-body": "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  bags: "Bags",
  jewellery: "Accessories",
  sunglasses: "Accessories",
  hats: "Accessories",
  scarves: "Accessories",
  accessories: "Accessories",
};

// top_3 in app categories. Several raw labels map to Accessories, so their
// probabilities are added together; the result is sorted highest first.
export function topCategories(top3: PredictResponse["top_3"]): { category: Category; probability: number }[] {
  const totals = new Map<Category, number>();
  for (const { category, probability } of top3) {
    const app = LABEL_TO_CATEGORY[category];
    if (app) totals.set(app, (totals.get(app) ?? 0) + probability);
  }
  return [...totals]
    .map(([category, probability]) => ({ category, probability }))
    .sort((a, b) => b.probability - a.probability);
}

// Under this confidence, ask the user to pick instead of labelling automatically.
export const LOW_CONFIDENCE = 0.5;
