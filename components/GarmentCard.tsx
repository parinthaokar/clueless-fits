import type { ClothingItem } from "@/lib/types";
import GarmentImage from "./GarmentImage";

interface Props {
  item: ClothingItem;
  onRemove: (id: string) => void;
}

export default function GarmentCard({ item, onRemove }: Props) {
  return (
    <div className="group">
      <div className="relative aspect-[3/4]">
        <GarmentImage src={item.imageUrl} alt={item.name} />
        {/* Quiet actions: visible on hover, keyboard focus, or tap */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between bg-paper/90 px-3 py-2 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100">
          <button className="label hover:text-ink">Edit</button>
          <button onClick={() => onRemove(item.id)} className="label hover:text-ink">
            Remove
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm">{item.name}</p>
      <p className="label mt-1">{item.category}</p>
    </div>
  );
}
