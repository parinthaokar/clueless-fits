"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { OutfitSuggestion } from "@/lib/types";
import ItemImage from "./ItemImage";
import StarRating from "./StarRating";

const wearOptions = ["Yes", "Maybe", "No"];

export default function TryOnView({ outfit }: { outfit: OutfitSuggestion }) {
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(0);
  const [wear, setWear] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Fake render time. A real app would wait for the avatar API here.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [outfit.id]);

  return (
    <div>
      <h1 className="font-display text-4xl">Try-On</h1>
      <p className="text-ink/70">{outfit.occasion} look</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Avatar viewer */}
        <div className="flex aspect-[4/5] max-h-[600px] items-center justify-center overflow-hidden rounded-3xl border-2 border-pink/50 bg-lilac shadow-sm lg:aspect-[4/3]">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={40} className="animate-spin text-pink-deep" />
              <p className="font-medium">Dressing your avatar...</p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/avatar.svg" alt="Your avatar" className="h-full object-contain" />
          )}
        </div>

        {/* Outfit pieces */}
        <aside className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">In this outfit</h2>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {outfit.items.map(({ slot, item }) => (
              <li key={slot} className="flex items-center gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <ItemImage src={item.imageUrl} alt={item.name} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-ink/60">{slot}</p>
                  <p className="truncate text-sm font-medium">{item.name}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Rating */}
      <section className="mt-6 rounded-3xl border-2 border-butter-deep/50 bg-butter p-6">
        <h2 className="font-display text-2xl">Rate this look</h2>

        <p className="mt-4 font-medium">Do these pieces match?</p>
        <div className="mt-1">
          <StarRating value={stars} onChange={setStars} />
        </div>

        <p className="mt-4 font-medium">Would you actually wear this?</p>
        <div className="mt-2 flex gap-2">
          {wearOptions.map((option) => (
            <button
              key={option}
              onClick={() => setWear(option)}
              className={`rounded-full border px-5 py-1.5 text-sm ${
                wear === option ? "border-pink-deep bg-pink font-medium" : "border-lavender bg-white hover:bg-lilac"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => setSubmitted(true)}
            disabled={!stars || !wear}
            className="rounded-full bg-pink-deep px-6 py-2 font-medium text-white disabled:opacity-40"
          >
            Submit
          </button>
          {submitted && <p className="text-sm font-medium">Thanks! Your feedback helps your stylist learn.</p>}
        </div>
      </section>
    </div>
  );
}
