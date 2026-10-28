"use client";

import { Star } from "lucide-react";

interface Props {
  value: number;
  onChange?: (value: number) => void; // omit for a read-only display
  size?: number;
}

export default function StarRating({ value, onChange, size = 28 }: Props) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="disabled:cursor-default"
        >
          <Star
            size={size}
            className={n <= value ? "fill-butter-deep text-butter-deep" : "text-lavender"}
          />
        </button>
      ))}
    </div>
  );
}
