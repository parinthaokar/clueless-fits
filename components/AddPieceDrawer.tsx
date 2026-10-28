"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { categories } from "@/lib/mockData";
import type { Category, ClothingItem } from "@/lib/types";

interface Props {
  onClose: () => void;
  onAdd: (item: ClothingItem) => void;
}

export default function AddPieceDrawer({ onClose, onAdd }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [identified, setIdentified] = useState(false);
  const [category, setCategory] = useState<Category>("Tops");
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (file && file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    }
  }

  function handleAdd() {
    onAdd({ id: `new-${Date.now()}`, name: "New piece", category, imageUrl: preview! });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40">
      {/* Dimmed backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-ink/30" />

      <aside className="slide-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-paper p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl">Add Piece</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={1.25} />
          </button>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`mt-8 flex aspect-[3/4] cursor-pointer flex-col items-center justify-center overflow-hidden border text-center transition-colors ${
            dragging ? "border-ink bg-stone" : "border-line"
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <>
              <p className="text-sm">Drop a photograph here</p>
              <p className="label mt-2">or click to browse</p>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        {identified && (
          <div className="mt-6">
            <p className="text-sm">Identified as: Tops · 92%</p>
            <label className="label mt-4 block">
              Correct category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm normal-case tracking-normal text-ink"
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="mt-auto flex justify-end gap-3 pt-8">
          <button onClick={onClose} className="label px-4 py-3 hover:text-ink">
            Cancel
          </button>
          {identified ? (
            <button onClick={handleAdd} className="label bg-accent px-6 py-3 text-paper hover:opacity-90">
              Add to wardrobe
            </button>
          ) : (
            <button
              disabled={!preview}
              onClick={() => setIdentified(true)}
              className="label bg-accent px-6 py-3 text-paper hover:opacity-90 disabled:opacity-30"
            >
              Upload
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
