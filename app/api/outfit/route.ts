import { NextResponse } from "next/server";
import { toClothingItem } from "@/lib/recommend";
import type { Category, LookSlot, OutfitSuggestion } from "@/lib/types";

// Browser -> this route (keeps the API key server-side) -> Modal recommender (recommender/modal_app.py).
// One search per slot with the selected model (FashionCLIP + adapter + category prior).
// `noun` makes the prompt read like a catalog product name, which is what the model was trained on.
const SLOTS: { slot: LookSlot; dataset: string; category: Category; noun: string }[] = [
  { slot: "Top", dataset: "tops", category: "Tops", noun: "top" },
  { slot: "Bottom", dataset: "bottoms", category: "Bottoms", noun: "trousers" },
  { slot: "Outerwear", dataset: "outerwear", category: "Outerwear", noun: "jacket" },
  { slot: "Shoes", dataset: "shoes", category: "Shoes", noun: "shoes" },
  { slot: "Bag", dataset: "bags", category: "Bags", noun: "bag" },
];

// The model knows product names, not occasions ("something for a wedding" is untested), so the
// Stylist's occasion pills are translated into the style words a product name would carry.
const OCCASION_STYLE: Record<string, string> = {
  class: "casual comfortable",
  work: "tailored office",
  dinner: "elegant chic",
  interview: "polished tailored",
  party: "chic party",
  weekend: "relaxed casual",
};
const styleFor = (query: string) => OCCASION_STYLE[query.trim().toLowerCase().replace(/ outfit$/, "")] ?? query.trim();

interface Hit { item_id: string; name: string; category: string; score: number; image_url: string }

async function search(query: string, category: string, k: number): Promise<Hit[]> {
  const res = await fetch(`${process.env.MODAL_API_URL}/search`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.MODAL_API_KEY ?? "" },
    body: JSON.stringify({ query, k, category }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`recommender ${res.status}`);
  return (await res.json()).items;
}

// POST { query: string, variant?: number } -> OutfitSuggestion
// variant 0 = best match per slot, 1 = next best, ... (Shuffle)
export async function POST(req: Request) {
  const { query, variant = 0 } = await req.json().catch(() => ({}));
  if (typeof query !== "string" || !query.trim() || query.length > 200) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }
  const v = Math.max(0, Math.min(Number(variant) || 0, 9));
  try {
    const perSlot = await Promise.all(SLOTS.map((s) => search(`${styleFor(query)} ${s.noun}`, s.dataset, v + 1)));
    const look: OutfitSuggestion = {
      id: `rec-${Date.now()}`,
      occasion: query,
      items: SLOTS.map((s, i) => ({
        slot: s.slot,
        item: toClothingItem(perSlot[i][Math.min(v, perSlot[i].length - 1)], s.category),
      })),
      why: `The recommendation model's closest catalog matches for "${query}", one per slot, drawn from your prompt.`,
    };
    return NextResponse.json(look);
  } catch {
    return NextResponse.json({ error: "recommender unavailable" }, { status: 502 });
  }
}
