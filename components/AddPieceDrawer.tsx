"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import GarmentArt from "@/components/GarmentArt";
import { Button, Card, ConfidenceBar, Note, Pill, Swatch, Tag } from "@/components/ui";
import { colorNames, defaultKind, type ColorName } from "@/lib/colors";
import { categories, MOCK_TODAY, mockTagResult } from "@/lib/mockData";
import type { Category, ClothingItem, Pattern, TagResult } from "@/lib/types";

interface Props {
  onClose: () => void;
  onAdd: (item: ClothingItem) => void;
}

// An uploaded photo, or the built-in sample so the flow can be demoed without a file.
type Photo = { type: "upload"; url: string } | { type: "sample" };

const patterns: Pattern[] = ["solid", "plaid", "stripe"];

export default function AddPieceDrawer({ onClose, onAdd }: Props) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [tags, setTags] = useState<TagResult | null>(null);
  const [dragging, setDragging] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Tops");
  const [color, setColor] = useState<ColorName>("white");
  const [pattern, setPattern] = useState<Pattern>("solid");
  const [notes, setNotes] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Focus the dialog on open, close on Escape.
  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Tag from the photo first (mocked), then let the user edit everything.
  function takePhoto(next: Photo) {
    if (photo?.type === "upload") URL.revokeObjectURL(photo.url);
    setPhoto(next);
    const result = mockTagResult;
    setTags(result);
    setName(result.name);
    setCategory(result.category);
    setColor(result.color);
    setPattern(result.pattern);
  }

  function handleFile(file: File | undefined) {
    if (file && file.type.startsWith("image/")) takePhoto({ type: "upload", url: URL.createObjectURL(file) });
  }

  function retake() {
    if (photo?.type === "upload") URL.revokeObjectURL(photo.url);
    setPhoto(null);
    setTags(null);
  }

  function handleSave() {
    if (!tags || !name.trim()) return;
    onAdd({
      id: `new-${Date.now()}`,
      name: name.trim(),
      category,
      // Keep the tagger's drawing unless the user changed the category.
      kind: category === tags.category ? tags.kind : defaultKind[category],
      color,
      pattern,
      notes: notes.trim() || undefined,
      photoUrl: photo?.type === "upload" ? photo.url : undefined,
      addedAt: MOCK_TODAY,
    });
    onClose();
  }

  // Portal to <body>: the page's fade-in wrapper is transformed, which would trap a fixed overlay inside it.
  return createPortal(
    <div className="fixed inset-0 z-40">
      <div onClick={onClose} className="absolute inset-0 bg-ink/40" aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="slide-in absolute top-0 right-0 h-full w-full max-w-[1200px] overflow-y-auto border-l-2 border-ink bg-cream px-5 py-7 outline-none sm:px-10"
      >
        <div className="mb-4 flex items-start gap-4">
          <div className="flex-1">
            <h2 id={titleId} className="text-[28px] font-black tracking-[-0.01em]">
              Add a piece
            </h2>
            <p className="mt-1 text-muted">Upload a photo and we&apos;ll tag it for you.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-[38px] w-[38px] place-items-center rounded-full border-2 border-ink bg-white focus-visible:outline-2 focus-visible:outline-raspberry"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-2">
          {/* Photo */}
          <Card className="p-4">
            <div className="aspect-square overflow-hidden rounded-2xl border-[1.5px] border-track bg-canvas">
              {photo?.type === "upload" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt="Your photo" className="h-full w-full object-contain" />
              ) : photo?.type === "sample" ? (
                <GarmentArt kind="blazer" color="mustard" pattern="plaid" label="Sample photo: yellow plaid blazer" />
              ) : (
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
                  className={`flex h-full cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-center transition-colors focus-within:outline-2 focus-within:outline-raspberry ${
                    dragging ? "border-raspberry bg-note-pink" : "border-ink/30"
                  }`}
                >
                  <span className="text-[15px] font-extrabold">Drop a photo here</span>
                  <span className="text-sm text-muted">or click to browse</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {photo ? (
                <Pill size="sm" onClick={retake}>
                  Retake photo
                </Pill>
              ) : (
                <Pill size="sm" onClick={() => takePhoto({ type: "sample" })}>
                  Use a sample photo
                </Pill>
              )}
            </div>
          </Card>

          {/* Tags */}
          <Card className="px-[22px] py-5">
            {tags ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <div className="mb-1.5 flex items-center gap-2.5">
                  <h3 className="text-lg font-black">Tagged from your photo</h3>
                  <Tag tone="mustard">auto</Tag>
                </div>
                <p className="mb-2 text-[13.5px] text-muted">How sure the model is about the category:</p>
                {tags.confidences.map((c, i) => (
                  <ConfidenceBar key={c.category} label={c.category} percent={c.percent} top={i === 0} />
                ))}

                <div className="mt-5 space-y-3.5">
                  <Field label="Name">
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={control}
                    />
                  </Field>
                  <Field label="Category">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className={control}
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Color" swatch={color}>
                      <select
                        value={color}
                        onChange={(e) => setColor(e.target.value as ColorName)}
                        className={`${control} pl-8`}
                      >
                        {colorNames.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Pattern">
                      <select
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value as Pattern)}
                        className={control}
                      >
                        {patterns.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label="Notes (optional)">
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. runs small, dry clean only"
                      className={`${control} placeholder:text-muted`}
                    />
                  </Field>
                </div>

                <Note className="mt-4">
                  We tag from the photo first: in our training data, about 70% of items had no title or
                  description, so images carried the signal.
                </Note>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button type="submit" disabled={!name.trim()}>
                    Save to wardrobe
                  </Button>
                  <Button variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <h3 className="text-lg font-black">Tagged from your photo</h3>
                <p className="mt-1.5 text-[15px] text-muted">
                  Add a photo and we&apos;ll fill in the category, color and pattern. You can fix anything
                  before saving.
                </p>
                <Note className="mt-4">
                  We tag from the photo first: in our training data, about 70% of items had no title or
                  description, so images carried the signal.
                </Note>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Text input / select styled like the mockup's fields, with the muted "edit" hint on the right.
const control =
  "w-full appearance-none rounded-xl border-2 border-ink bg-white py-2.5 pr-12 pl-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-raspberry";

function Field({ label, swatch, children }: { label: string; swatch?: ColorName; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-[5px] block text-xs font-bold tracking-[0.06em] uppercase">{label}</span>
      <span className="relative block">
        {swatch && <Swatch color={swatch} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />}
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted"
        >
          edit
        </span>
      </span>
    </label>
  );
}
