// Shoe drawings for GarmentArt (viewBox 0 0 120 120). Pumps: a pair in three-quarter view. Sneakers: side view, toe right.
// `color` is the item's tagged color. Other colors are the Clueless palette.
// Paste these into components/GarmentArt.tsx in place of the old pumps and sneakers.

const INK = "#1d1a16";

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
export function PumpsArt({ color }: { color: string }) {
  return (
    <g transform="translate(0 7) scale(0.376)">
      <g transform="translate(3 215) rotate(6.5) scale(0.952) translate(-80 -266)">
        <OnePump color={color} />
      </g>
      <OnePump color={color} />
    </g>
  );
}

export function SneakersArt({ color }: { color: string }) {
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
