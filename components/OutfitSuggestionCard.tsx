import Link from "next/link";
import { Check, Heart, RefreshCw, Shirt } from "lucide-react";
import type { OutfitSuggestion } from "@/lib/types";
import ItemImage from "./ItemImage";

interface Props {
  outfit: OutfitSuggestion;
  saved: boolean;
  onSave: () => void;
  onShowAnother: () => void;
}

export default function OutfitSuggestionCard({ outfit, saved, onSave, onShowAnother }: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-pink/50 bg-white shadow-sm">
      <div className="gingham h-3" />
      <div className="p-5">
        <p className="text-sm text-ink/60">Suggested Outfit</p>
        <h2 className="font-display text-3xl">{outfit.occasion}</h2>

        {/* One tile per slot */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {outfit.items.map(({ slot, item }) => (
            <div key={slot}>
              <div className="aspect-square overflow-hidden rounded-xl">
                <ItemImage src={item.imageUrl} alt={item.name} />
              </div>
              <p className="mt-1 text-center text-xs font-medium text-ink/70">{slot}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-butter p-4">
          <p className="text-sm font-semibold">Why this works</p>
          <p className="mt-1 text-sm">{outfit.why}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/try-on?outfit=${outfit.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-pink-deep px-5 py-2 text-sm font-medium text-white"
          >
            <Shirt size={16} /> Try it on
          </Link>
          <button
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-full border border-lavender px-5 py-2 text-sm font-medium hover:bg-lilac"
          >
            {saved ? <Check size={16} /> : <Heart size={16} />} {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={onShowAnother}
            className="inline-flex items-center gap-2 rounded-full border border-lavender px-5 py-2 text-sm font-medium hover:bg-lilac"
          >
            <RefreshCw size={16} /> Show another
          </button>
        </div>
      </div>
    </div>
  );
}
