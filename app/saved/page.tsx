import SavedOutfitCard from "@/components/SavedOutfitCard";
import { savedOutfits } from "@/lib/mockData";

export default function SavedPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Saved Outfits</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {savedOutfits.map((outfit) => (
          <SavedOutfitCard key={outfit.id} outfit={outfit} />
        ))}
      </div>
    </div>
  );
}
