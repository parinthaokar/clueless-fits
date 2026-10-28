import Link from "next/link";
import type { SavedOutfit } from "@/lib/types";
import GarmentImage from "./GarmentImage";
import RatingDots from "./RatingDots";

export default function LookCard({ outfit }: { outfit: SavedOutfit }) {
  const date = new Date(outfit.savedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <Link href={`/fitting-room?outfit=${outfit.id}`} className="group block">
      {/* 2x2 collage of the pieces */}
      <div className="grid grid-cols-2 gap-px bg-line">
        {outfit.items.map(({ slot, item }) => (
          <div key={slot} className="aspect-[3/4]">
            <GarmentImage src={item.imageUrl} alt={item.name} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <p className="label text-ink">{outfit.occasion}</p>
        <p className="label">{date}</p>
      </div>
      <div className="mt-3">
        <RatingDots value={outfit.rating} />
      </div>
    </Link>
  );
}
