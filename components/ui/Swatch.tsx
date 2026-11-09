import { garmentColors, type ColorName } from "@/lib/colors";
import { cx } from "./cx";

// 12px color dot with an ink ring. Decorative: always show the color name next to it.
export default function Swatch({ color, className }: { color: ColorName; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block h-3 w-3 shrink-0 rounded-full border-[1.5px] border-ink", className)}
      style={{ background: garmentColors[color] }}
    />
  );
}
