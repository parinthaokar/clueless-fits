// Row of pill buttons. Used for category filters and occasion quick-picks.
interface Props {
  options: string[];
  selected?: string;
  onSelect: (option: string) => void;
}

export default function Chips({ options, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            selected === option
              ? "border-pink-deep bg-pink font-medium"
              : "border-lavender/60 bg-white hover:bg-lilac"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
