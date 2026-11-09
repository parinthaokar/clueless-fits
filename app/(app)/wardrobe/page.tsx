"use client";

import { useState } from "react";
import AddPieceDrawer from "@/components/AddPieceDrawer";
import EmptyState from "@/components/EmptyState";
import GarmentCard from "@/components/GarmentCard";
import TextFilters from "@/components/TextFilters";
import { categories, wardrobeItems } from "@/lib/mockData";

export default function WardrobePage() {
  const [items, setItems] = useState(wardrobeItems);
  const [filter, setFilter] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visible = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl sm:text-6xl">Your Wardrobe</h1>
          <p className="label mt-3">{items.length} pieces</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="label shrink-0 border border-ink px-5 py-3 text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Add Piece
        </button>
      </div>

      <div className="mt-10 border-b border-line pb-3">
        <TextFilters options={["All", ...categories]} selected={filter} onSelect={setFilter} />
      </div>

      <div className="mt-10">
        {items.length === 0 ? (
          <EmptyState>Your wardrobe is empty. Add your first piece.</EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState>Nothing here yet.</EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
            {visible.map((item) => (
              <GarmentCard
                key={item.id}
                item={item}
                onRemove={(id) => setItems(items.filter((i) => i.id !== id))}
              />
            ))}
          </div>
        )}
      </div>

      {drawerOpen && (
        <AddPieceDrawer
          onClose={() => setDrawerOpen(false)}
          onAdd={(item) => setItems([item, ...items])}
        />
      )}
    </div>
  );
}
