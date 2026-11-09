"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button, Card, ConfidenceBar, Note, Pill, Swatch, Tag, Warn } from "@/components/ui";
import { API_ERRORS, ApiError, LOW_CONFIDENCE, predictCategory, topCategories } from "@/lib/api";
import { colorNames, defaultKind, type ColorName } from "@/lib/colors";
import { categories, MOCK_TODAY } from "@/lib/mockData";
import type { Category, ClothingItem, Pattern, PredictResponse } from "@/lib/types";

interface Props {
  onClose: () => void;
  onAdd: (item: ClothingItem) => void;
}

const patterns: Pattern[] = ["solid", "plaid", "stripe"];
const NAME_MAX = 200; // contract: 1–200 characters, not blank
const DESCRIPTION_MAX = 2000;

export default function AddPieceDrawer({ onClose, onAdd }: Props) {
  // The photo is the item's picture only; tagging uses the name.
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [color, setColor] = useState<ColorName>("white");
  const [pattern, setPattern] = useState<Pattern>("solid");

  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [tagging, setTagging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Focus the dialog on open, close on Escape, cancel any request on close.
  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      requestRef.current?.abort();
    };
  }, [onClose]);

  function setPhoto(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
  }

  function removePhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
  }

  // Editing the text makes an earlier prediction stale, so drop it (the chosen category stays).
  function editText(update: () => void) {
    update();
    setPrediction(null);
    setError(null);
  }

  async function tagIt() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(API_ERRORS.invalid);
      return;
    }
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setTagging(true);
    setError(null);
    setPrediction(null);
    try {
      const result = await predictCategory(
        { name: trimmed, description: description.trim() || undefined },
        controller.signal,
      );
      setPrediction(result);
      setCategory(result.app_category);
    } catch (err) {
      if (controller.signal.aborted) return; // superseded or closed
      setError(err instanceof ApiError ? err.message : API_ERRORS.unknown);
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setTagging(false);
      }
    }
  }

  function handleSave() {
    if (!name.trim() || !category) return;
    onAdd({
      id: `new-${Date.now()}`,
      name: name.trim(),
      category,
      kind: defaultKind[category],
      color,
      pattern,
      description: description.trim() || undefined,
      photoUrl: photoUrl ?? undefined,
      addedAt: MOCK_TODAY,
    });
    onClose();
  }

  const unsure = prediction !== null && prediction.confidence < LOW_CONFIDENCE;
  const choices = prediction ? topCategories(prediction.top_3) : [];

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
            <p className="mt-1 text-muted">Name it and we&apos;ll tag it for you. A photo is optional.</p>
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
          {/* Photo: the item's picture only */}
          <Card className="p-4">
            <div className="aspect-square overflow-hidden rounded-2xl border-[1.5px] border-track bg-canvas">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Your photo of this piece" className="h-full w-full object-contain" />
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
                    setPhoto(e.dataTransfer.files[0]);
                  }}
                  className={`flex h-full cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-6 text-center transition-colors focus-within:outline-2 focus-within:outline-raspberry ${
                    dragging ? "border-raspberry bg-note-pink" : "border-ink/30"
                  }`}
                >
                  <span className="text-[15px] font-extrabold">Add a photo (optional)</span>
                  <span className="text-sm text-muted">Drop it here or click to browse</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => setPhoto(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              {photoUrl && (
                <Pill size="sm" onClick={removePhoto}>
                  Remove photo
                </Pill>
              )}
              <span className="text-[13px] text-muted">Used as the picture only. Tagging reads the name.</span>
            </div>
          </Card>

          {/* Name → tags */}
          <Card className="px-[22px] py-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <h3 className="text-lg font-black">Tagged from the name</h3>
                {prediction && !unsure && <Tag tone="mustard">auto</Tag>}
              </div>

              <div className="space-y-3.5">
                <Field label="Name">
                  <input
                    required
                    maxLength={NAME_MAX}
                    value={name}
                    onChange={(e) => editText(() => setName(e.target.value))}
                    placeholder="e.g. Yellow plaid blazer"
                    className={`${control} placeholder:text-muted`}
                  />
                </Field>
                <Field label="Description (optional)">
                  <textarea
                    rows={3}
                    maxLength={DESCRIPTION_MAX}
                    value={description}
                    onChange={(e) => editText(() => setDescription(e.target.value))}
                    placeholder="e.g. Wool blend, single-breasted, cropped fit"
                    className={`${control} resize-y placeholder:text-muted`}
                  />
                </Field>
              </div>

              <Button
                variant="secondary"
                className="mt-4"
                onClick={tagIt}
                loading={tagging}
                disabled={!name.trim()}
              >
                {tagging ? "Tagging…" : "Tag it"}
              </Button>

              {/* Announce tagging results and errors to screen readers */}
              <div aria-live="polite" className="mt-4 space-y-2 empty:hidden">
                {error && <Warn>{error}</Warn>}
                {prediction && (
                  <div>
                    {unsure ? (
                      <p className="mb-1 text-[15px] font-extrabold">Not sure, pick one</p>
                    ) : null}
                    <p className="mb-2 text-[13.5px] text-muted">How sure the model is about the category:</p>
                    {choices.map((c, i) => (
                      <ConfidenceBar
                        key={c.category}
                        label={c.category}
                        percent={c.probability * 100}
                        top={i === 0}
                      />
                    ))}
                    {unsure && (
                      <div role="group" aria-label="Pick a category" className="mt-2 flex flex-wrap gap-2">
                        {choices.map((c) => (
                          <Pill
                            key={c.category}
                            size="sm"
                            selected={category === c.category}
                            onClick={() => setCategory(c.category)}
                          >
                            {c.category}
                          </Pill>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3.5">
                <Field label="Category">
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className={control}
                  >
                    <option value="" disabled>
                      Tag it, or pick one
                    </option>
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
              </div>

              <Note className="mt-4">
                We tag from the item&apos;s name: every catalog item had one, while about 70% had no title or
                description.
              </Note>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="submit" disabled={!name.trim() || !category}>
                  Save to wardrobe
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
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
        <span aria-hidden="true" className="pointer-events-none absolute top-3 right-3 text-xs text-muted">
          edit
        </span>
      </span>
    </label>
  );
}
