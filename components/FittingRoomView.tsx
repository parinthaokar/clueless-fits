"use client";

import { useState } from "react";
import GarmentImage from "@/components/GarmentImage";
import Model, { SKIN_TONES } from "@/components/Model";
import { Button, Card, Note, Pill, Tag } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { classLook, getOutfitById, wardrobeItems, weather } from "@/lib/mockData";
import { closetFor, isDress, lookFromQuery, lookToQuery, sortBySlot, toModelOutfit } from "@/lib/outfit";
import { useStore } from "@/lib/store";
import type { LookSlot, ModelStyle, OutfitItem, OutfitSuggestion } from "@/lib/types";

// design/screens/5_fitting_room.png and 6_fitting_room_masc.png.
// Swaps cycle through closet items that fit the slot (lib/outfit.ts closetFor), including
// pieces added in the Wardrobe. Model style and skin tone are shared with the Stylist via the store.

export type FittingRoomParams = { outfit?: string; items?: string; occasion?: string; model?: string; saved?: string };

const styles: { value: ModelStyle; label: string }[] = [
  { value: "feminine", label: "Feminine" },
  { value: "masculine", label: "Masculine" },
];

const asModelStyle = (v: string | undefined): ModelStyle | undefined =>
  v === "feminine" || v === "masculine" ? v : undefined;

export default function FittingRoomView({ params }: { params: FittingRoomParams }) {
  const { closet, saved, modelStyle, ready } = useStore();

  // Pieces the Stylist suggests come from the demo closet, so look ids up there too.
  const known = [...closet, ...wardrobeItems];
  const savedLook = params.saved ? saved.find((l) => l.id === params.saved) : undefined;
  const look =
    savedLook ??
    (params.items ? lookFromQuery(params.items, known, params.occasion) : undefined) ??
    getOutfitById(params.outfit) ??
    classLook;
  const initialModel = asModelStyle(params.model) ?? savedLook?.model ?? modelStyle ?? look.model ?? "feminine";

  // key: a new URL (or the stored closet arriving after hydration) starts a fresh fitting.
  return (
    <Fitting
      key={`${ready}|${JSON.stringify(params)}`}
      look={look}
      initialModel={initialModel}
      savedId={savedLook?.id ?? null}
    />
  );
}

function Fitting({ look, initialModel, savedId: initialSavedId }: { look: OutfitSuggestion; initialModel: ModelStyle; savedId: string | null }) {
  const store = useStore();
  const { closet, skinTone: skin } = store;
  const [style, setStyle] = useState<ModelStyle>(initialModel);
  const [items, setItems] = useState<OutfitItem[]>(() => sortBySlot(look.items));
  const [hideOuterwear, setHideOuterwear] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(initialSavedId);
  const [announcement, setAnnouncement] = useState("");

  const wearingDress = isDress(items.find((i) => i.slot === "Top")?.item);
  const hasOuterwear = items.some((i) => i.slot === "Outerwear");
  const onModel = items.filter((i) => !(hideOuterwear && i.slot === "Outerwear"));

  function swap(slot: LookSlot, step: 1 | -1) {
    const pool = closetFor(slot, closet);
    const current = items.find((i) => i.slot === slot)!.item;
    const at = pool.findIndex((p) => p.id === current.id);
    // A piece no longer in the closet: › goes to the first, ‹ to the last.
    const next = at < 0 ? pool[step > 0 ? 0 : pool.length - 1] : pool[(at + step + pool.length) % pool.length];
    setItems(items.map((i) => (i.slot === slot ? { slot, item: next } : i)));
    setSavedId(null);
    setAnnouncement(`${slot}: ${next.name}`);
  }

  function pickStyle(value: ModelStyle) {
    setStyle(value);
    store.setModelStyle(value);
  }

  // The look as worn: a bottom set aside under a dress isn't part of it.
  const worn = items.filter((i) => !(i.slot === "Bottom" && wearingDress));

  function toggleSave() {
    if (savedId) {
      store.deleteLook(savedId);
      setSavedId(null);
      setAnnouncement("Look removed from Saved");
    } else {
      setSavedId(store.saveLook({ ...look, items: worn, model: style }));
      setAnnouncement("Look saved");
    }
  }

  return (
    <div>
      <h1 className="text-[28px] font-black tracking-[-0.01em]">Fitting Room</h1>
      <p className="mt-1 mb-[18px] text-muted">See the look on your model and swap pieces from your closet.</p>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,520px)_1fr]">
        {/* Model stage */}
        <Card as="section" aria-labelledby="model-title" className="p-4 sm:px-5 sm:py-[18px]">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 id="model-title" className="mr-auto text-xl font-black">
              Your model
            </h2>
            <div role="group" aria-label="Model style" className="flex gap-2">
              {styles.map((s) => (
                <Pill key={s.value} size="sm" selected={style === s.value} onClick={() => pickStyle(s.value)}>
                  {s.label}
                </Pill>
              ))}
            </div>
            {hasOuterwear && (
              <Pill size="sm" selected={hideOuterwear} onClick={() => setHideOuterwear(!hideOuterwear)}>
                Hide outerwear
              </Pill>
            )}
          </div>

          <div className="flex justify-center rounded-[18px] border-[1.5px] border-track bg-cream px-2 pt-4">
            <Model
              style={style}
              skinTone={skin}
              outfit={toModelOutfit(onModel)}
              className="block h-auto w-full max-w-[300px]"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div role="radiogroup" aria-label="Skin tone" className="flex items-center gap-2">
              <span className="mr-1 text-sm font-bold" aria-hidden="true">
                Skin tone
              </span>
              {SKIN_TONES.map((tone, n) => (
                <button
                  key={tone}
                  type="button"
                  role="radio"
                  aria-checked={skin === tone}
                  aria-label={`Skin tone ${n + 1} of ${SKIN_TONES.length}`}
                  onClick={() => store.setSkinTone(tone)}
                  className={cx(
                    "h-[26px] w-[26px] rounded-full border-2 border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raspberry",
                    skin === tone && "ring-[3px] ring-mustard ring-offset-1 ring-offset-white",
                  )}
                  style={{ background: tone }}
                />
              ))}
            </div>
            <span className="text-[13px] text-muted sm:ml-auto">A drawing, not a photo of you</span>
          </div>
        </Card>

        {/* The look */}
        <Card as="section" aria-labelledby="look-title" className="p-4 sm:px-6 sm:py-[22px]">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="look-title" className="mr-1 text-xl font-black">
              Today&apos;s look
            </h2>
            <Tag>{look.occasion}</Tag>
            <Tag>
              <span aria-hidden="true">{weather.icon} </span>
              {weather.tempF}°F
            </Tag>
          </div>

          <ul className="mt-2 divide-y-[1.5px] divide-track border-b-[1.5px] border-track">
            {items.map(({ slot, item }) => {
              const setAside = slot === "Bottom" && wearingDress;
              const hidden = slot === "Outerwear" && hideOuterwear;
              const canSwap = closetFor(slot, closet).some((p) => p.id !== item.id);
              return (
                <li key={slot} className="flex items-center gap-3 py-2.5 sm:gap-4">
                  <div
                    className={cx(
                      "h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-ink sm:h-16 sm:w-16",
                      (setAside || hidden) && "opacity-40",
                    )}
                  >
                    <GarmentImage item={item} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold tracking-[0.06em] uppercase">{slot}</p>
                    <p className={cx("font-bold sm:text-base", (setAside || hidden) && "text-muted")}>{item.name}</p>
                    {setAside && <p className="text-[12.5px] text-muted">Not worn with a dress</p>}
                    {hidden && <p className="text-[12.5px] text-muted">Hidden on the model</p>}
                  </div>
                  {canSwap && (
                    <div className="flex shrink-0 gap-2">
                      {([-1, 1] as const).map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => swap(slot, step)}
                          aria-label={`${step < 0 ? "Previous" : "Next"} ${slot.toLowerCase()}`}
                          className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-white text-lg leading-none font-bold hover:bg-track focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raspberry"
                        >
                          <span aria-hidden="true">{step < 0 ? "‹" : "›"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>

          <Note className="mt-4">
            Swapping a piece re-checks the outfit rules: one top and bottom or a dress, one pair of shoes, up to two
            accessories.
          </Note>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={toggleSave} aria-pressed={savedId !== null}>
              {savedId ? "Saved ✓" : "Save look"}
            </Button>
            <Button variant="secondary" href={`/stylist?${lookToQuery({ ...look, items: worn }, style)}`}>
              Ask the stylist
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
