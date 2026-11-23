import { NextResponse } from "next/server";
import type { Category, OutfitSuggestion, Slot } from "@/lib/types";

// Browser -> this route (keeps the API key server-side) -> Modal recommender.
const SLOTS: { slot: Slot; dataset: string; category: Category }[] = [
  { slot: "Top", dataset: "tops", category: "Tops" },
  { slot: "Bottom", dataset: "bottoms", category: "Bottoms" },
  { slot: "Shoes", dataset: "shoes", category: "Shoes" },
  { slot: "Accessory", dataset: "accessories", category: "Accessories" },
];

interface ModalItem { item_id: string; name: string; category: string; score: number; image_url: string }

async function search(query: string, category: string, k: number): Promise<ModalItem[]> {
  const res = await fetch(`${process.env.MODAL_API_URL}/search`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.MODAL_API_KEY ?? "" },
    body: JSON.stringify({ query, k, category }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`recommender ${res.status}`);
  return (await res.json()).items;
}

// POST { query: string, variant?: number }  ->  OutfitSuggestion
// variant 0 = best match per slot, 1 = next best, ... ("show me another look")
export async function POST(req: Request) {
  const { query, variant = 0 } = await req.json().catch(() => ({}));
  if (typeof query !== "string" || !query.trim() || query.length > 200) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }
  const v = Math.max(0, Math.min(Number(variant) || 0, 4));
  try {
    const perSlot = await Promise.all(SLOTS.map((s) => search(query, s.dataset, v + 1)));
    const picks = SLOTS.map((s, i) => ({ s, hit: perSlot[i][Math.min(v, perSlot[i].length - 1)] }));
    const avg = picks.reduce((a, p) => a + p.hit.score, 0) / picks.length;
    const outfit: OutfitSuggestion = {
      id: `rec-${Date.now()}`,
      occasion: query,
      items: picks.map(({ s, hit }) => ({
        slot: s.slot,
        item: { id: hit.item_id, name: hit.name, category: s.category, imageUrl: hit.image_url },
      })),
      why: `Closest catalog matches for "${query}", one per slot.`,
      match: Math.max(0, Math.min(99, Math.round(avg * 250))), // rough display score, not a calibrated metric
    };
    return NextResponse.json(outfit);
  } catch {
    return NextResponse.json({ error: "recommender unavailable" }, { status: 502 });
  }
}
