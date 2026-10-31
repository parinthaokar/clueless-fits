import LookCard from "@/components/LookCard";
import { savedOutfits } from "@/lib/mockData";

export default function SavedPage() {
  return (
    <div>
      <h1 className="font-serif text-5xl sm:text-6xl">Saved</h1>
      <p className="label mt-3">{savedOutfits.length} looks</p>
      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {savedOutfits.map((outfit) => (
          <LookCard key={outfit.id} outfit={outfit} />
        ))}
      </div>
    </div>
  );
}
