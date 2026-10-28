"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { categories } from "@/lib/mockData";
import type { Category, ClothingItem } from "@/lib/types";

interface Props {
  onClose: () => void;
  onAdd: (item: ClothingItem) => void;
}

export default function AddItemModal({ onClose, onAdd }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [category, setCategory] = useState<Category>("Tops");
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (file && file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    }
  }

  function handleAdd() {
    onAdd({
      id: `new-${Date.now()}`,
      name: "New item",
      category,
      imageUrl: preview!,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-cream shadow-xl">
        <div className="gingham h-3" />
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Add Item</h2>
            <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-lilac">
              <X />
            </button>
          </div>

          {/* Drop zone / preview */}
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
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center ${
              dragging ? "border-pink-deep bg-blush" : "border-lavender bg-white"
            }`}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <>
                <ImagePlus size={40} className="text-lavender" />
                <p className="mt-2 font-medium">Drag a photo here</p>
                <p className="text-sm text-ink/60">or click to browse</p>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>

          {/* Mock classification result */}
          {uploaded && (
            <div className="mt-4 rounded-2xl bg-butter p-4">
              <p className="font-medium">Detected: Tops (92% confident)</p>
              <label className="mt-2 block text-sm">
                Not right? Pick the correct category:
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="mt-1 w-full rounded-xl border border-lavender bg-white px-3 py-2"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-full px-4 py-2 hover:bg-lilac">
              Cancel
            </button>
            {uploaded ? (
              <button onClick={handleAdd} className="rounded-full bg-pink-deep px-5 py-2 font-medium text-white">
                Add to closet
              </button>
            ) : (
              <button
                disabled={!preview}
                onClick={() => setUploaded(true)}
                className="rounded-full bg-pink-deep px-5 py-2 font-medium text-white disabled:opacity-40"
              >
                Upload
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
