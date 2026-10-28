import { Pencil, Trash2 } from "lucide-react";
import type { ClothingItem } from "@/lib/types";
import ItemImage from "./ItemImage";

interface Props {
  item: ClothingItem;
  onDelete: (id: string) => void;
}

export default function ClothingCard({ item, onDelete }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border-2 border-pink/50 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square">
        <ItemImage src={item.imageUrl} alt={item.name} />
        {/* Shown on hover (desktop), keyboard focus, or tap (phone) */}
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
          <button
            aria-label={`Edit ${item.name}`}
            className="rounded-full bg-white/90 p-2 shadow hover:bg-lilac"
          >
            <Pencil size={16} />
          </button>
          <button
            aria-label={`Delete ${item.name}`}
            onClick={() => onDelete(item.id)}
            className="rounded-full bg-white/90 p-2 text-pink-deep shadow hover:bg-blush"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-3">
        <p className="truncate font-medium">{item.name}</p>
        <span className="mt-1 inline-block rounded-full bg-lilac px-2 py-0.5 text-xs">
          {item.category}
        </span>
      </div>
    </div>
  );
}
