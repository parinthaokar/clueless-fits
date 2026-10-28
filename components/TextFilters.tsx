// Row of text-style options. Active one gets a thin underline.
interface Props {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export default function TextFilters({ options, selected, onSelect }: Props) {
  return (
    <div className="flex gap-6 overflow-x-auto">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`label whitespace-nowrap border-b pb-1 transition-colors ${
            selected === option ? "border-ink text-ink" : "border-transparent hover:text-ink"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
