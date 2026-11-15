"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCw } from "lucide-react";
import GarmentImage from "@/components/GarmentImage";
import Model, { SKIN_TONES } from "@/components/Model";
import { Button, Card, Pill, RatingDots, Tag, Warn } from "@/components/ui";
import { looksByOccasion, mockConversation, occasions, weather } from "@/lib/mockData";
import { lookToQuery, sortBySlot, toModelOutfit } from "@/lib/outfit";
import type { ChatMessage, OutfitSuggestion } from "@/lib/types";

// design/screens/4_stylist.png. The "AI" is mocked: each occasion has a short list of looks
// (lib/mockData.ts looksByOccasion) and Shuffle / "Ask for a change" step through it.
const lookFor = (occasion: string, index: number): OutfitSuggestion => {
  const pool = looksByOccasion[occasion];
  return { ...pool[index % pool.length], occasion };
};

export default function StylistPage() {
  const [occasion, setOccasion] = useState("Work");
  const [index, setIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>(mockConversation);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [rating, setRating] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  const look = lookFor(occasion, index);
  const model = look.model ?? "feminine";

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function showLook(nextOccasion: string, nextIndex: number) {
    setOccasion(nextOccasion);
    setIndex(nextIndex);
    setSaved(false);
    setRating(0);
  }

  function say(user: string, reply: string) {
    setMessages((m) => [
      ...m,
      { id: `u${m.length}`, role: "user", text: user },
      { id: `a${m.length}`, role: "assistant", text: reply },
    ]);
  }

  function pickOccasion(o: string) {
    showLook(o, 0);
    say(
      `What should I wear for ${o.toLowerCase()}?`,
      `It's ${weather.tempF}°F and ${weather.summary}. Here's a ${o.toLowerCase()} look →`,
    );
  }

  function askForChange(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    say(text.trim(), "Got it. Here's another option →");
    showLook(occasion, index + 1);
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
          aria-label="Conversation with the stylist"
          className="mt-5 flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-1"
        >
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
            placeholder="Ask for a change..."
            className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted"
          />
          <button type="submit" className="rounded-full px-3 py-2 font-extrabold text-raspberry hover:bg-note-pink">
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
          <Pill size="sm" className="ml-auto" onClick={() => showLook(occasion, index + 1)}>
            <RotateCw size={14} aria-hidden="true" /> Shuffle
          </Pill>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[200px_1fr]">
          <div className="mx-auto flex w-full max-w-[220px] flex-col self-start items-center rounded-[18px] border-[1.5px] border-track bg-cream px-2 pt-3 pb-2.5 md:max-w-none">
            <Model style={model} skinTone={SKIN_TONES[2]} outfit={toModelOutfit(look.items)} className="block h-auto w-full max-w-[180px]" />
            <Tag className="mt-1 bg-white">On your model</Tag>
          </div>

          <ul className="grid grid-cols-2 content-start gap-4 sm:grid-cols-3">
            {sortBySlot(look.items).map(({ slot, item }) => (
              <li key={slot} className="text-center">
                <Card size="sm" className="p-1.5">
                  <div className="aspect-square overflow-hidden rounded-[10px]">
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
          <Button onClick={() => setSaved(true)} aria-pressed={saved}>
            {saved ? "Saved ✓" : "Save look"}
          </Button>
          <Button variant="secondary" href={`/fitting-room?${lookToQuery(look, model)}`}>
            Open in Fitting Room
          </Button>
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-sm text-muted">Rate it:</span>
            <RatingDots value={rating} onChange={setRating} label="Rate this look" />
          </div>
        </div>
      </Card>
    </div>
  );
}
