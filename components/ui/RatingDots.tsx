"use client";

import { cx } from "./cx";

// Five dots: filled raspberry, empty track. Stores the 1–5 "style fit" rating.
// Pass onChange to make it an interactive radio group; omit it for a read-only display.
interface Props {
  value: number;
  onChange?: (value: number) => void;
  label?: string;
  className?: string;
}

export default function RatingDots({ value, onChange, label = "Style fit rating", className }: Props) {
  const dot = (n: number) =>
    cx("block h-4 w-4 rounded-full", n <= value ? "bg-raspberry" : "bg-track");

  if (!onChange) {
    return (
      <div role="img" aria-label={`${label}: ${value} out of 5`} className={cx("flex gap-2", className)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={dot(n)} />
        ))}
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label={label} className={cx("flex gap-1", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} out of 5`}
          onClick={() => onChange(n)}
          className="group rounded-full p-0.5 focus-visible:outline-2 focus-visible:outline-raspberry"
        >
          <span className={cx(dot(n), "transition-transform group-hover:scale-110")} />
        </button>
      ))}
    </div>
  );
}
