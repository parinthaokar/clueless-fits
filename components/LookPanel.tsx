import Link from "next/link";
import type { OutfitSuggestion } from "@/lib/types";
import GarmentImage from "./GarmentImage";

interface Props {
  outfit: OutfitSuggestion;
  saved: boolean;
  onSave: () => void;
  onAnother: () => void;
}

export default function LookPanel({ outfit, saved, onSave, onAnother }: Props) {
  return (
    <div key={outfit.id} className="fade-in">
      <p className="label">The Look</p>
      <h2 className="mt-2 font-serif text-4xl sm:text-5xl">{outfit.occasion}</h2>

      {/* Flat-lay grid: one tile per slot */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {outfit.items.map(({ slot, item }) => (
          <div key={slot} className="group">
            <div className="aspect-[3/4]">
              <GarmentImage src={item.imageUrl} alt={item.name} />
            </div>
            <p className="label mt-2">{slot}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <p className="label">Why it works</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed">{outfit.why}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-6">
        <Link
          href={`/fitting-room?outfit=${outfit.id}`}
          className="label bg-accent px-6 py-3 text-paper hover:opacity-90"
        >
          Try On
        </Link>
        <button onClick={onSave} className="label border-b border-ink pb-1 text-ink">
          {saved ? "Saved" : "Save"}
        </button>
        <button onClick={onAnother} className="label underline underline-offset-4 hover:text-ink">
          Another Look
        </button>
      </div>
    </div>
  );
}
