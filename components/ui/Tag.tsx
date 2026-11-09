import { cx } from "./cx";

// Small rounded label: track fill, 1.5px ink border. tone="mustard" for the "auto" badge.
export default function Tag({
  tone = "track",
  className,
  children,
}: {
  tone?: "track" | "mustard";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-block whitespace-nowrap rounded-full border-[1.5px] border-ink px-[9px] py-[3px] text-[11.5px] font-bold leading-tight text-ink",
        tone === "mustard" ? "bg-mustard" : "bg-track",
        className,
      )}
    >
      {children}
    </span>
  );
}
