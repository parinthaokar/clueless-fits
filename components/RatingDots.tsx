"use client";

// Five minimal dots. Pass onChange to make it interactive; omit it to display a rating.
interface Props {
  value: number;
  onChange?: (value: number) => void;
}

export default function RatingDots({ value, onChange }: Props) {
  return (
    <div className="flex gap-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} out of 5`}
          className={`h-3 w-3 rounded-full border border-ink transition-colors disabled:cursor-default ${
            n <= value ? "bg-ink" : "bg-transparent"
          } ${onChange ? "hover:bg-ink/40" : ""}`}
        />
      ))}
    </div>
  );
}
