"use client";

import { useEffect, useState } from "react";
import type { OutfitSuggestion } from "@/lib/types";
import GarmentImage from "./GarmentImage";
import RatingDots from "./RatingDots";

const wearOptions = ["Yes", "Maybe", "No"];

export default function FittingRoomView({ outfit }: { outfit: OutfitSuggestion }) {
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [wear, setWear] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Fake render time. A real app would wait for the avatar API here.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [outfit.id]);

  return (
    <div>
      <p className="label">Fitting Room</p>
      <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{outfit.occasion}</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_220px]">
        {/* Studio viewer */}
        <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-stone sm:aspect-[4/3] lg:aspect-[4/4.4]">
          {loading ? (
            <div className="w-48 text-center">
              <div className="h-px w-full overflow-hidden bg-line">
                <div className="progress-line h-px bg-ink" />
              </div>
              <p className="label mt-4">Preparing your look…</p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/avatar.svg" alt="Your avatar" className="fade-in h-full object-contain" />
          )}
        </div>

        {/* Pieces */}
        <aside>
          <p className="label">The Pieces</p>
          <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-1">
            {outfit.items.map(({ slot, item }) => (
              <li key={slot} className="group flex items-center gap-4">
                <div className="h-20 w-[60px] shrink-0">
                  <GarmentImage src={item.imageUrl} alt={item.name} />
                </div>
                <div className="min-w-0">
                  <p className="label">{slot}</p>
                  <p className="mt-1 text-sm">{item.name}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Rating */}
      <section className="mt-16 max-w-xl border-t border-line pt-8">
        <p className="text-sm">How well do these pieces work together?</p>
        <div className="mt-4">
          <RatingDots value={rating} onChange={setRating} />
        </div>

        <p className="mt-8 text-sm">Would you wear this?</p>
        <div className="mt-4 flex gap-2">
          {wearOptions.map((option) => (
            <button
              key={option}
              onClick={() => setWear(option)}
              className={`label border px-5 py-2 transition-colors ${
                wear === option ? "border-accent bg-accent text-paper" : "border-line hover:border-ink hover:text-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-6">
          <button
            onClick={() => setSubmitted(true)}
            disabled={!rating || !wear}
            className="label bg-accent px-6 py-3 text-paper hover:opacity-90 disabled:opacity-30"
          >
            Submit
          </button>
          {submitted && <p className="fade-in text-sm text-muted">Thank you. Noted.</p>}
        </div>
      </section>
    </div>
  );
}
