import { cx } from "./cx";

// One row of the "how sure is the model" readout: label | 12px bar on track | percent.
// The top choice is raspberry with a bold label; the others are denim. The percent is
// always printed so the bars never rely on color alone.
interface Props {
  label: string;
  /** 0–100 */
  percent: number;
  top?: boolean;
  className?: string;
}

export default function ConfidenceBar({ label, percent, top = false, className }: Props) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={cx("my-2 grid grid-cols-[96px_1fr_44px] items-center gap-2.5", className)}>
      <span className={cx("text-sm", top ? "font-extrabold" : "font-medium")}>{label}</span>
      <div
        role="meter"
        aria-label={`${label} confidence`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value}%`}
        className="h-3 overflow-hidden rounded-lg bg-track"
      >
        <div
          className={cx("h-full rounded-lg", top ? "bg-raspberry" : "bg-denim")}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[13px] font-bold" aria-hidden="true">
        {value}%
      </span>
    </div>
  );
}
