"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCw } from "lucide-react";
import CatalogPicks from "@/components/CatalogPicks";
import GarmentImage from "@/components/GarmentImage";
import Model from "@/components/Model";
import { Button, Card, Pill, RatingDots, Tag, Warn } from "@/components/ui";
import { looksByOccasion, occasions, wardrobeItems, weather } from "@/lib/mockData";
import { appearanceFromQuery, lookFromQuery, lookToQuery, sortBySlot, toModelOutfit } from "@/lib/outfit";
import { useAdoptAppearance, useStore } from "@/lib/store";
import { askStylist, type StylistReply } from "@/lib/stylistAi";
import type { ChatMessage, ModelStyle, OutfitSuggestion } from "@/lib/types";
import type { HairColor, SkinTone } from "@/components/Model";

// design/screens/4_stylist.png. The chat goes to the AI stylist (Gemini, via app/api/stylist),
// which can build a look from the closet, edit the current one, and change the model's body,
// skin tone and hair colour. If the AI can't answer (e.g. no key), the occasion pills and
// Shuffle fall back to the mock looks in lib/mockData.ts (looksByOccasion).
// "Ask the stylist" in the Fitting Room comes back here with that look in the URL.
export type StylistParams = { items?: string; occasion?: string; model?: string; skin?: string; hair?: string };

const lookFor = (occasion: string, index: number): OutfitSuggestion => {
  const pool = looksByOccasion[occasion];
  return { ...pool[index % pool.length], occasion };
};

let messageCount = 0;
const newId = () => `chat-${++messageCount}`;

const FROM_FITTING_ROOM =
  "you put this together in the Fitting Room. Pick an occasion or hit Shuffle and I'll suggest something else.";

export default function StylistView({ params }: { params: StylistParams }) {
  const store = useStore();
  // Skin tone and hair colour come from the store; one handed over in the URL is adopted into it.
  const appearance = appearanceFromQuery(params.skin, params.hair);
  useAdoptAppearance(appearance);
  // Style changes made in the chat win over the URL (and are saved to the store too).
  const [styleEdits, setStyleEdits] = useState<{ model?: ModelStyle; skin?: SkinTone; hair?: HairColor }>({});
  const skin = styleEdits.skin ?? appearance.skin ?? store.skinTone;
  const hair = styleEdits.hair ?? appearance.hair ?? store.hairColor;
  const [occasion, setOccasion] = useState(
    params.occasion && occasions.includes(params.occasion) ? params.occasion : "Work",
  );
  const [index, setIndex] = useState(0);
  const [showFittingRoomLook, setShowFittingRoomLook] = useState(!!params.items);
  // Only what's actually said in the chat; the greeting above it is static and never sent to Gemini.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  // The AI's latest look, as closet ids; resolved against the closet on every render.
  const [aiLook, setAiLook] = useState<NonNullable<StylistReply["look"]> | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  // The Fitting Room look is derived (not copied into state) so pieces from the stored closet
  // resolve once the store has loaded. Stylist suggestions use the demo closet, so check it too.
  const fittingRoomLook =
    showFittingRoomLook && params.items
      ? lookFromQuery(params.items, [...store.closet, ...wardrobeItems], params.occasion)
      : undefined;
  const fromAi = aiLook ? lookFromQuery(aiLook.itemIds.join(","), store.closet, aiLook.occasion) : undefined;
  const look: OutfitSuggestion =
    fromAi && aiLook
      ? { ...fromAi, id: "ai", why: aiLook.why, closetGap: aiLook.closetGap }
      : fittingRoomLook
        ? { ...fittingRoomLook, why: FROM_FITTING_ROOM }
        : lookFor(occasion, index);

  // The body the user picked (URL from the Fitting Room, then the store) wins over the look's
  // own, so Shuffle and occasion changes never flip it.
  const pickedModel = params.model === "feminine" || params.model === "masculine" ? params.model : store.modelStyle;
  const model = styleEdits.model ?? pickedModel ?? look.model ?? "feminine";

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function showLook(nextOccasion: string, nextIndex: number) {
    setOccasion(nextOccasion);
    setIndex(nextIndex);
    setShowFittingRoomLook(false);
    setAiLook(null);
    resetSave();
  }

  function resetSave() {
    setSavedId(null);
    setRating(0);
  }

  function toggleSave() {
    if (savedId) {
      store.deleteLook(savedId);
      setSavedId(null);
    } else {
      setSavedId(store.saveLook({ ...look, model }, rating));
    }
  }

  // A rating given after saving updates the saved look; one given before is saved with it.
  function rate(value: number) {
    setRating(value);
    if (savedId) store.rateLook(savedId, value);
  }

  /** Sends a message to the AI stylist. `fallback` shows a mock look if the AI can't answer. */
  async function send(userText: string, fallback?: () => void) {
    if (thinking) return;
    const history: ChatMessage[] = [...messages, { id: newId(), role: "user", text: userText }];
    setMessages(history);
    setThinking(true);
    let reply: string;
    try {
      const res = await askStylist({
        messages: history.map(({ role, text }) => ({ role, text })),
        closet: store.closet.map(({ id, name, category, kind, color, pattern, description }) => ({
          id,
          name,
          category,
          kind,
          color,
          pattern,
          description,
        })),
        currentLook: { occasion: look.occasion, itemIds: look.items.map((i) => i.item.id) },
        appearance: { model, skinTone: skin, hairColor: hair },
        weather,
      });
      reply = res.reply;
      if (res.look) {
        setAiLook(res.look);
        setShowFittingRoomLook(false);
        if (occasions.includes(res.look.occasion)) setOccasion(res.look.occasion);
        resetSave();
      }
      if (res.appearance) {
        const { model: m, skinTone: s, hairColor: h } = res.appearance;
        setStyleEdits((e) => ({ model: m ?? e.model, skin: s ?? e.skin, hair: h ?? e.hair }));
        if (m) store.setModelStyle(m);
        if (s) store.setSkinTone(s);
        if (h) store.setHairColor(h);
      }
    } catch (err) {
      reply = err instanceof Error ? err.message : "Something went wrong.";
      if (fallback) {
        fallback();
        reply += " Here's one from my notes instead →";
      }
    }
    setMessages((m) => [...m, { id: newId(), role: "assistant", text: reply }]);
    setThinking(false);
  }

  function pickOccasion(o: string) {
    void send(`What should I wear for ${o.toLowerCase()}?`, () => showLook(o, 0));
  }

  function shuffle() {
    void send("Show me a different option for this occasion.", () =>
      showLook(occasion, fittingRoomLook || aiLook ? index : index + 1),
    );
  }

  function askForChange(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || thinking) return;
    void send(text.trim());
    setText("");
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[340px_1fr] lg:gap-[26px]">
      {/* Conversation */}
      <section aria-labelledby="stylist-title">
        <h1 id="stylist-title" className="text-[28px] font-black tracking-[-0.01em]">
          Stylist
        </h1>
        <p className="mt-1 text-muted">Tell me where you&apos;re going.</p>

        <div role="group" aria-label="Occasion" className="mt-3 flex flex-wrap gap-2">
          {occasions.map((o) => (
            <Pill key={o} size="sm" selected={o === occasion} onClick={() => pickOccasion(o)}>
              {o}
            </Pill>
          ))}
        </div>

        <div
          ref={chatRef}
          role="log"
          aria-busy={thinking}
          aria-label="Conversation with the stylist"
          className="mt-5 flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-1"
        >
          <p className="mr-auto max-w-[300px] rounded-2xl border-2 border-ink bg-white px-4 py-2.5 text-[15px] leading-snug">
            <span className="sr-only">Stylist: </span>
            {params.items
              ? "Here's the look you put together in the Fitting Room. Ask me to tweak it, or rate it and save it →"
              : `It's ${weather.tempF}°F and ${weather.summary}. Pick an occasion or ask me for a look, a swap, or a new hair colour.`}
          </p>
          {messages.map((m) =>
            m.role === "user" ? (
              <p
                key={m.id}
                className="ml-auto max-w-[290px] rounded-2xl bg-ink px-4 py-2.5 text-[15px] leading-snug text-white"
              >
                <span className="sr-only">You: </span>
                {m.text}
              </p>
            ) : (
              <p
                key={m.id}
                className="mr-auto max-w-[300px] rounded-2xl border-2 border-ink bg-white px-4 py-2.5 text-[15px] leading-snug"
              >
                <span className="sr-only">Stylist: </span>
                {m.text}
              </p>
            ),
          )}
          {thinking && (
            <p className="mr-auto rounded-2xl border-2 border-ink bg-white px-4 py-2.5 text-[15px] text-muted">
              <span className="sr-only">Stylist is </span>thinking…
            </p>
          )}
        </div>

        <form
          onSubmit={askForChange}
          className="mt-5 flex items-center rounded-full border-2 border-ink bg-white pr-2 pl-5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-raspberry"
        >
          <label htmlFor="ask" className="sr-only">
            Ask the stylist for a change
          </label>
          <input
            id="ask"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask for a look, a swap, new hair..."
            className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={thinking}
            className="rounded-full px-3 py-2 font-extrabold text-raspberry hover:bg-note-pink disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </section>

      {/* Today's look */}
      <Card as="section" aria-labelledby="look-title" className="p-5 sm:px-6 sm:py-[22px]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="look-title" className="mr-1 text-[22px] font-black tracking-[-0.01em]">
            Today&apos;s look
          </h2>
          <Tag>{look.occasion}</Tag>
          <Tag>
            <span aria-hidden="true">{weather.icon} </span>
            {weather.tempF}°F
          </Tag>
          <Pill size="sm" className="ml-auto" onClick={shuffle}>
            <RotateCw size={14} aria-hidden="true" /> Shuffle
          </Pill>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[200px_1fr]">
          <div className="mx-auto flex w-full max-w-[220px] flex-col self-start items-center rounded-[18px] border-[1.5px] border-track bg-gradient-to-b from-white via-cream to-note-pink/40 px-2 pt-4 pb-3 md:max-w-none">
            <Model style={model} skinTone={skin} hairColor={hair} outfit={toModelOutfit(look.items)} className="block h-auto w-full max-w-[190px] drop-shadow-[0_6px_8px_rgba(0,0,0,0.08)]" />
            <Tag className="mt-1 bg-white">On your model</Tag>
          </div>

          <ul className="grid grid-cols-2 content-start gap-4 sm:grid-cols-3">
            {sortBySlot(look.items).map(({ slot, item }) => (
              <li key={slot} className="text-center">
                <Card size="sm" className="p-1.5">
                  <div className="aspect-square overflow-hidden rounded-[10px] bg-white">
                    <GarmentImage item={item} />
                  </div>
                </Card>
                <p className="mt-2.5 text-[11px] font-extrabold tracking-[0.06em] uppercase">{slot}</p>
                <p className="text-[13px] text-muted">{item.name}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-[15px] leading-relaxed">
          <strong className="font-bold">Why it works:</strong> {look.why}
        </p>
        {look.closetGap && (
          <Warn title="Closet gap:" className="mt-3">
            {look.closetGap}
          </Warn>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={toggleSave} aria-pressed={savedId !== null}>
            {savedId ? "Saved ✓" : "Save look"}
          </Button>
          <Button variant="secondary" href={`/fitting-room?${lookToQuery(look, model, { skin, hair })}`}>
            Open in Fitting Room
          </Button>
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-sm text-muted">Rate it:</span>
            <RatingDots value={rating} onChange={rate} label="Rate this look" />
          </div>
        </div>
      </Card>

      <div className="lg:col-span-2">
        <CatalogPicks occasion={look.occasion} />
      </div>
    </div>
  );
}
