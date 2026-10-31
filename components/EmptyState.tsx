export default function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-24 text-center font-serif text-2xl text-muted">{children}</p>
  );
}
