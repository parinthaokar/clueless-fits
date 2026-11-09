import { cx } from "./cx";

// White card, 2px ink border, hard mustard drop shadow (no blur).
// size="lg" → page cards (22px radius, 6px shadow)
// size="md" → garment tiles in grids (22px radius, 5px shadow)
// size="sm" → small item tiles, e.g. Stylist look pieces (16px radius, 4px shadow)
// Padding is up to the caller via className.
interface Props extends React.HTMLAttributes<HTMLElement> {
  size?: "lg" | "md" | "sm";
  as?: "div" | "section" | "article" | "li";
}

const sizes = {
  lg: "rounded-[22px] shadow-card",
  md: "rounded-[22px] shadow-tile",
  sm: "rounded-2xl shadow-tile-sm",
};

export default function Card({ size = "lg", as: Tag = "div", className, ...rest }: Props) {
  return <Tag className={cx("border-2 border-ink bg-white", sizes[size], className)} {...rest} />;
}
