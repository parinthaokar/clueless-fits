import { cx } from "./cx";

// Warning: yellow fill, dashed dark-goldenrod border. Optional bold lead-in, e.g. "Closet gap:".
export default function Warn({
  title,
  className,
  children,
}: {
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="note"
      className={cx(
        "rounded-[14px] border-2 border-dashed border-warn-border bg-warn-yellow px-3.5 py-2.5 text-sm",
        className,
      )}
    >
      {title && <strong className="font-bold">{title} </strong>}
      {children}
    </div>
  );
}
