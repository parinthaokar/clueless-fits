import { useId } from "react";
import { buckleColor as buckle, garmentColors } from "@/lib/colors";
import type { ClothingItem, GarmentKind, Pattern, Slot } from "@/lib/types";
import {
  FEM_HAIR_BACK,
  FEM_HAIR_CAP,
  FEM_HAIR_FRONT,
  FEM_HAIR_PART,
  FEM_HAIR_STRANDS,
  FEM_HAIR_SWEEPS,
} from "./modelHair";

// The Fitting Room / Stylist model: a flat SVG drawing (never a photo), 200×330 canvas.
// Paths are copied from design/model_v5/model_reference.html (v5), falling back to
// design/html/model_styles.html and the fitting-room mockups for pieces v5 doesn't show.
// Layers, back to front (v5 tucks tops into bottoms, so the bottom is drawn before the top):
//   hair (back), arms + legs, shoes, bottom, top, belt, outerwear, shoulder bag, hands,
//   bag in hand, ears + head + neck, collars, face, sunglasses, hair (front)

export type ModelStyle = "feminine" | "masculine";

export const SKIN_TONES = ["#f3d4bf", "#e2b08c", "#c98e6b", "#9a6646", "#5e3b28"] as const;
export type SkinTone = (typeof SKIN_TONES)[number];

// Hair follows skin tone (design/model_v5/notes.md).
export const HAIR_COLORS: Record<SkinTone, { hair: string; strand: string }> = {
  "#f3d4bf": { hair: "#6b4430", strand: "#9a6a4c" },
  "#e2b08c": { hair: "#4a2c1d", strand: "#7a5038" },
  "#c98e6b": { hair: "#33231a", strand: "#5e4434" },
  "#9a6646": { hair: "#211611", strand: "#4a352a" },
  "#5e3b28": { hair: "#141010", strand: "#3a302c" },
};

// The Fitting Room lists Outerwear as its own slot; v5 adds a belt and a bag alongside an accessory.
export type ModelSlot = Slot | "Outerwear" | "Belt" | "Bag";
export type ModelOutfit = Partial<Record<ModelSlot, ClothingItem>>;

const INK = "#1d1a16";
const BROW = "#3b2a20"; // brows stay this colour in every v5 skin tone
const BASE = "#f4eee2"; // plain tank / shorts drawn when a slot is empty
const GOLD = "#c9a35c";

// ---------------------------------------------------------------------------------------------
// Colour helpers: crease lines, collar edges etc. are a lighter/darker shade of the item colour.

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (hex: string, toward: number, t: number) =>
  "#" + rgb(hex).map((c) => Math.round(c + (toward - c) * t).toString(16).padStart(2, "0")).join("");
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};
/** Lighter shade on dark fabric, darker shade on light fabric. */
const accentOf = (hex: string) => (luminance(hex) < 0.5 ? mix(hex, 255, 0.24) : mix(hex, 0, 0.18));

// ---------------------------------------------------------------------------------------------
// Garment shapes

type Ctx = { fill: string; accent: string; skin: string };
type Draw = React.ReactNode | ((c: Ctx) => React.ReactNode);
const render = (d: Draw, c: Ctx) => (typeof d === "function" ? d(c) : d);

type Piece = {
  under?: Draw; // drawn behind the parts (bag handle, skin in an open collar)
  parts: string[]; // filled with the item colour, pattern clipped inside, then outlined
  skin?: string[]; // bare skin drawn on top of the parts (forearms below rolled sleeves)
  details?: Draw; // drawn on top
};

type Shape = Piece & {
  collar?: Piece; // drawn after the neck, so it sits over it
  scaleX?: number; // horizontal scale around x=100, to fit a shape drawn for the other body
  shift?: [number, number]; // move a shape drawn for the other body (e.g. a bag to the other hand)
};

const stroke = {
  stroke: INK,
  strokeWidth: 2,
  strokeLinejoin: "round",
  strokeLinecap: "round",
} as const;

const line = (d: string, width = 1.4, opacity?: number, color = INK) => (
  <path d={d} stroke={color} strokeWidth={width} strokeOpacity={opacity} strokeLinecap="round" fill="none" />
);

// Body measurements that differ between the two styles.
const body = {
  feminine: {
    legs: ["M84 160 L98 160 L97 300 L88 300 Z", "M102 160 L116 160 L112 300 L103 300 Z"],
    arms: [
      "M70 86 Q61 91 60.5 110 L59.5 186 L66 186 L69 122 Z",
      "M130 86 Q139 91 139.5 110 L140.5 186 L134 186 L131 122 Z",
    ],
    hands: [
      { cx: 62.5, cy: 192, rx: 4.8, ry: 7.2 },
      { cx: 137.5, cy: 191, rx: 4.8, ry: 7 },
    ],
    neck: { fill: "M94 70.8 Q100 72.8 106 70.8 L106 84 Q100 88 94 84 Z", sides: "M94 72.3 L94 84 M106 72.3 L106 84", shadow: "M95 76 Q100 79 105 76" },
  },
  masculine: {
    legs: ["M80 158 H99 L98 300 H85 Z", "M101 158 H120 L115 300 H102 Z"],
    arms: [
      "M68 86 Q58 91 57.5 110 L56.5 186 L64 186 L67 122 Z",
      "M132 86 Q142 91 142.5 110 L143.5 186 L136 186 L133 122 Z",
    ],
    hands: [
      { cx: 59, cy: 188, rx: 5.4, ry: 8 },
      { cx: 141, cy: 188, rx: 5.4, ry: 8 },
    ],
    neck: { fill: "M92 69.7 Q100 71.7 108 69.7 L108 84 Q100 88 92 84 Z", sides: "M92 71.2 L92 84 M108 71.2 L108 84", shadow: "M93 76 Q100 79 107 76" },
  },
};

// Shared pieces of geometry
const FEM_TORSO = "M73 84 Q100 92 127 84 L123 142 Q100 146 77 142 Z";
const MASC_TORSO = "M73 84 Q100 94 127 84 L123 150 H77 Z"; // v5: tucked in at the waist
const FEM_PANTS = "M78 138 Q100 142 122 138 L121 150 L117 300 H102.5 L100 168 L97.5 300 H83 L79 150 Z";
const MASC_PANTS = ["M79 148 H99.5 L98 302 H84 Z", "M100.5 148 H121 L116 302 H102 Z", "M79 148 H121 V158 H79 Z"];
const FEM_COAT = [
  "M70 84 L93 90 L90 112 Q92 140 95 174 L77 174 Q72 156 77 136 Q72 112 70 84 Z",
  "M130 84 L107 90 L110 112 Q108 140 105 174 L123 174 Q128 156 123 136 Q128 112 130 84 Z",
  "M70 84 Q60 89 59.5 108 L58.5 184 L66.5 184 L69.5 120 Z",
  "M130 84 Q140 89 140.5 108 L141.5 184 L133.5 184 L130.5 120 Z",
];
const MASC_COAT = [
  "M66 84 Q56 90 55.5 110 L54.5 186 L65 186 L68 120 Z",
  "M134 84 Q144 90 144.5 110 L145.5 186 L135 186 L132 120 Z",
  "M66 84 L93 91 L91 112 L94 168 L74 168 Q71 128 66 84 Z",
  "M134 84 L107 91 L109 112 L106 168 L126 168 Q129 128 134 84 Z",
];

const pleats = (xsTop: number[], xsBottom: number[], yTop: number, yBottom: number) =>
  xsTop.map((x, i) => (
    <path key={x} d={`M${x} ${yTop} L${xsBottom[i]} ${yBottom}`} stroke={INK} strokeOpacity={0.3} strokeWidth={1.6} />
  ));

const tuckFolds = (d: string) => line(d, 1.3, 0.28);

// Shoes -----------------------------------------------------------------------------------------

// Side-on pumps with a visible heel (model_styles.html), used under short hems.
const PUMPS: Shape = {
  parts: [
    "M85 296 H98 L98.5 304 Q97 311 90 311.5 L79 312 Q75.5 311.5 78 308 L85 303 Z",
    "M102 296 H115 V303 L122 308 Q124.5 311.5 121 312 L110 311.5 Q103 311 101.5 304 Z",
  ],
  details: (
    <>
      <path d="M97 304 L97.5 313" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M103 304 L102.5 313" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
    </>
  ),
};

// v5: pointed toes, front view, peeking under a long hem.
const POINTED_PUMPS: Shape = {
  parts: ["M77 300 H95 L92.5 309 Q88 315 84 309 Z", "M105 300 H123 L116 309 Q112 315 107.5 309 Z"],
};

const BOOTS: Shape = {
  parts: [
    "M85 238 L99 238 L98 300 Q99 310 95 312 L80 312 Q76 312 78 307 L86 298 Z",
    "M101 238 L115 238 L113 298 L121 307 Q123 312 119 312 L104 312 Q100 310 101 300 Z",
  ],
  details: line("M85.5 246 H98.8 M101.2 246 H114.7", 1.2, 0.35),
};

const SNEAKERS: Shape = {
  parts: [
    "M83 298 H99 V308 Q99 314 93 314 H75 Q70 314 73 308 Q78 304 83 302 Z",
    "M101 298 H117 V302 Q122 304 127 308 Q130 314 125 314 H107 Q101 314 101 308 Z",
  ],
  details: <path d="M73 311 H99 M101 311 H127" stroke={INK} strokeWidth={2.4} />,
};

// v5 loafers (masculine reference)
const LOAFERS: Shape = {
  parts: [
    "M77 299 H98 V308 Q98 314 92 314 H80.5 Q74 314 75 308 Z",
    "M102 299 H123 L125 308 Q126 314 119.5 314 H108 Q102 314 102 308 Z",
  ],
  details: ({ accent }) => (
    <>
      <path d="M79 305 H95 M105 305 H121" stroke={accent} strokeWidth={1.4} />
      <path
        d="M80 310 Q84 308 88 309 M110 310 Q114 308 118 309"
        stroke="#ffffff"
        strokeOpacity={0.35}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
};

// Bags ------------------------------------------------------------------------------------------

// Shoulder bag hanging at the viewer's left (model_styles.html)
const BAG: Shape = {
  under: <path d="M54 199 Q62.5 184 71 199" fill="none" stroke={INK} strokeWidth={2.2} />,
  parts: ["M54 198 H71 A5 5 0 0 1 76 203 V214 A5 5 0 0 1 71 219 H54 A5 5 0 0 1 49 214 V203 A5 5 0 0 1 54 198 Z"],
  details: (
    <>
      <path d="M49 206 H76" stroke={INK} strokeWidth={1.6} />
      <circle cx="62.5" cy="206" r="2" fill="#f6c544" stroke={INK} strokeWidth={1} />
    </>
  ),
};

// v5: structured top-handle bag held in the model's left hand (viewer's right)
const TOP_HANDLE: Shape = {
  under: <path d="M130 199 Q137.5 183 145 199" fill="none" stroke={INK} strokeWidth={2.2} />,
  parts: ["M124 199 H151 L153 223 Q153 226 150 226 H125 Q122 226 122 223 Z"],
  details: (
    <>
      <path d="M123 207 H152" stroke={INK} strokeWidth={1.4} strokeOpacity={0.6} />
      <rect x="135" y="204.5" width="5" height="4.5" rx="1" fill={GOLD} stroke={INK} strokeWidth={1} />
    </>
  ),
};

// v5 sunglasses, worn on the face (same face geometry on both bodies)
const SUNGLASSES: Shape = {
  parts: [
    "M82.5 45.5 H98.5 Q98.5 55 91 55 Q83 55 82.5 45.5 Z",
    "M101.5 45.5 H117.5 Q117 55 109 55 Q101.5 55 101.5 45.5 Z",
  ],
  details: (
    <>
      <path d="M98.5 47 H101.5 M82.5 46 L80 45 M117.5 46 L120 45" stroke={INK} strokeWidth={1.6} />
      <path d="M85 48 L88 51 M104 48 L107 51" stroke="#ffffff" strokeOpacity={0.45} strokeWidth={1.1} strokeLinecap="round" />
    </>
  ),
};

// v5 leather jacket (masculine reference; scaled in for the feminine shoulders)
const LEATHER: Shape = {
  parts: [
    "M66 84 Q53 90 52.5 112 L51.5 180 L66.5 180 L69 122 Z",
    "M134 84 Q147 90 147.5 112 L148.5 180 L133.5 180 L131 122 Z",
    "M66 84 L93 89 L92 160 L73 161 Q69 124 66 84 Z",
    "M134 84 L107 89 L108 160 L127 161 Q131 124 134 84 Z",
  ],
  details: ({ accent }) => (
    <>
      <path d="M73 156 H92 M108 156 H127" stroke={accent} strokeWidth={1.2} />
      <path d="M91 92 L90.5 158 M109 92 L109.5 158" stroke={accent} strokeWidth={1} strokeDasharray="2 1.6" />
      <path
        d="M52 168 Q59 165 66.5 168 M52 174 Q59 171 66.5 174 M133.5 168 Q141 165 148.5 168 M133.5 174 Q141 171 148.5 174"
        stroke={accent}
        strokeWidth={1.2}
        fill="none"
      />
      <path
        d="M57 98 Q55.5 122 56.5 152 M143 98 Q144.5 122 143.5 152 M72 100 Q73 120 76 146 M128 100 Q127 120 124 146"
        stroke="#ffffff"
        strokeOpacity={0.22}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M78 120 Q83 118 88 121 M112 121 Q117 118 122 120" stroke={accent} strokeWidth={1.1} fill="none" />
    </>
  ),
  collar: {
    parts: ["M93 86 L76 83.5 L73.5 99 L88 104 Z", "M107 86 L124 83.5 L126.5 99 L112 104 Z"],
    details: ({ accent }) => (
      <>
        <path d="M92 87.5 L87.5 102.5 M108 87.5 L112.5 102.5" stroke={accent} strokeWidth={1.6} strokeLinecap="round" />
        <path
          d="M77 87 L75.2 98.5 L87 102.5 M123 87 L124.8 98.5 L113 102.5"
          stroke={accent}
          strokeWidth={1.2}
          fill="none"
          strokeLinejoin="round"
        />
      </>
    ),
  },
};

const shirtDetails = (placketEnd: number, buttons: number[], folds: string, elbows: string) => (
  <>
    {line(`M100 100 V${placketEnd}`, 1.3, 0.5)}
    {buttons.map((y) => (
      <circle key={y} cx="100" cy={y} r="1.3" fill={INK} fillOpacity={0.55} />
    ))}
    {tuckFolds(folds)}
    {line(elbows, 1.3, 0.25)}
  </>
);

const shapes: Record<ModelStyle, Record<GarmentKind, Shape>> = {
  feminine: {
    shell: { parts: [FEM_TORSO] },
    tee: {
      parts: [
        "M73 85 Q61.5 89 60.6 106 L69.8 108.5 L72 96 Z",
        "M127 85 Q138.5 89 139.4 106 L130.2 108.5 L128 96 Z",
        FEM_TORSO,
      ],
    },
    // v5 button-up: tucked, open collar with a skin V, 3 buttons, sleeves rolled to the forearm
    shirt: {
      parts: [
        "M72 84 Q86 88 94 86 L100 100 L106 86 Q114 88 128 84 L124 140 Q100 144 76 140 Z",
        "M72 84 Q61 89 60 108 L58.8 147 L68.4 147 L70 118 Z",
        "M128 84 Q139 89 140 108 L141.2 147 L131.6 147 L130 118 Z",
        "M57.3 145 H69.5 L69.2 156 H57.7 Z",
        "M130.5 145 H142.7 L142.3 156 H130.8 Z",
      ],
      skin: ["M58.5 156 L59.5 186 L66 186 L68.5 156 Z", "M141.5 156 L140.5 186 L134 186 L131.5 156 Z"],
      details: shirtDetails(
        140,
        [110, 121, 132],
        "M80 130 Q84 136 82 140 M120 130 Q116 136 118 140 M90 132 Q92 137 91 141",
        "M62 100 Q63 120 63 140 M138 100 Q137 120 137 140",
      ),
      collar: {
        under: ({ skin }) => <path d="M94 84 L100 99 L106 84 Z" fill={skin} />,
        parts: ["M93.5 82 L85.5 97 L97.5 94 L100 99 Z", "M106.5 82 L114.5 97 L102.5 94 L100 99 Z"],
      },
    },
    dress: {
      parts: ["M73 84 Q100 92 127 84 L123 140 L133 216 Q100 222 67 216 L77 140 Z"],
      details: line("M77 140 Q100 144 123 140", 1.4, 0.5),
    },
    skirt: {
      parts: ["M78 138 Q100 142 122 138 L133 212 Q100 218 67 212 Z"],
      details: pleats([82, 91, 100, 109, 118], [75, 87.5, 100, 112.5, 125], 146, 211),
    },
    trousers: { parts: [FEM_PANTS], details: line("M100 172 V298", 1.2, 0.35) },
    // v5 high-waisted wide-leg trousers to the floor, creases in a shade of the item colour
    wideleg: {
      parts: ["M77 140 Q100 144 123 140 L129 304 H102 L100 170 L98 304 H71 Z"],
      details: ({ accent }) => (
        <>
          <path d="M88 150 L85 302 M112 150 L115 302" stroke={accent} strokeWidth={1.3} />
          <path d="M93 146 L92 160 M107 146 L108 160" stroke={accent} strokeWidth={1.1} />
        </>
      ),
    },
    jeans: {
      parts: [FEM_PANTS],
      details: (
        <>
          {line("M78.6 147 Q100 151 121.4 147", 1.4)}
          {line("M100 150 V166", 1.4, 0.6)}
          {line("M90 170 L90.5 298 M110 170 L109.5 298", 1.2, 0.3)}
        </>
      ),
    },
    belt: {
      parts: ["M76.5 138 Q100 142 123.5 138 L123.8 145 Q100 149 76.2 145 Z"],
      details: ({ fill }) => (
        <rect x="95.5" y="138.8" width="9" height="8" rx="1.5" fill="none" stroke={buckle(fill)} strokeWidth={1.6} />
      ),
    },
    blazer: {
      parts: FEM_COAT,
      details: (
        <>
          {line("M93 90 L86 110 L91 114")}
          {line("M107 90 L114 110 L109 114")}
          <circle cx="92.5" cy="150" r="1.8" fill={INK} />
        </>
      ),
    },
    jacket: {
      parts: FEM_COAT,
      details: (
        <>
          {line("M93 90 L84 99 L89 111 M107 90 L116 99 L111 111")}
          <rect x="76" y="108" width="11" height="8" rx="1.5" fill="none" stroke={INK} strokeWidth={1.4} />
          <rect x="113" y="108" width="11" height="8" rx="1.5" fill="none" stroke={INK} strokeWidth={1.4} />
          {line("M76.5 166 H94.6 M105.4 166 H123.5", 1.6)}
          {line("M58.6 178 H66.8 M133.2 178 H141.4", 1.6)}
        </>
      ),
    },
    leather: { ...LEATHER, scaleX: 0.88 },
    pumps: PUMPS,
    boots: BOOTS,
    sneakers: { ...SNEAKERS, scaleX: 0.9 },
    loafers: { ...LOAFERS, scaleX: 0.9 },
    bag: BAG,
    tophandle: TOP_HANDLE,
    sunglasses: SUNGLASSES,
  },
  masculine: {
    shell: { parts: [MASC_TORSO] },
    tee: {
      parts: [
        "M73 85 Q59 89 57.6 106 L67.6 109 L70.5 96 Z",
        "M127 85 Q141 89 142.4 106 L132.4 109 L129.5 96 Z",
        MASC_TORSO,
      ],
      details: tuckFolds("M85 140 Q88 146 86 150 M115 140 Q112 146 114 150"),
    },
    // Button-up on the masculine body: v5 feminine shirt widened to his shoulders and waist
    shirt: {
      parts: [
        "M73 84 Q86 88.5 93 86.5 L100 100 L107 86.5 Q114 88.5 127 84 L123 150 H77 Z",
        "M73 84 Q59 89 58 108 L56.8 147 L67.4 147 L69 118 Z",
        "M127 84 Q141 89 142 108 L143.2 147 L132.6 147 L131 118 Z",
        "M55.6 145 H68.6 L68.3 156 H56 Z",
        "M131.4 145 H144.4 L144 156 H131.7 Z",
      ],
      skin: ["M56.6 156 L56.8 184 L63.5 184 L67.6 156 Z", "M143.4 156 L143.2 184 L136.5 184 L132.4 156 Z"],
      details: shirtDetails(
        150,
        [111, 123, 135],
        "M85 140 Q88 146 86 150 M115 140 Q112 146 114 150",
        "M60 100 Q61 120 61 140 M140 100 Q139 120 139 140",
      ),
      collar: {
        under: ({ skin }) => <path d="M92 84 L100 99 L108 84 Z" fill={skin} />,
        parts: ["M91.5 82 L83.5 97 L97 94 L100 99 Z", "M108.5 82 L116.5 97 L103 94 L100 99 Z"],
      },
    },
    dress: {
      parts: ["M72 84 Q100 93 128 84 L123 156 L132 228 Q100 234 68 228 L77 156 Z"],
      details: line("M77 156 Q100 160 123 156", 1.4, 0.5),
    },
    skirt: {
      parts: ["M79 148 Q100 152 121 148 L132 222 Q100 228 68 222 Z"],
      details: pleats([83, 91.5, 100, 108.5, 117], [76, 88, 100, 112, 124], 156, 221),
    },
    trousers: { parts: MASC_PANTS, details: line("M91 162 L91 300 M109 162 L109 300", 1.2, 0.2) },
    wideleg: {
      parts: ["M78.5 148 Q100 151 121.5 148 L127.5 302 H101.5 L100 176 L98.5 302 H72.5 Z"],
      details: ({ accent }) => (
        <>
          <path d="M88.5 156 L85.5 300 M111.5 156 L114.5 300" stroke={accent} strokeWidth={1.4} />
          <path d="M93 152 L92 168 M107 152 L108 168 M84 153 L83.5 162 M116 153 L116.5 162" stroke={accent} strokeWidth={1.1} />
          <path d="M74 296 Q86 293 98 296 M102 296 Q114 293 126 296" stroke={accent} strokeWidth={1} fill="none" />
        </>
      ),
    },
    jeans: {
      parts: MASC_PANTS,
      details: (
        <>
          <path d="M100 158 V178" stroke={INK} strokeWidth={1.4} strokeLinecap="round" strokeOpacity={0.6} />
          {line("M91 162 L91 300 M109 162 L109 300", 1.2, 0.3)}
        </>
      ),
    },
    belt: {
      parts: ["M78 146 Q100 149.5 122 146 L122.2 153 Q100 156.5 77.8 153 Z"],
      details: ({ fill }) => (
        <rect x="95.5" y="146.6" width="9" height="7.6" rx="1.4" fill="none" stroke={buckle(fill)} strokeWidth={1.7} />
      ),
    },
    blazer: {
      parts: MASC_COAT,
      details: (
        <>
          {line("M93 91 L86 111 L91 115")}
          {line("M107 91 L114 111 L109 115")}
          <circle cx="92" cy="150" r="1.8" fill={INK} />
        </>
      ),
    },
    jacket: {
      parts: MASC_COAT,
      details: (
        <>
          {line("M74 160 H94 M106 160 H126", 1.6)}
          <rect x="77" y="108" width="12" height="9" rx="1.5" fill="none" stroke={INK} strokeWidth={1.4} />
          <rect x="111" y="108" width="12" height="9" rx="1.5" fill="none" stroke={INK} strokeWidth={1.4} />
          {line("M93 91 L82 100 L88 112 M107 91 L118 100 L112 112")}
          {line("M55 180 H65 M135 180 H145", 1.6)}
          <path
            d="M70 104 Q72 136 76 156 M130 104 Q128 136 124 156"
            stroke="#ffffff"
            strokeOpacity={0.55}
            strokeWidth={1}
            strokeDasharray="2 2"
            fill="none"
          />
        </>
      ),
    },
    leather: LEATHER,
    pumps: { ...PUMPS, scaleX: 1.08 },
    boots: { ...BOOTS, scaleX: 1.15 },
    sneakers: SNEAKERS,
    loafers: LOAFERS,
    bag: { ...BAG, shift: [-3.5, -3] },
    tophandle: { ...TOP_HANDLE, shift: [3.5, -3] },
    sunglasses: SUNGLASSES,
  },
};

// Which layer each kind of garment is drawn in.
type Layer = "shoes" | "bottom" | "top" | "belt" | "outerwear" | "purse" | "inHand" | "glasses";
const layerOf: Record<GarmentKind, Layer> = {
  tee: "top",
  shell: "top",
  shirt: "top",
  dress: "top",
  skirt: "bottom",
  trousers: "bottom",
  wideleg: "bottom",
  jeans: "bottom",
  belt: "belt",
  blazer: "outerwear",
  jacket: "outerwear",
  leather: "outerwear",
  pumps: "shoes",
  boots: "shoes",
  sneakers: "shoes",
  loafers: "shoes",
  bag: "purse",
  tophandle: "inHand",
  sunglasses: "glasses",
};

// Bottoms whose hem reaches the floor: pumps peek out as pointed toes.
const LONG_HEMS: GarmentKind[] = ["wideleg"];

// ---------------------------------------------------------------------------------------------
// Patterns: lines clipped inside the garment (plaid from model_styles.html)

function Plaid() {
  const xs = Array.from({ length: 12 }, (_, i) => 50 + i * 9);
  const ys = Array.from({ length: 31 }, (_, i) => 18 + i * 10);
  return (
    <>
      {xs.map((x) => (
        <path key={`v${x}`} d={`M${x} 10 V320`} stroke={INK} strokeOpacity={0.26} strokeWidth={2.4} />
      ))}
      {ys.map((y) => (
        <path key={`h${y}`} d={`M40 ${y} H160`} stroke={INK} strokeOpacity={0.26} strokeWidth={2.4} />
      ))}
      {[54, 76, 98, 120, 142].map((x) => (
        <path key={`p${x}`} d={`M${x} 10 V320`} stroke="#c2185b" strokeOpacity={0.5} strokeWidth={1.2} />
      ))}
    </>
  );
}

function Stripes() {
  const ys = Array.from({ length: 39 }, (_, i) => 14 + i * 8);
  return (
    <>
      {ys.map((y) => (
        <path key={y} d={`M40 ${y} H160`} stroke={INK} strokeOpacity={0.28} strokeWidth={3} />
      ))}
    </>
  );
}

const transformOf = (shape: Shape) => {
  const s = shape.scaleX ?? 1;
  const [dx, dy] = shape.shift ?? [0, 0];
  return s !== 1 || dx || dy ? `matrix(${s} 0 0 1 ${100 * (1 - s) + dx} ${dy})` : undefined;
};

function PieceView({ piece, ctx, pattern, clipId }: { piece: Piece; ctx: Ctx; pattern: Pattern; clipId: string }) {
  return (
    <>
      {render(piece.under, ctx)}
      {piece.parts.map((d) => (
        <path key={d} d={d} fill={ctx.fill} />
      ))}
      {pattern !== "solid" && (
        <>
          <defs>
            <clipPath id={clipId}>
              {piece.parts.map((d) => (
                <path key={d} d={d} />
              ))}
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>{pattern === "plaid" ? <Plaid /> : <Stripes />}</g>
        </>
      )}
      {piece.parts.map((d) => (
        <path key={d} d={d} fill="none" {...stroke} />
      ))}
      {piece.skin?.map((d) => (
        <path key={d} d={d} fill={ctx.skin} {...stroke} />
      ))}
      {render(piece.details, ctx)}
    </>
  );
}

type Worn = { shape: Shape; ctx: Ctx; pattern: Pattern; clipId: string };

function Garment({ worn }: { worn: Worn | null }) {
  if (!worn) return null;
  return (
    <g transform={transformOf(worn.shape)}>
      <PieceView piece={worn.shape} ctx={worn.ctx} pattern={worn.pattern} clipId={worn.clipId} />
    </g>
  );
}

function Collar({ worn }: { worn: Worn | null }) {
  const collar = worn?.shape.collar;
  if (!worn || !collar) return null;
  return (
    <g transform={transformOf(worn.shape)}>
      <PieceView piece={collar} ctx={worn.ctx} pattern={worn.pattern} clipId={`${worn.clipId}-collar`} />
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Head, face and hair (design/model_v5/model_reference.html)

function Head({ style, skin }: { style: ModelStyle; skin: string }) {
  const neck = body[style].neck;
  return (
    <>
      {style === "masculine" && (
        <>
          <ellipse cx="82" cy="51" rx="3" ry="5" fill={skin} {...stroke} />
          <ellipse cx="118" cy="51" rx="3" ry="5" fill={skin} {...stroke} />
        </>
      )}
      <path
        d="M82 48 Q82 28 100 28 Q118 28 118 48 Q118 64 109 70 Q104 73.5 100 73.5 Q96 73.5 91 70 Q82 64 82 48 Z"
        fill={skin}
        {...stroke}
      />
      {/* Neck after the head, so it joins the jaw with no chin line */}
      <path d={neck.fill} fill={skin} />
      <path d={neck.sides} {...stroke} />
      <path d={neck.shadow} stroke={INK} strokeOpacity={0.18} strokeWidth={1.2} fill="none" />
    </>
  );
}

function Face({ style }: { style: ModelStyle }) {
  const fem = style === "feminine";
  const browWidth = fem ? 1.8 : 2.6;
  const lashWidth = fem ? 1.8 : 1.1;
  return (
    <>
      <path d="M88 42.5 Q93 40 97.5 42" stroke={BROW} strokeWidth={browWidth} fill="none" strokeLinecap="round" />
      <path d="M102.5 42 Q107 40 112 42.5" stroke={BROW} strokeWidth={browWidth} fill="none" strokeLinecap="round" />
      {[93, 107].map((cx) => (
        <g key={cx}>
          <path
            d={`M${cx - 5} 49.5 Q${cx} 45.5 ${cx + 5} 49.5 Q${cx} 53.5 ${cx - 5} 49.5 Z`}
            fill="#fff"
            stroke={INK}
            strokeWidth={0.9}
          />
          <circle cx={cx} cy="49.6" r="2.6" fill="#3a2418" />
          <circle cx={cx + 0.8} cy="48.7" r="0.8" fill="#fff" />
          <path
            d={`M${cx - 5.5} 49 Q${cx} 44.5 ${cx + 5.5} 49`}
            stroke={INK}
            strokeWidth={lashWidth}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ))}
      <path
        d="M99.5 54 Q98.3 58.5 100.6 59"
        stroke={INK}
        strokeWidth={1.1}
        fill="none"
        strokeLinecap="round"
        strokeOpacity={0.7}
      />
      {fem ? (
        <>
          <path
            d="M95 63.2 Q97.5 61.6 100 62.6 Q102.5 61.6 105 63.2 Q100 67.2 95 63.2 Z"
            fill="#c4566a"
            stroke={INK}
            strokeWidth={0.9}
          />
          <circle cx="88.5" cy="57.5" r="3.6" fill="#c2185b" fillOpacity={0.16} />
          <circle cx="111.5" cy="57.5" r="3.6" fill="#c2185b" fillOpacity={0.16} />
        </>
      ) : (
        <>
          <path d="M95 63.5 Q100 66.5 105 63.5" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
          <path d="M96.5 63.4 Q100 62.6 103.5 63.4" stroke="#7a4a36" strokeWidth={1} fill="none" />
        </>
      )}
    </>
  );
}

type HairColor = { hair: string; strand: string };

function HairBack({ style, color }: { style: ModelStyle; color: HairColor }) {
  if (style !== "feminine") return null;
  return <path d={FEM_HAIR_BACK} fill={color.hair} {...stroke} />;
}

function HairFront({ style, color }: { style: ModelStyle; color: HairColor }) {
  if (style === "masculine") {
    return (
      <>
        <path
          d="M81.5 47 Q79 24 100 22 Q121 23 118.5 47 Q117 37 112 34 Q100 37 88 34 Q83 37 81.5 47 Z"
          fill={color.hair}
          {...stroke}
        />
        <path
          d="M88 30 Q96 25 106 25.5 Q113 26.5 115.5 31 M85 37 Q84 41 83.5 44 M116 37 Q116.5 41 117 44"
          stroke={color.strand}
          strokeWidth={1.4}
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }
  return (
    <>
      <path d={FEM_HAIR_CAP} fill={color.hair} {...stroke} />
      {FEM_HAIR_FRONT.map((d) => (
        <path key={d} d={d} fill={color.hair} {...stroke} />
      ))}
      <path d={FEM_HAIR_PART} stroke={color.strand} strokeWidth={1.3} strokeLinecap="round" />
      <path d={FEM_HAIR_SWEEPS} stroke={color.strand} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      {FEM_HAIR_STRANDS.map((d) => (
        <path
          key={d}
          d={d}
          stroke={color.strand}
          strokeWidth={1.2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  );
}

// Plain base layers for an empty Top / Bottom slot, so the model is never drawn bare.
const baseShapes: Record<ModelStyle, { top: Shape; bottom: Shape }> = {
  feminine: {
    top: { parts: [FEM_TORSO] },
    bottom: { parts: ["M78 138 Q100 142 122 138 L124 180 H101.5 L100 170 L98.5 180 H76 Z"] },
  },
  masculine: {
    top: { parts: [MASC_TORSO] },
    bottom: { parts: ["M79 148 H121 L123 188 H101.5 L100 178 L98.5 188 H77 Z"] },
  },
};

// ---------------------------------------------------------------------------------------------

interface Props {
  style: ModelStyle;
  skinTone: SkinTone;
  outfit: ModelOutfit;
  className?: string;
}

export default function Model({ style, skinTone, outfit, className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const b = body[style];
  const hair = HAIR_COLORS[skinTone] ?? HAIR_COLORS["#c98e6b"];

  // Draw by garment kind, not by slot, so e.g. a bag or sunglasses in "Accessory" lands right.
  const byLayer: Partial<Record<Layer, ClothingItem>> = {};
  for (const item of Object.values(outfit)) {
    if (item) byLayer[layerOf[item.kind]] ??= item;
  }
  const wearingDress = byLayer.top?.kind === "dress";
  if (wearingDress) delete byLayer.bottom; // a dress covers the bottom slot
  const longHem = !!byLayer.bottom && LONG_HEMS.includes(byLayer.bottom.kind);

  const wear = (layer: Layer): Worn | null => {
    const item = byLayer[layer];
    if (!item) return null;
    const fill = garmentColors[item.color] ?? "#ffffff";
    const shape = item.kind === "pumps" && longHem ? POINTED_PUMPS : shapes[style][item.kind];
    return { shape, ctx: { fill, accent: accentOf(fill), skin: skinTone }, pattern: item.pattern, clipId: `model-${uid}-${layer}` };
  };
  const base = (which: "top" | "bottom"): Worn => ({
    shape: baseShapes[style][which],
    ctx: { fill: BASE, accent: BASE, skin: skinTone },
    pattern: "solid",
    clipId: `model-${uid}-base-${which}`,
  });

  const shoes = wear("shoes");
  const top = wear("top") ?? base("top");
  const bottom = wearingDress ? null : (wear("bottom") ?? base("bottom"));
  const outerwear = wear("outerwear");

  const names = Object.values(outfit)
    .filter((i): i is ClothingItem => !!i)
    .map((i) => i.name.toLowerCase());
  const label = `${style === "feminine" ? "Feminine" : "Masculine"} model wearing ${
    names.length ? names.join(", ") : "a plain base layer"
  }`;

  return (
    <svg viewBox="0 0 200 330" role="img" aria-label={label} className={className ?? "block h-full w-full"}>
      <ellipse cx="100" cy="316" rx="50" ry="7" fill={INK} fillOpacity={0.12} />

      <HairBack style={style} color={hair} />

      {/* legs and arms, which show under short hems and sleeveless tops */}
      {[...b.legs, ...b.arms].map((d) => (
        <path key={d} d={d} fill={skinTone} {...stroke} />
      ))}

      {/* shoes (bare feet when none) */}
      {shoes ? (
        <Garment worn={shoes} />
      ) : (
        <>
          <ellipse cx="92" cy="302" rx="6" ry="3.5" fill={skinTone} {...stroke} />
          <ellipse cx="108" cy="302" rx="6" ry="3.5" fill={skinTone} {...stroke} />
        </>
      )}

      <Garment worn={bottom} />
      <Garment worn={top} />
      <Garment worn={wear("belt")} />
      <Garment worn={outerwear} />
      <Garment worn={wear("purse")} />

      {b.hands.map((h) => (
        <ellipse key={h.cx} {...h} fill={skinTone} {...stroke} />
      ))}

      <Garment worn={wear("inHand")} />

      <Head style={style} skin={skinTone} />
      <Collar worn={top} />
      <Collar worn={outerwear} />
      <Face style={style} />
      <Garment worn={wear("glasses")} />
      <HairFront style={style} color={hair} />
    </svg>
  );
}
