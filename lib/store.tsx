"use client";

// Shared client store: closet items, saved looks (with ratings) and the chosen model style,
// skin tone and hair colour.
//
// Signed out (or Supabase not configured): kept in localStorage so it survives reloads.
// - Starts from the mock data in lib/mockData.ts when storage is empty (or unreadable).
// - Every localStorage read and write is wrapped in try/catch: private windows, full quota
//   or blocked storage just mean the store lives in memory for this visit.
// Signed in: loaded from Supabase (api/supabase_schema.sql) and every change is written back.
// - Changes show at once and are written in order in the background; if a write fails the
//   store reloads from Supabase so it never shows something that wasn't saved.
// - The signed-in closet starts empty: the demo closet is only for signed-out visitors.
//
// Built on useSyncExternalStore, so the server render and the first client render use the
// mock data and React swaps in the stored data right after hydration (no mismatch).
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_HAIR, HAIR_COLORS, SKIN_TONES, type HairColor, type SkinTone } from "@/components/Model";
import { savedOutfits, wardrobeItems } from "./mockData";
import type { Appearance } from "./outfit";
import { fromSignInLink, PHOTO_BUCKET, supabase } from "./supabase";
import type { Category, ClothingItem, GarmentKind, LookSlot, ModelStyle, OutfitItem, OutfitSuggestion, Pattern, SavedOutfit } from "./types";
import type { ColorName } from "./colors";

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

// ---- Supabase --------------------------------------------------------------------------------

/** off = Supabase not configured; checking = reading the saved session; loading = fetching the user's data. */
export type AccountStatus = "off" | "checking" | "signedOut" | "loading" | "signedIn";
export interface Account {
  status: AccountStatus;
  email: string | null;
  /** Why the last sign-in link didn't work, shown on /sign-in. */
  linkError: string | null;
}

// A failed sign-in link sends the user to /sign-in#link-failed (see startAuth).
const LINK_FAILED = "#link-failed";
const LINK_FAILED_MESSAGE =
  "That sign-in link didn't work. Links expire after an hour and only work in the browser you asked for them in. Send yourself a new one.";
const linkFailed = typeof window !== "undefined" && window.location.hash === LINK_FAILED;
if (linkFailed) window.history.replaceState(null, "", window.location.pathname + window.location.search);

let account: Account = {
  status: supabase ? "checking" : "off",
  email: null,
  linkError: linkFailed ? LINK_FAILED_MESSAGE : null,
};
let userId: string | null = null;
const photoPaths = new Map<string, string>(); // closet item id → path in the photo bucket

const signedIn = () => userId !== null;
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const PHOTO_URL_SECONDS = 60 * 60 * 24 * 7;

interface ItemRow {
  id: string;
  name: string;
  category: Category;
  kind: GarmentKind;
  color: ColorName;
  pattern: Pattern;
  description: string | null;
  photo_path: string | null;
  added_at: string;
}
interface LookRow {
  id: string;
  occasion: string;
  why: string;
  closet_gap: string | null;
  model: ModelStyle | null;
  rating: number;
  saved_at: string;
  saved_outfit_items: { position: number; slot: LookSlot; item_id: string | null; item: ClothingItem }[];
}

async function fetchRemote(): Promise<StoreState> {
  const db = supabase!;
  const [items, looks, settings] = await Promise.all([
    db.from("wardrobe_items").select("*").order("added_at", { ascending: false }).order("created_at", { ascending: false }),
    db.from("saved_outfits").select("*, saved_outfit_items(*)").order("saved_at", { ascending: false }).order("created_at", { ascending: false }),
    db.from("user_settings").select("*").maybeSingle(),
  ]);
  const error = items.error ?? looks.error ?? settings.error;
  if (error) throw error;

  const itemRows = items.data as ItemRow[];
  photoPaths.clear();
  for (const row of itemRows) if (row.photo_path) photoPaths.set(row.id, row.photo_path);
  const signedUrls = new Map<string, string>();
  if (photoPaths.size > 0) {
    const { data } = await db.storage.from(PHOTO_BUCKET).createSignedUrls([...photoPaths.values()], PHOTO_URL_SECONDS);
    for (const { path, signedUrl } of data ?? []) if (path && signedUrl) signedUrls.set(path, signedUrl);
  }

  const closet: ClothingItem[] = itemRows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    kind: row.kind,
    color: row.color,
    pattern: row.pattern,
    description: row.description ?? undefined,
    photoUrl: row.photo_path ? signedUrls.get(row.photo_path) : undefined,
    addedAt: row.added_at,
  }));
  const byId = new Map(closet.map((i) => [i.id, i]));

  // A piece still in the closet shows as it is now (with its photo); otherwise the saved copy.
  const saved: SavedOutfit[] = (looks.data as LookRow[]).map((row) => ({
    id: row.id,
    occasion: row.occasion,
    why: row.why,
    closetGap: row.closet_gap ?? undefined,
    model: row.model ?? undefined,
    savedAt: row.saved_at,
    rating: row.rating,
    items: [...row.saved_outfit_items]
      .sort((a, b) => a.position - b.position)
      .map((p) => ({ slot: p.slot, item: (p.item_id && byId.get(p.item_id)) || p.item })),
  }));

  const s = settings.data;
  return {
    closet,
    saved,
    modelStyle: isModelStyle(s?.model_style) ? s.model_style : null,
    skinTone: isSkinTone(s?.skin_tone) ? s.skin_tone : initialState.skinTone,
    hairColor: isHairColor(s?.hair_color) ? s.hair_color : initialState.hairColor,
    seed: initialState.seed,
  };
}

// Writes run one at a time, in order, so e.g. rating a look can't reach Supabase before the look.
let writes: Promise<void> = Promise.resolve();

function write(op: (db: NonNullable<typeof supabase>) => Promise<void>) {
  const forUser = userId;
  writes = writes
    .then(() => (userId === forUser ? op(supabase!) : undefined))
    .catch(async (err) => {
      console.error("[store] Supabase write failed; reloading", err);
      if (userId === forUser) await loadRemote();
    });
}

/** Throws a Supabase error so write() can catch it. */
function check<T extends { error: unknown }>(result: T): T {
  if (result.error) throw result.error;
  return result;
}

async function uploadPhoto(db: NonNullable<typeof supabase>, itemId: string, photoUrl: string) {
  const blob = await (await fetch(photoUrl)).blob();
  const path = `${userId}/${itemId}.jpg`;
  check(await db.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true }));
  return path;
}

// Saved copies leave out photos: data URLs are large and signed URLs expire.
const snapshotItem = ({ photoUrl: _photo, ...item }: ClothingItem) => item; // eslint-disable-line @typescript-eslint/no-unused-vars

function saveSettings() {
  const s = getSnapshot();
  write(async (db) => {
    check(
      await db.from("user_settings").upsert({
        user_id: userId,
        model_style: s.modelStyle,
        skin_tone: s.skinTone,
        hair_color: s.hairColor,
        updated_at: new Date().toISOString(),
      }),
    );
  });
}

function setAccount(next: Account) {
  account = next;
  notify();
}

async function loadRemote() {
  const forUser = userId;
  try {
    const remote = await fetchRemote();
    if (userId !== forUser) return; // signed out or switched users meanwhile
    state = remote;
    setAccount({ ...account, status: "signedIn" });
  } catch (err) {
    console.error("[store] Couldn't load from Supabase", err);
    if (userId === forUser) setAccount({ ...account, status: "signedIn" });
  }
}

let authStarted = false;

function startAuth() {
  if (authStarted || !supabase) return;
  authStarted = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    // Supabase calls made inside this callback can deadlock, so act on it just after.
    setTimeout(() => {
      const user = session?.user ?? null;
      if (user && user.id === userId) return; // token refresh etc.
      userId = user?.id ?? null;
      if (!user) {
        photoPaths.clear();
        state = load();
        setAccount({ ...account, status: "signedOut", email: null });
        return;
      }
      // Keep the look of the model while the closet loads; show no demo pieces.
      state = { ...getSnapshot(), closet: [], saved: [] };
      setAccount({ status: "loading", email: user.email ?? null, linkError: null });
      void loadRemote();
    }, 0);
  });

  // Back from a sign-in link: once Supabase has used it, go to the wardrobe if it worked
  // (it may have landed on the landing page) or explain on /sign-in if it didn't.
  if (fromSignInLink) {
    const db = supabase;
    void db.auth.initialize().then(async () => {
      const { data } = await db.auth.getSession();
      if (data.session) {
        if (window.location.pathname === "/") window.location.replace("/wardrobe");
      } else {
        window.location.replace(`/sign-in${LINK_FAILED}`);
      }
    });
  }
}

// ---- external store --------------------------------------------------------------------------

let state: StoreState | null = null; // loaded lazily on the client
const listeners = new Set<() => void>();

const getSnapshot = () => (state ??= load());
const getServerSnapshot = () => initialState;
const getAccount = () => account;
const serverAccount: Account = { status: "off", email: null, linkError: null };
const getServerAccount = () => serverAccount;

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  startAuth();
  // Another tab changed the store: reload it here too (only the localStorage copy is shared).
  const onStorage = (e: StorageEvent) => {
    if (signedIn() || (e.key !== STORAGE_KEY && e.key !== null)) return;
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
  if (!signedIn()) persist(state);
  notify();
}

const today = () => new Date().toISOString().slice(0, 10);

const actions = {
  addItem(item: ClothingItem) {
    if (!signedIn()) return update((s) => ({ ...s, closet: [item, ...s.closet] }));
    const added = { ...item, id: crypto.randomUUID() };
    update((s) => ({ ...s, closet: [added, ...s.closet] }));
    write(async (db) => {
      let photoPath: string | null = null;
      if (added.photoUrl) {
        try {
          photoPath = await uploadPhoto(db, added.id, added.photoUrl);
          photoPaths.set(added.id, photoPath);
        } catch (err) {
          console.error("[store] Photo upload failed; saving the piece without it", err);
        }
      }
      check(
        await db.from("wardrobe_items").insert({
          id: added.id,
          name: added.name,
          category: added.category,
          kind: added.kind,
          color: added.color,
          pattern: added.pattern,
          description: added.description ?? null,
          photo_path: photoPath,
          added_at: added.addedAt,
        }),
      );
    });
  },
  removeItem(id: string) {
    update((s) => ({ ...s, closet: s.closet.filter((i) => i.id !== id) }));
    if (!signedIn()) return;
    write(async (db) => {
      check(await db.from("wardrobe_items").delete().eq("id", id));
      const path = photoPaths.get(id);
      if (path) {
        photoPaths.delete(id);
        await db.storage.from(PHOTO_BUCKET).remove([path]); // a leftover file is harmless
      }
    });
  },

  /** Saves a look and returns its id. */
  saveLook(look: Pick<OutfitSuggestion, "occasion" | "items" | "why" | "closetGap" | "model">, rating = 0) {
    const saved: SavedOutfit = {
      id: signedIn() ? crypto.randomUUID() : `look-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      occasion: look.occasion,
      items: look.items,
      why: look.why,
      closetGap: look.closetGap,
      model: look.model,
      savedAt: today(),
      rating,
    };
    update((s) => ({ ...s, saved: [saved, ...s.saved] }));
    if (signedIn()) {
      const closetIds = new Set(getSnapshot().closet.map((i) => i.id));
      write(async (db) => {
        check(
          await db.from("saved_outfits").insert({
            id: saved.id,
            occasion: saved.occasion,
            why: saved.why,
            closet_gap: saved.closetGap ?? null,
            model: saved.model ?? null,
            rating: saved.rating,
            saved_at: saved.savedAt,
          }),
        );
        if (saved.items.length === 0) return;
        check(
          await db.from("saved_outfit_items").insert(
            saved.items.map(({ slot, item }: OutfitItem, position) => ({
              outfit_id: saved.id,
              position,
              slot,
              item_id: isUuid(item.id) && closetIds.has(item.id) ? item.id : null,
              item: snapshotItem(item),
            })),
          ),
        );
      });
    }
    return saved.id;
  },
  rateLook(id: string, rating: number) {
    update((s) => ({ ...s, saved: s.saved.map((l) => (l.id === id ? { ...l, rating } : l)) }));
    if (signedIn()) write(async (db) => void check(await db.from("saved_outfits").update({ rating }).eq("id", id)));
  },
  deleteLook(id: string) {
    update((s) => ({ ...s, saved: s.saved.filter((l) => l.id !== id) }));
    if (signedIn()) write(async (db) => void check(await db.from("saved_outfits").delete().eq("id", id)));
  },

  setModelStyle(modelStyle: ModelStyle) {
    update((s) => ({ ...s, modelStyle }));
    if (signedIn()) saveSettings();
  },
  setSkinTone(skinTone: SkinTone) {
    update((s) => ({ ...s, skinTone }));
    if (signedIn()) saveSettings();
  },
  setHairColor(hairColor: HairColor) {
    update((s) => ({ ...s, hairColor }));
    if (signedIn()) saveSettings();
  },

  /** Emails a sign-in link that comes back to `next` (a path). Resolves to an error message or null. */
  async sendSignInLink(email: string, next = "/wardrobe"): Promise<string | null> {
    if (!supabase) return "Sign-in isn't set up for this site.";
    if (account.linkError) setAccount({ ...account, linkError: null });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${next}` },
    });
    return error ? error.message : null;
  },
  async signOut() {
    await supabase?.auth.signOut();
  },
};

// ---- React -----------------------------------------------------------------------------------

type Store = StoreState &
  typeof actions & {
    /** true once the stored data (not the server's mock data, or a closet still loading) is showing */
    ready: boolean;
    account: Account;
  };

const StoreContext = createContext<Store | null>(null);

const noopSubscribe = () => () => {};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const acct = useSyncExternalStore(subscribe, getAccount, getServerAccount);
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const ready = hydrated && acct.status !== "checking" && acct.status !== "loading";
  const value = useMemo(() => ({ ...snapshot, ...actions, ready, account: acct }), [snapshot, ready, acct]);
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
