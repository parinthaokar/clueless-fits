import { Pill } from "@/components/ui";

// Row of filter pills with optional counts. The selected one is filled ink with mustard text.
interface Props {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  counts?: Record<string, number>;
  label?: string;
}

export default function TextFilters({ options, selected, onSelect, counts, label = "Filter" }: Props) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Pill
          key={option}
          size="sm"
          selected={selected === option}
          count={counts?.[option]}
          onClick={() => onSelect(option)}
        >
          {option}
        </Pill>
      ))}
    </div>
  );
}
