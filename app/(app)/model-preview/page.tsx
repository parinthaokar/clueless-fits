import type { Metadata } from "next";
import Model, { SKIN_TONES, type ModelOutfit, type ModelStyle } from "@/components/Model";
import { Card } from "@/components/ui";
import { referenceLooks, wardrobeItems } from "@/lib/mockData";

// Dev check page for components/Model.tsx: both styles × all five skin tones,
// plus the other garment shapes. Not linked from the navbar.
export const metadata: Metadata = { title: "Model preview" };

const item = (id: string) => wardrobeItems.find((i) => i.id === id)!;

// The two default looks from design/model_v5/model_reference.html
const looks: Record<ModelStyle, { title: string; outfit: ModelOutfit }> = referenceLooks;

// Every other shape, so each one can be checked on both bodies.
const extras: { title: string; outfit: ModelOutfit }[] = [
  {
    title: "Tee, pleated mini, knee-high boots, sunglasses",
    outfit: { Top: item("i3"), Bottom: item("i2"), Shoes: item("i7"), Accessory: item("i13") },
  },
  {
    title: "Slip dress, pumps, shoulder bag",
    outfit: { Top: item("i4"), Shoes: item("i11"), Accessory: item("i8") },
  },
  {
    title: "Swapped: leather jacket, button-up, wide-leg, loafers",
    outfit: {
      Outerwear: referenceLooks.masculine.outfit.Outerwear,
      Top: referenceLooks.feminine.outfit.Top,
      Bottom: referenceLooks.masculine.outfit.Bottom,
      Shoes: referenceLooks.masculine.outfit.Shoes,
      Belt: referenceLooks.feminine.outfit.Belt,
    },
  },
  {
    title: "Plaid blazer, tee, jeans, sneakers",
    outfit: { Outerwear: item("i1"), Top: item("i3"), Bottom: item("i5"), Shoes: item("i6") },
  },
  {
    title: "Shell, plaid trousers, boots",
    outfit: { Top: item("i9"), Bottom: item("i10"), Shoes: item("i7") },
  },
  { title: "Empty outfit (base layer)", outfit: {} },
];

const styles: ModelStyle[] = ["feminine", "masculine"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center rounded-[18px] border-[1.5px] border-track bg-cream px-2 pt-2">{children}</div>
  );
}

export default function ModelPreviewPage() {
  return (
    <div>
      <h1 className="text-[28px] font-black tracking-[-0.01em]">Model preview</h1>
      <p className="mt-1 mb-[18px] text-muted">
        Both model styles in all five skin tones, then every other garment shape. Checks{" "}
        <code className="text-sm">components/Model.tsx</code> against <code className="text-sm">design/model_v5/model_reference.html</code>.
      </p>

      <div className="space-y-[26px]">
        {styles.map((style) => (
          <Card as="section" key={style} className="px-[22px] py-[18px]">
            <h2 className="text-xl font-black">{cap(style)}</h2>
            <p className="mt-0.5 mb-3 text-[13.5px] text-muted">{looks[style].title}</p>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {SKIN_TONES.map((tone) => (
                <li key={tone} className="text-center">
                  <Stage>
                    <Model style={style} skinTone={tone} outfit={looks[style].outfit} className="block h-auto w-full max-w-[200px]" />
                  </Stage>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold">
                    <span
                      aria-hidden
                      className="inline-block size-3 rounded-full border-[1.5px] border-ink"
                      style={{ background: tone }}
                    />
                    {tone}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ))}

        <Card as="section" className="px-[22px] py-[18px]">
          <h2 className="text-xl font-black">Other shapes</h2>
          <p className="mt-0.5 mb-3 text-[13.5px] text-muted">Each look on both bodies, middle skin tone.</p>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {extras.map(({ title, outfit }) => (
              <li key={title}>
                <p className="mb-2 text-sm font-bold">{title}</p>
                <div className="grid grid-cols-2 gap-2">
                  {styles.map((style) => (
                    <Stage key={style}>
                      <Model style={style} skinTone={SKIN_TONES[2]} outfit={outfit} className="block h-auto w-full max-w-[180px]" />
                    </Stage>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
