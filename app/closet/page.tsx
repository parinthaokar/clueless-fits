"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddItemModal from "@/components/AddItemModal";
import Chips from "@/components/Chips";
import ClothingCard from "@/components/ClothingCard";
import EmptyCloset from "@/components/EmptyCloset";
import { categories, closetItems } from "@/lib/mockData";

export default function ClosetPage() {
  const [items, setItems] = useState(closetItems);
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);

  const visible = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">My Closet</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-pink-deep px-5 py-2 font-medium text-white shadow-sm"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="mt-5">
        <Chips options={["All", ...categories]} selected={filter} onSelect={setFilter} />
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyCloset />
        ) : visible.length === 0 ? (
          <EmptyCloset message={`No ${filter.toLowerCase()} yet.`} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((item) => (
              <ClothingCard
                key={item.id}
                item={item}
                onDelete={(id) => setItems(items.filter((i) => i.id !== id))}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <AddItemModal
          onClose={() => setModalOpen(false)}
          onAdd={(item) => setItems([item, ...items])}
        />
      )}
    </div>
  );
}
