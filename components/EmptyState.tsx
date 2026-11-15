import { Card } from "@/components/ui";

// "Nothing here yet" panel: a bold line, optional detail text and actions underneath.
export default function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <p className="text-xl font-black">{title}</p>
      {children && <div className="flex flex-wrap items-center justify-center gap-3 text-muted">{children}</div>}
    </Card>
  );
}
