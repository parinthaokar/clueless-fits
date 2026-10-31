// Small outlined text pills for quick occasion picks.
export default function OccasionPills({
  options,
  onSelect,
}: {
  options: string[];
  onSelect: (option: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className="label border border-line px-3 py-1.5 transition-colors hover:border-ink hover:text-ink"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
