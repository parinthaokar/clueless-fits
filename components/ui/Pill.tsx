import Link from "next/link";
import { cx } from "./cx";

// Fully rounded, 2px ink border, bold. Used for nav, filters, occasions and small actions.
// selected → ink fill + mustard text (fill AND text change, so it's not color-only).
// size="sm" is the "soft" pill: filters, occasions, Shuffle / Turn / Retake photo, weather chip.
//
// Renders a <Link> with href, a <button> with onClick, otherwise a static <span>.
interface Props {
  selected?: boolean;
  size?: "md" | "sm";
  count?: number;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}

const sizes = {
  md: "px-4 py-[7px] text-sm font-bold",
  sm: "px-3 py-[5px] text-[13px] font-semibold",
};

export default function Pill({
  selected = false,
  size = "md",
  count,
  href,
  onClick,
  type = "button",
  className,
  children,
  "aria-label": ariaLabel,
}: Props) {
  const classes = cx(
    "inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 border-ink transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raspberry",
    sizes[size],
    selected ? "bg-ink text-mustard" : "bg-white text-ink",
    (href || onClick) && !selected && "hover:bg-track",
    className,
  );
  const content = (
    <>
      {children}
      {count !== undefined && <span className="opacity-60">{count}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-current={selected ? "page" : undefined} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type={type} onClick={onClick} className={classes} aria-pressed={selected} aria-label={ariaLabel}>
        {content}
      </button>
    );
  }
  return (
    <span className={classes} aria-label={ariaLabel}>
      {content}
    </span>
  );
}
