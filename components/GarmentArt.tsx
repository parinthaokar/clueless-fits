import { useId } from "react";
import { garmentColors, type ColorName } from "@/lib/colors";
import type { GarmentKind, Pattern } from "@/lib/types";

// Flat garment drawing on a 120×120 canvas, shapes copied from design/html.
// The body is filled with the item's tagged color; plaid or stripes are clipped inside it.
const INK = "#1d1a16";
const CANVAS = "#fbf7ee";

type Shape = {
  body: string; // filled, clipped for patterns, outlined
  before?: React.ReactNode; // drawn behind the body (bag handle, glasses bar)
  details?: React.ReactNode; // ink details drawn on top
};

const line = (d: string, width = 2, opacity?: number) => (
  <path d={d} stroke={INK} strokeWidth={width} strokeOpacity={opacity} fill="none" />
);

const JACKET = "M28 24 L48 14 L60 30 L72 14 L92 24 L104 96 H84 L82 52 L80 98 H40 L38 52 L36 96 H16 Z";
const PANTS = "M36 14 H84 L90 100 H66 L60 46 L54 100 H30 Z";

const shapes: Record<GarmentKind, Shape> = {
  blazer: { body: JACKET, details: line("M60 30 V98") },
  jacket: { body: JACKET, details: line("M60 30 V98") },
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
  jeans: { body: PANTS, details: line("M36 24 H84") },
  // Platform sneaker: sole drawn behind; the upper (body) takes the item's color.
  sneakers: {
    before: (
      <>
        <path
          d="M10 80 Q10 76 15 76 H105 Q110 76 110 81 V95 Q110 101 104 101 H16 Q10 101 10 95 Z"
          fill="#f4eee2"
          stroke={INK}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <path d="M12 90 H108" stroke={INK} strokeOpacity={0.35} strokeWidth={1.6} />
        <path
          d="M16 96 h6 m4 0 h6 m4 0 h6 m4 0 h6 m4 0 h6 m4 0 h6 m4 0 h6 m4 0 h6 m4 0 h6"
          stroke={INK}
          strokeOpacity={0.3}
          strokeWidth={1.4}
        />
      </>
    ),
    body: "M13 77 Q13 64 30 61 L50 57 Q58 47 70 41 L88 34 Q98 30 104 36 Q109 44 107 77 Z",
    details: (
      <>
        <path d="M13 74 Q15 63 31 61 Q28 69 33 77" fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <path d="M80 38 Q92 31 103 36" fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
        <path
          d="M98 40 Q106 42 106.5 52 L106 77 H99 Q100 56 98 40 Z"
          fill="#c2185b"
          stroke={INK}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path d="M50 57 Q70 58 98 46" fill="none" stroke={INK} strokeOpacity={0.35} strokeWidth={1.6} />
        <path
          d="M52 55 L60 61 M58 50 L66 56 M64 46 L72 52 M70 42 L78 48"
          stroke={INK}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        {[
          [52, 55],
          [58, 50],
          [64, 46],
          [70, 42],
        ].map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r={1.6} fill={INK} />
        ))}
      </>
    ),
  },
  boots: { body: "M36 16 H64 V64 Q86 64 98 76 V88 H30 V16 Z", details: line("M30 88 H98", 5) },
  // Pump: heel drawn behind; the shoe (body) takes the item's color.
  pumps: {
    before: (
      <>
        <path d="M98 62 L104.5 61 L101 103 L98.5 103 Z" fill={INK} />
        <path d="M97.5 103 H102" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      </>
    ),
    body: "M8 88 Q10 79 26 76 Q40 74 50 69 Q74 58 99 47 Q105 45 106 51 L104 62 Q84 66 64 82 Q50 93 30 93 L16 93 Q6 93 8 88 Z",
    details: (
      <>
        <path d="M51 70.5 Q75 60 101 50.5" fill="none" stroke="#f7c9d8" strokeWidth={3} strokeLinecap="round" />
        <path d="M10 90 Q20 92 32 92" fill="none" stroke={INK} strokeOpacity={0.35} strokeWidth={1.5} />
      </>
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
      <path d={shape.body} fill={fill} />
      {pattern !== "solid" && (
        <>
          <defs>
            <clipPath id={clipId}>
              <path d={shape.body} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>{pattern === "plaid" ? <PlaidLines /> : <StripeLines />}</g>
        </>
      )}
      <path d={shape.body} fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      {shape.details}
    </svg>
  );
}
