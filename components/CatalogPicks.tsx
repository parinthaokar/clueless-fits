"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import GarmentImage from "@/components/GarmentImage";
import { Button, Card, Pill } from "@/components/ui";
import { sortBySlot } from "@/lib/outfit";
import type { OutfitItem } from "@/lib/types";

// "Discover" card: pieces from the Polyvore catalog picked by our recommendation model
// (FashionCLIP + trained adapter + category prior, served on Modal via /api/outfit).
// The chat above styles looks from the user's closet; this suggests pieces they don't own yet.
// Catalog photos are never shown, so each pick is drawn from its name (lib/recommend.ts).
export default function CatalogPicks({ occasion }: { occasion: string }) {
  const [text, setText] = useState("");
  const [items, setItems] = useState<OutfitItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [variant, setVariant] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function find(q: string, v: number) {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/outfit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q, variant: v }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setItems((await res.json()).items);
      setQuery(q);
      setVariant(v);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const search = () => find(text.trim() || `${occasion} outfit`, 0);

  return (
    <Card as="section" aria-labelledby="catalog-title" className="p-5 sm:px-6 sm:py-[22px]">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="catalog-title" className="mr-1 text-[22px] font-black tracking-[-0.01em]">
          Discover new pieces
        </h2>
        {items && (
          <Pill size="sm" className="ml-auto" onClick={() => void find(query, variant + 1)}>
            <RotateCw size={14} aria-hidden="true" /> Shuffle
          </Pill>
        )}
      </div>
      <p className="mt-1 text-muted">
        Pieces from the catalog that fit what you&apos;re after, picked by our recommendation model.
      </p>

      <form
        className="mt-4 flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <label htmlFor="catalog-q" className="sr-only">
          What are you looking for?
        </label>
        <input
          id="catalog-q"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Describe a piece, or leave blank for ${occasion.toLowerCase()}`}
          maxLength={200}
          className="min-w-0 flex-1 rounded-full border-2 border-ink bg-white px-5 py-2.5 text-base outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raspberry"
        />
        <Button type="submit" loading={loading}>
          Find pieces
        </Button>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-[15px] text-raspberry">
          The recommender didn&apos;t answer. It may be waking up, so try again in a few seconds.
        </p>
      )}

      {items && (
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-busy={loading}>
          {sortBySlot(items).map(({ slot, item }) => (
            <li key={slot} className="text-center">
              <Card size="sm" className="p-1.5">
                <div className="aspect-square overflow-hidden rounded-[10px]">
                  <GarmentImage item={item} />
                </div>
              </Card>
              <p className="mt-2.5 text-[11px] font-extrabold tracking-[0.06em] uppercase">{slot}</p>
              <p className="text-[13px] text-muted">{item.name}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
