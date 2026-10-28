import Link from "next/link";
import type { SavedOutfit } from "@/lib/types";
import ItemImage from "./ItemImage";
import StarRating from "./StarRating";

export default function SavedOutfitCard({ outfit }: { outfit: SavedOutfit }) {
  const date = new Date(outfit.savedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <Link
      href={`/try-on?outfit=${outfit.id}`}
      className="block overflow-hidden rounded-2xl border-2 border-pink/50 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* 2x2 collage of the outfit's items */}
      <div className="grid grid-cols-2 gap-0.5 bg-lilac">
        {outfit.items.map(({ slot, item }) => (
          <div key={slot} className="aspect-square">
            <ItemImage src={item.imageUrl} alt={item.name} />
          </div>
        ))}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-lilac px-2 py-0.5 text-xs">{outfit.occasion}</span>
          <span className="text-xs text-ink/60">{date}</span>
        </div>
        <div className="mt-2">
          <StarRating value={outfit.rating} size={16} />
        </div>
      </div>
    </Link>
  );
}
