// Feminine v6 hair: a layered blowout with a side part at x = 95, copied verbatim from
// design/model_v6/model_reference.html. Colours come from HAIR_COLORS in components/Model.tsx;
// only the geometry lives here.

/** Back mass: full crown, collarbone length, ends flip outward. Drawn first. */
export const FEM_HAIR_BACK =
  "M74.5 44 Q73 17.5 95 17.5 Q127 17.5 125.5 44 C129 62 133 76 137 88 Q141 97 146 100 Q140 110 130 104 L100 99 L70 104 Q60 110 54 100 Q59 97 63 88 C67 76 71 62 74 46 Z";

/** Front curtain layers: sweep off the forehead, fall along the cheeks, open away from the face and flip out. Drawn last. */
export const FEM_HAIR_FRONT = [
  "M95 18.5 Q76 17.5 74 42 C72 58 68.5 73 64.5 85 Q61 94 55.5 98.5 Q53.5 107.5 62.5 107 Q69.5 106 72.5 99 Q75.5 106.5 80.5 106.5 Q85.5 105 84.5 98 Q79.5 90 79.5 81 Q80 69 84.5 61 Q83 52 84 44 Q87 31 98 26.5 Z",
  "M95 18.5 Q124 17.5 126 42 C128 58 131.5 73 135.5 85 Q139 94 144.5 98.5 Q146.5 107.5 137.5 107 Q130.5 106 127.5 99 Q124.5 106.5 119.5 106.5 Q114.5 105 115.5 98 Q120.5 90 120.5 81 Q120 69 115.5 61 Q117 50 116 44 Q112 30 98 26.5 Z",
];

/** Strand lines: `tone` says which hair colour draws them (strand highlight or the ends colour). */
export const FEM_HAIR_STRANDS: { d: string; tone: "strand" | "ends"; opacity: number }[] = [
  { d: "M91 21 Q79 24 77.5 42 C76 58 73 72 69.5 84 Q66 94 60 102", tone: "strand", opacity: 0.9 },
  { d: "M89 26 Q83.5 34 81.5 46 Q80 58 76.5 72 Q74.5 86 77.5 98 Q79 102 81.5 103", tone: "strand", opacity: 0.75 },
  { d: "M100 21 Q121 24 122.5 42 C124 58 127 72 130.5 84 Q134 94 140 102", tone: "strand", opacity: 0.9 },
  { d: "M104 26 Q115 32 118.5 46 Q120 58 123.5 72 Q125.5 86 122.5 98 Q121 102 118.5 103", tone: "strand", opacity: 0.75 },
  { d: "M86 30 Q80 40 78 56", tone: "ends", opacity: 0.5 },
  { d: "M113 29 Q120 40 122 56", tone: "ends", opacity: 0.5 },
];

/** Face-framing swoops at cheekbone level, curling away from the face (ink). */
export const FEM_HAIR_SWOOPS = ["M84 61 Q78 70 78 80", "M116 61 Q122 70 122 80"];

/** The side part. */
export const FEM_HAIR_PART = "M95 18.5 Q96 22.5 98 26.5";

/** Balayage gradient (Brown only): userSpaceOnUse, y 18 → 108, root to 34%, ends from 78%. */
export const BALAYAGE = { y1: 18, y2: 108, rootUntil: 0.34, endsFrom: 0.78 };
