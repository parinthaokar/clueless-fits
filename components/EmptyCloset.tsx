import { Shirt } from "lucide-react";

export default function EmptyCloset({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-lavender bg-white px-6 py-16 text-center">
      {/* Illustration placeholder */}
      <div className="mb-4 rounded-full bg-lilac p-6">
        <Shirt size={48} className="text-lavender" />
      </div>
      <p className="font-display text-2xl">{message ?? "Your closet is empty."}</p>
      {!message && <p className="mt-1 text-ink/70">Add your first item.</p>}
    </div>
  );
}
