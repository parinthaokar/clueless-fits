"use client";

// Shared client store: closet items, saved looks (with ratings) and the chosen model style,
// skin tone and hair colour. Kept in localStorage so it survives reloads.
//
// - Starts from the mock data in lib/mockData.ts when storage is empty (or unreadable).
// - Every localStorage read and write is wrapped in try/catch: private windows, full quota
//   or blocked storage just mean the store lives in memory for this visit.
// - Built on useSyncExternalStore, so the server render and the first client render use the
//   mock data and React swaps in the stored data right after hydration (no mismatch).
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_HAIR, HAIR_COLORS, SKIN_TONES, type HairColor, type SkinTone } from "@/components/Model";
import { savedOutfits, wardrobeItems } from "./mockData";
import type { Appearance } from "./outfit";
import type { ClothingItem, ModelStyle, OutfitSuggestion, SavedOutfit } from "./types";

export interface StoreState {
  closet: ClothingItem[];
  saved: SavedOutfit[];
  /** null until the user picks a body in the Fitting Room; until then each look uses its own. */
  modelStyle: ModelStyle | null;
  skinTone: SkinTone;
  hairColor: HairColor;
  /** Which demo-closet additions this state has seen (see SEED_ADDITIONS). */
  seed: number;
}

const STORAGE_KEY = "clueless-closet:v1";

const initialState: StoreState = {
  closet: wardrobeItems,
  saved: savedOutfits,
  modelStyle: null,
  skinTone: SKIN_TONES[2],
  hairColor: DEFAULT_HAIR,
  seed: 2,
};

// Demo pieces added after people may already have a stored closet. Each is added once to a
// stored closet that predates it, so a piece the user later removes stays removed.
const SEED_ADDITIONS: { seed: number; ids: string[] }[] = [
  { seed: 2, ids: ["i25", "i26", "i27"] }, // v6 grey suit and tortoiseshell glasses
];

function withSeedAdditions(closet: ClothingItem[], seenSeed: number) {
  const ids = SEED_ADDITIONS.filter((a) => a.seed > seenSeed).flatMap((a) => a.ids);
  const missing = wardrobeItems.filter((i) => ids.includes(i.id) && !closet.some((c) => c.id === i.id));
  return [...closet, ...missing];
}

// ---- storage -------------------------------------------------------------------------------

const isModelStyle = (v: unknown): v is ModelStyle => v === "feminine" || v === "masculine";
const isSkinTone = (v: unknown): v is SkinTone => SKIN_TONES.includes(v as SkinTone);
const isHairColor = (v: unknown): v is HairColor => HAIR_COLORS.some((h) => h.id === v);

// Blob URLs from an earlier visit point at nothing, so drop them (the drawing is used instead).
const withLivePhoto = (item: ClothingItem): ClothingItem =>
  item.photoUrl?.startsWith("blob:") ? { ...item, photoUrl: undefined } : item;

/** Use what's stored field by field; anything missing or malformed falls back to the mock data. */
function parse(raw: string | null): StoreState {
  if (!raw) return initialState;
  const data = JSON.parse(raw) as Partial<StoreState>;
  const seen = typeof data.seed === "number" ? data.seed : 1;
  return {
    closet: Array.isArray(data.closet)
      ? withSeedAdditions(data.closet.map(withLivePhoto), seen)
      : initialState.closet,
    saved: Array.isArray(data.saved)
      ? data.saved.map((look) => ({ ...look, items: look.items.map((i) => ({ ...i, item: withLivePhoto(i.item) })) }))
      : initialState.saved,
    modelStyle: isModelStyle(data.modelStyle) ? data.modelStyle : null,
    skinTone: isSkinTone(data.skinTone) ? data.skinTone : initialState.skinTone,
    hairColor: isHairColor(data.hairColor) ? data.hairColor : initialState.hairColor,
    seed: initialState.seed,
  };
}

function load(): StoreState {
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return initialState;
  }
}

const stripPhotos = (state: StoreState): StoreState => ({
  ...state,
  closet: state.closet.map((i) => ({ ...i, photoUrl: undefined })),
  saved: state.saved.map((l) => ({ ...l, items: l.items.map((i) => ({ ...i, item: { ...i.item, photoUrl: undefined } })) })),
});

function persist(state: StoreState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Most likely the quota: photos are the big part, so try once more without them.
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stripPhotos(state)));
    } catch {
      // Storage unavailable; keep going in memory.
    }
  }
}

// ---- external store --------------------------------------------------------------------------

let state: StoreState | null = null; // loaded lazily on the client
const listeners = new Set<() => void>();

const getSnapshot = () => (state ??= load());
const getServerSnapshot = () => initialState;

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the store: reload it here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY && e.key !== null) return;
    state = load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function update(change: (s: StoreState) => StoreState) {
  state = change(getSnapshot());
  persist(state);
  listeners.forEach((l) => l());
}

const today = () => new Date().toISOString().slice(0, 10);

const actions = {
  addItem: (item: ClothingItem) => update((s) => ({ ...s, closet: [item, ...s.closet] })),
  removeItem: (id: string) => update((s) => ({ ...s, closet: s.closet.filter((i) => i.id !== id) })),

  /** Saves a look and returns its id. */
  saveLook(look: Pick<OutfitSuggestion, "occasion" | "items" | "why" | "closetGap" | "model">, rating = 0) {
    const saved: SavedOutfit = {
      id: `look-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      occasion: look.occasion,
      items: look.items,
      why: look.why,
      closetGap: look.closetGap,
      model: look.model,
      savedAt: today(),
      rating,
    };
    update((s) => ({ ...s, saved: [saved, ...s.saved] }));
    return saved.id;
  },
  rateLook: (id: string, rating: number) =>
    update((s) => ({ ...s, saved: s.saved.map((l) => (l.id === id ? { ...l, rating } : l)) })),
  deleteLook: (id: string) => update((s) => ({ ...s, saved: s.saved.filter((l) => l.id !== id) })),

  setModelStyle: (modelStyle: ModelStyle) => update((s) => ({ ...s, modelStyle })),
  setSkinTone: (skinTone: SkinTone) => update((s) => ({ ...s, skinTone })),
  setHairColor: (hairColor: HairColor) => update((s) => ({ ...s, hairColor })),
};

// ---- React -----------------------------------------------------------------------------------

type Store = StoreState & typeof actions & { /** true once the stored data (not the server's mock data) is showing */ ready: boolean };

const StoreContext = createContext<Store | null>(null);

const noopSubscribe = () => () => {};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const value = useMemo(() => ({ ...snapshot, ...actions, ready }), [snapshot, ready]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>");
  return store;
}

/**
 * A skin tone / hair colour handed over in the URL (Stylist ⇄ Fitting Room, Saved) becomes the
 * stored choice, so every page shows the same model. Runs once the stored data has loaded.
 */
export function useAdoptAppearance({ skin, hair }: Appearance) {
  const { ready } = useStore();
  useEffect(() => {
    if (!ready) return;
    const current = getSnapshot();
    if (skin && skin !== current.skinTone) actions.setSkinTone(skin);
    if (hair && hair !== current.hairColor) actions.setHairColor(hair);
  }, [ready, skin, hair]);
}
