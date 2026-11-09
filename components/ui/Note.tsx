import { cx } from "./cx";

// Info note: pink fill, dashed raspberry border.
export default function Note({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      role="note"
      className={cx(
        "rounded-[14px] border-2 border-dashed border-raspberry bg-note-pink px-3.5 py-2.5 text-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
