import GarmentArt from "./GarmentArt";
import type { ClothingItem } from "@/lib/types";

// An item's picture: the user's own photo if there is one, otherwise its drawing.
// The parent controls the size. Plain <img> so uploaded blob previews work too.
type Props = {
  item: Pick<ClothingItem, "name" | "kind" | "color" | "pattern" | "photoUrl">;
};

export default function GarmentImage({ item }: Props) {
  return (
    <div className="h-full w-full overflow-hidden bg-canvas">
      {item.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.photoUrl}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <GarmentArt kind={item.kind} color={item.color} pattern={item.pattern} label={item.name} />
      )}
    </div>
  );
}
