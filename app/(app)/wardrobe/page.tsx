"use client";

import { useState } from "react";
import AddPieceDrawer from "@/components/AddPieceDrawer";
import EmptyState from "@/components/EmptyState";
import GarmentCard from "@/components/GarmentCard";
import TextFilters from "@/components/TextFilters";
import { Button } from "@/components/ui";
import { categories, MOCK_TODAY, wardrobeItems } from "@/lib/mockData";
import type { ClothingItem } from "@/lib/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function addedThisWeek(items: ClothingItem[]) {
  const today = Date.parse(MOCK_TODAY);
  return items.filter((i) => today - Date.parse(i.addedAt) < WEEK_MS).length;
}

export default function WardrobePage() {
  const [items, setItems] = useState(wardrobeItems);
  const [filter, setFilter] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visible = filter === "All" ? items : items.filter((i) => i.category === filter);
  const counts: Record<string, number> = { All: items.length };
  for (const c of categories) counts[c] = items.filter((i) => i.category === c).length;

  return (
    <div>
      <div className="mb-4 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
        <div className="sm:flex-1">
          <h1 className="text-[28px] font-black tracking-[-0.01em]">My wardrobe</h1>
          <p className="mt-1 text-muted">
            {items.length} {items.length === 1 ? "piece" : "pieces"} · {addedThisWeek(items)} added this week
          </p>
        </div>
        <Button onClick={() => setDrawerOpen(true)}>+ Add a piece</Button>
      </div>

      <div className="mb-5">
        <TextFilters
          label="Filter by category"
          options={["All", ...categories]}
          counts={counts}
          selected={filter}
          onSelect={setFilter}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState>Your wardrobe is empty. Add your first piece.</EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState>No {filter.toLowerCase()} yet.</EmptyState>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((item) => (
            <GarmentCard
              key={item.id}
              item={item}
              onRemove={(id) => setItems(items.filter((i) => i.id !== id))}
            />
          ))}
        </ul>
      )}

      {drawerOpen && (
        <AddPieceDrawer
          onClose={() => setDrawerOpen(false)}
          onAdd={(item) => setItems([item, ...items])}
        />
      )}
    </div>
  );
}
