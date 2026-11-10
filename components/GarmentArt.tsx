import { useId } from "react";
import { buckleColor, garmentColors, type ColorName } from "@/lib/colors";
import type { GarmentKind, Pattern } from "@/lib/types";

// Flat garment drawing on a 120×120 canvas, shapes copied from design/html.
// The body is filled with the item's tagged color; plaid or stripes are clipped inside it.
const INK = "#1d1a16";
const CANVAS = "#fbf7ee";

type Shape = {
  custom?: (fill: string) => React.ReactNode; // complete drawing; replaces body (no pattern)
  body: string; // filled, clipped for patterns, outlined
  before?: React.ReactNode; // drawn behind the body (bag handle, glasses bar)
  details?: React.ReactNode; // ink details drawn on top
  overlay?: (fill: string) => React.ReactNode; // details that depend on the item colour
};

const line = (d: string, width = 2, opacity?: number) => (
  <path d={d} stroke={INK} strokeWidth={width} strokeOpacity={opacity} fill="none" />
);

const JACKET = "M28 24 L48 14 L60 30 L72 14 L92 24 L104 96 H84 L82 52 L80 98 H40 L38 52 L36 96 H16 Z";
const PANTS = "M36 14 H84 L90 100 H66 L60 46 L54 100 H30 Z";

const shapes: Record<GarmentKind, Shape> = {
  blazer: { body: JACKET, details: line("M60 30 V98") },
  jacket: { body: JACKET, details: line("M60 30 V98") },
  leather: {
    body: JACKET,
    details: (
      <>
        {line("M60 30 V98", 1.5)}
        {line("M48 14 L40 34 L54 40 M72 14 L80 34 L66 40", 2)}
      </>
    ),
  },
  shirt: {
    body: "M30 22 L48 14 L60 24 L72 14 L90 22 L104 88 L92 92 L84 50 L84 104 H36 L36 50 L28 92 L16 88 Z",
    details: (
      <>
        {line("M48 14 L52 30 L60 24 L68 30 L72 14")}
        {line("M60 26 V104", 1.5, 0.5)}
        {[44, 62, 80].map((y) => (
          <circle key={y} cx={60} cy={y} r={1.8} fill={INK} fillOpacity={0.6} />
        ))}
      </>
    ),
  },
  tee: { body: "M30 22 L48 14 Q60 22 72 14 L90 22 L102 42 L86 50 L84 98 L36 98 L34 50 L18 42 Z" },
  shell: { body: "M40 18 L46 18 Q60 30 74 18 L80 18 L84 100 H36 Z" },
  skirt: {
    body: "M40 22 H80 L98 92 H22 Z",
    details: (
      <>
        {line("M40 30 H80")}
        {[34, 47, 60, 73, 86].map((x) => (
          <path key={x} d={`M${x} 40 V90`} stroke={INK} strokeOpacity={0.35} strokeWidth={2} />
        ))}
      </>
    ),
  },
  dress: { body: "M46 12 L52 12 Q60 22 68 12 L74 12 L78 40 L96 98 H24 L42 40 Z", details: line("M42 42 H78") },
  trousers: { body: PANTS, details: line("M36 24 H84") },
  wideleg: {
    body: "M38 14 H82 L98 104 H64 L60 44 L56 104 H22 Z",
    details: (
      <>
        {line("M38 24 H82")}
        {line("M48 30 L40 102 M72 30 L80 102", 1.5, 0.35)}
      </>
    ),
  },
  jeans: { body: PANTS, details: line("M36 24 H84") },
  sneakers: { body: "", custom: (fill) => <SneakersArt color={fill} /> },
  boots: { body: "M36 16 H64 V64 Q86 64 98 76 V88 H30 V16 Z", details: line("M30 88 H98", 5) },
  pumps: { body: "", custom: (fill) => <PumpsArt color={fill} /> },
  // Penny loafer, side view, toe right: low heel, opening at the back, saddle strap over the vamp.
  loafers: {
    before: <path d="M12 90 H36 V99 Q36 101 34 101 H14 Q12 101 12 99 Z" fill={INK} />,
    body: "M10 88 Q8 70 16 64 Q22 60 30 64 Q42 70 58 64 Q74 56 92 64 Q108 71 111 84 Q112 92 104 92 H14 Q10 92 10 88 Z",
    details: (
      <>
        <path d="M16 64 Q22 60 30 64 Q42 70 58 64" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
        <path d="M54 66 Q60 80 78 76 Q90 73 92 64" fill="none" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M62 72 Q72 74 82 70" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M10 88 H111" stroke={INK} strokeWidth={2.2} />
        <path d="M70 60 Q88 60 100 68" fill="none" stroke="#ffffff" strokeOpacity={0.4} strokeWidth={2.4} strokeLinecap="round" />
      </>
    ),
  },
  tophandle: {
    before: line("M44 46 Q44 24 60 24 Q76 24 76 46", 4),
    body: "M28 46 H92 L98 100 Q98 104 94 104 H26 Q22 104 22 100 Z",
    details: (
      <>
        {line("M25 64 H95")}
        <rect x="56" y="60" width="8" height="8" rx="1.5" fill="#c9a35c" stroke={INK} strokeWidth={1.5} />
      </>
    ),
  },
  belt: {
    body: "M8 52 H112 V68 H8 Z",
    details: [78, 88, 98].map((x) => <circle key={x} cx={x} cy={60} r={1.6} fill={INK} />),
    overlay: (fill) => (
      <rect x="44" y="47" width="20" height="26" rx="3" fill="none" stroke={buckleColor(fill)} strokeWidth={3.5} />
    ),
  },
  bag: {
    before: line("M42 40 Q42 20 60 20 Q78 20 78 40", 3),
    body: "M34 40 H86 A10 10 0 0 1 96 50 V86 A10 10 0 0 1 86 96 H34 A10 10 0 0 1 24 86 V50 A10 10 0 0 1 34 40 Z",
    details: line("M24 58 H96"),
  },
  sunglasses: {
    before: line("M14 50 H106", 3),
    body:
      "M30 46 H42 A12 12 0 0 1 54 58 V60 A12 12 0 0 1 42 72 H30 A12 12 0 0 1 18 60 V58 A12 12 0 0 1 30 46 Z " +
      "M78 46 H90 A12 12 0 0 1 102 58 V60 A12 12 0 0 1 90 72 H78 A12 12 0 0 1 66 60 V58 A12 12 0 0 1 78 46 Z",
  },
};

// Shoes from design/model_v5/shoes.tsx
// One pump, drawn in a 319 x 282 space: toe bottom-left, heel cup top-right.
function OnePump({ color }: { color: string }) {
  return (
    <>
      <path d="M263 168 L284 166 L281 262 L275 262 Z" fill={color} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M273 263 H283" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path
        d="M80 266 Q96 248 122 238 Q140 230 155 215 Q205 122 250 38 Q256 30 268 32 Q284 38 292 56 Q302 80 299 104 Q296 140 284 166 Q264 170 256 176 Q248 196 245 225 Q243 252 230 270 Q218 282 196 282 L118 282 Q92 281 80 266 Z"
        fill={color} stroke={INK} strokeWidth={3.6} strokeLinejoin="round"
      />
      {/* tan insole seen through the opening */}
      <path
        d="M156 214 Q205 122 250 38 Q257 33 264 40 Q260 72 250 100 Q232 150 218 196 Q206 216 184 229 Q166 228 156 214 Z"
        fill="#e8b98f" stroke={INK} strokeWidth={2.6} strokeLinejoin="round"
      />
      <path d="M160 216 Q172 200 188 188 Q192 212 184 228 Q168 226 160 216 Z" fill="#cf9466" />
      {/* near-side rim of the opening */}
      <path d="M184 229 Q206 216 218 196 Q232 150 250 100 Q260 72 264 40" fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
      {/* shine */}
      <path d="M98 258 Q122 244 146 234" fill="none" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" />
      <path d="M291 70 Q296 98 289 132" fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={3.4} strokeLinecap="round" />
    </>
  );
}

// A pair, matching the reference photo's proportions; scaled into the 120 x 120 viewBox.
function PumpsArt({ color }: { color: string }) {
  return (
    <g transform="translate(0 7) scale(0.376)">
      <g transform="translate(3 215) rotate(6.5) scale(0.952) translate(-80 -266)">
        <OnePump color={color} />
      </g>
      <OnePump color={color} />
    </g>
  );
}

function SneakersArt({ color }: { color: string }) {
  const RASP = "#c2185b";
  const MUSTARD = "#f6c544";
  return (
    <>
      {/* midsole: thicker at the heel, toe spring at the front */}
      <path d="M7 73 L98 83 Q110 84 116 78 Q118 92 104 96 L14 96 Q4 95 7 83 Z" fill="#ffffff" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M11 96.5 L104 96.5 Q114 94 116.5 86" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <circle cx={15} cy={86} r={1.9} fill={INK} />
      <circle cx={21.5} cy={87} r={1.9} fill={INK} />
      <circle cx={28} cy={88} r={1.9} fill={INK} />
      {/* upper */}
      <path
        d="M7 73 Q3 54 11 42 Q14 33 21 32 Q27 33 31 43 Q40 52 50 46 L55 30 Q61 23 69 28 L65 38 Q82 52 97 61 Q112 68 116 78 Q110 84 98 83 Z"
        fill={color} stroke={INK} strokeWidth={2.5} strokeLinejoin="round"
      />
      {/* layered side panels */}
      <path d="M40 52 Q62 46 84 57 L80 82 Q60 77 42 74 Z" fill={INK} fillOpacity={0.1} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M18 62 Q44 58 72 74 L73 82 L56 80 Q40 70 20 70 Z" fill={RASP} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M7 73 Q3 54 11 42 Q22 52 26 75 Z" fill={MUSTARD} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      {/* toe cap wrapping into a bumper */}
      <path d="M94 64 Q110 69 116 78 Q110 84 98 83 L64 80 Q80 79 88 74 Q90 69 94 64 Z" fill={RASP} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      {/* lace strip and laces */}
      <path d="M50 46 L57 36 Q76 50 95 60 L91 66 Q70 57 50 46 Z" fill="#ffffff" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M58 39 L54 46 M65 43 L61 50 M72 47 L68 54 M79 51 L75 58 M86 55 L82 62" stroke={MUSTARD} strokeWidth={2.6} strokeLinecap="round" />
      {/* padded collar and tongue outline */}
      <path d="M21 32.5 Q27 33 31 43 Q40 52 50 46" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M55 30 Q61 23 69 28 L65 38" fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </>
  );
}

function PlaidLines() {
  return (
    <>
      {[18, 32, 46, 60, 74, 88, 102].map((x) => (
        <path key={`v${x}`} d={`M${x} 4 V116`} stroke={INK} strokeOpacity={0.28} strokeWidth={3} />
      ))}
      {[16, 30, 44, 58, 72, 86, 100].map((y) => (
        <path key={`h${y}`} d={`M4 ${y} H116`} stroke={INK} strokeOpacity={0.28} strokeWidth={3} />
      ))}
      {[25, 53, 81, 109].map((x) => (
        <path key={`p${x}`} d={`M${x} 4 V116`} stroke="#c2185b" strokeOpacity={0.45} strokeWidth={1.5} />
      ))}
    </>
  );
}

function StripeLines() {
  return (
    <>
      {[18, 30, 42, 54, 66, 78, 90, 102].map((y) => (
        <path key={y} d={`M4 ${y} H116`} stroke={INK} strokeOpacity={0.3} strokeWidth={4} />
      ))}
    </>
  );
}

interface Props {
  kind: GarmentKind;
  color: ColorName;
  pattern?: Pattern;
  label: string; // accessible name, e.g. the item name
  background?: string | null; // canvas fill; null for transparent
  className?: string;
}

export default function GarmentArt({ kind, color, pattern = "solid", label, background = CANVAS, className }: Props) {
  const clipId = `garment-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const shape = shapes[kind];
  const fill = garmentColors[color] ?? "#ffffff";

  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={label} className={className ?? "block h-full w-full"}>
      {background && <rect width="120" height="120" fill={background} />}
      {shape.before}
      {shape.custom?.(fill)}
      {!shape.custom && <path d={shape.body} fill={fill} />}
      {!shape.custom && pattern !== "solid" && (
        <>
          <defs>
            <clipPath id={clipId}>
              <path d={shape.body} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>{pattern === "plaid" ? <PlaidLines /> : <StripeLines />}</g>
        </>
      )}
      {!shape.custom && <path d={shape.body} fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />}
      {shape.details}
      {shape.overlay?.(fill)}
    </svg>
  );
}
