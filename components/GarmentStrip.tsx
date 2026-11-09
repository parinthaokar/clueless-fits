import { Card } from "@/components/ui";

// The row of seven illustrated pieces on the landing page.
// Paths copied from design/html/1_landing.html.
const INK = "#1d1a16";
const outline = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round" as const };

const BLAZER = "M28 24 L48 14 L60 30 L72 14 L92 24 L104 96 H84 L82 52 L80 98 H40 L38 52 L36 96 H16 Z";

function Blazer() {
  const darkLinesX = [18, 32, 46, 60, 74, 88, 102];
  const darkLinesY = [30, 44, 58, 72, 86, 100];
  const pinstripesX = [25, 53, 81, 109];
  return (
    <>
      <defs>
        <clipPath id="landing-blazer-clip">
          <path d={BLAZER} />
        </clipPath>
      </defs>
      <path d={BLAZER} fill="#f6c544" />
      <g clipPath="url(#landing-blazer-clip)">
        {darkLinesX.map((x) => (
          <path key={`v${x}`} d={`M${x} 10 V100`} stroke={INK} strokeOpacity={0.28} strokeWidth={3} />
        ))}
        {darkLinesY.map((y) => (
          <path key={`h${y}`} d={`M10 ${y} H110`} stroke={INK} strokeOpacity={0.28} strokeWidth={3} />
        ))}
        {pinstripesX.map((x) => (
          <path key={`p${x}`} d={`M${x} 10 V100`} stroke="#c2185b" strokeOpacity={0.45} strokeWidth={1.5} />
        ))}
      </g>
      <path d={BLAZER} fill="none" {...outline} />
      <path d="M60 30 V98" stroke={INK} strokeWidth={2} />
    </>
  );
}

const garments: { label: string; art: React.ReactNode }[] = [
  { label: "Yellow plaid blazer", art: <Blazer /> },
  {
    label: "Mustard pleated mini skirt",
    art: (
      <>
        <path d="M40 22 H80 L98 92 H22 Z" fill="#f6c544" {...outline} />
        <path d="M40 30 H80" stroke={INK} strokeWidth={2} />
        {[34, 47, 60, 73, 86].map((x) => (
          <path key={x} d={`M${x} 40 V90`} stroke={INK} strokeOpacity={0.35} strokeWidth={2} />
        ))}
      </>
    ),
  },
  {
    label: "White tee",
    art: <path d="M30 22 L48 14 Q60 22 72 14 L90 22 L102 42 L86 50 L84 98 L36 98 L34 50 L18 42 Z" fill="#ffffff" {...outline} />,
  },
  {
    label: "Pink slip dress",
    art: (
      <>
        <path d="M46 12 L52 12 Q60 22 68 12 L74 12 L78 40 L96 98 H24 L42 40 Z" fill="#f6a5c0" {...outline} />
        <path d="M42 42 H78" stroke={INK} strokeWidth={2} />
      </>
    ),
  },
  {
    label: "Light-wash jeans",
    art: (
      <>
        <path d="M36 14 H84 L90 100 H66 L60 46 L54 100 H30 Z" fill="#8fb6e8" {...outline} />
        <path d="M36 24 H84" stroke={INK} strokeWidth={2} />
      </>
    ),
  },
  {
    label: "White sneaker",
    art: (
      <>
        <path d="M14 70 Q16 48 36 48 L56 52 Q70 62 92 64 Q106 66 106 78 V84 H14 Z" fill="#ffffff" {...outline} />
        <path d="M14 84 H106" stroke={INK} strokeWidth={5} />
        <path d="M42 54 L50 64 M50 54 L58 64" stroke={INK} strokeWidth={2} />
      </>
    ),
  },
  {
    label: "Black knee-high boot",
    art: (
      <>
        <path d="M36 16 H64 V64 Q86 64 98 76 V88 H30 V16 Z" fill="#2b2724" {...outline} />
        <path d="M30 88 H98" stroke={INK} strokeWidth={5} />
      </>
    ),
  },
];

export default function GarmentStrip() {
  return (
    <ul className="flex flex-wrap justify-center gap-4 lg:flex-nowrap lg:justify-between">
      {garments.map((g) => (
        <Card key={g.label} as="li" size="md" className="p-2">
          <svg viewBox="0 0 120 120" width={104} height={104} role="img" aria-label={g.label}>
            <rect width="120" height="120" fill="#fff" />
            {g.art}
          </svg>
        </Card>
      ))}
    </ul>
  );
}
