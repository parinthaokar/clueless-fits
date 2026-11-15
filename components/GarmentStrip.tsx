import { Card } from "@/components/ui";
import GarmentArt from "@/components/GarmentArt";
import type { ColorName } from "@/lib/colors";
import type { GarmentKind, Pattern } from "@/lib/types";

// The row of seven illustrated pieces on the landing page.
const garments: { label: string; kind: GarmentKind; color: ColorName; pattern?: Pattern }[] = [
  { label: "Yellow plaid blazer", kind: "blazer", color: "mustard", pattern: "plaid" },
  { label: "Mustard pleated mini skirt", kind: "skirt", color: "mustard" },
  { label: "White tee", kind: "tee", color: "white" },
  { label: "Pink slip dress", kind: "dress", color: "pink" },
  { label: "Light-wash jeans", kind: "jeans", color: "denim" },
  { label: "White sneaker", kind: "sneakers", color: "white" },
  { label: "Black knee-high boot", kind: "boots", color: "black" },
];

export default function GarmentStrip() {
  return (
    <ul className="flex flex-wrap justify-center gap-4 lg:flex-nowrap lg:justify-between">
      {garments.map((g) => (
        <Card key={g.label} as="li" size="md" className="p-2">
          <GarmentArt {...g} background="#fff" className="block h-[104px] w-[104px]" />
        </Card>
      ))}
    </ul>
  );
}
