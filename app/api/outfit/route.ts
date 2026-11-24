import { NextResponse } from "next/server";

// Browser -> this route (keeps the API key server-side) -> Modal recommender (recommender/modal_app.py).
// Returns the best catalog match per slot. Mapping these to ClothingItem for the Stylist UI is a TODO.
const SLOTS = [
  { slot: "Top", dataset: "tops" },
  { slot: "Bottom", dataset: "bottoms" },
  { slot: "Shoes", dataset: "shoes" },
  { slot: "Accessory", dataset: "accessories" },
] as const;

interface Hit { item_id: string; name: string; category: string; score: number }

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

// POST { query: string, variant?: number }  (variant 0 = best match per slot, 1 = next best, ...)
export async function POST(req: Request) {
  const { query, variant = 0 } = await req.json().catch(() => ({}));
  if (typeof query !== "string" || !query.trim() || query.length > 200) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }
  const v = Math.max(0, Math.min(Number(variant) || 0, 4));
  try {
    const perSlot = await Promise.all(SLOTS.map((s) => search(query, s.dataset, v + 1)));
    const items = SLOTS.map((s, i) => ({ slot: s.slot, ...perSlot[i][Math.min(v, perSlot[i].length - 1)] }));
    return NextResponse.json({ query, items });
  } catch {
    return NextResponse.json({ error: "recommender unavailable" }, { status: 502 });
  }
}
