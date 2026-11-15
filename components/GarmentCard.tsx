import { X } from "lucide-react";
import { Card, Swatch, Tag } from "@/components/ui";
import type { ClothingItem } from "@/lib/types";
import GarmentImage from "./GarmentImage";

interface Props {
  item: ClothingItem;
  onRemove: (id: string) => void;
}

export default function GarmentCard({ item, onRemove }: Props) {
  return (
    <Card as="li" size="md" className="group relative p-3">
      <div className="aspect-square overflow-hidden rounded-[14px] border-[1.5px] border-track">
        <GarmentImage item={item} />
      </div>

      {/* Quiet action: shows on hover or keyboard focus */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.name}`}
        className="absolute top-5 right-5 grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-raspberry"
      >
        <X size={16} aria-hidden="true" />
      </button>

      <h3 className="mx-0.5 mt-2.5 mb-1.5 text-[15px] font-extrabold">{item.name}</h3>
      <div className="mx-0.5 flex flex-wrap items-center gap-1.5">
        <Tag>{item.category}</Tag>
        <span className="inline-flex items-center gap-[5px] text-[12.5px] text-muted">
          <Swatch color={item.color} />
          {item.color}
        </span>
      </div>
    </Card>
  );
}
