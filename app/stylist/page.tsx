"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import LookPanel from "@/components/LookPanel";
import MessageBlock from "@/components/MessageBlock";
import OccasionPills from "@/components/OccasionPills";
import TypingIndicator from "@/components/TypingIndicator";
import { classLook, mockConversation, occasions } from "@/lib/mockData";
import type { ChatMessage, OutfitSuggestion } from "@/lib/types";

export default function StylistPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockConversation);
  const [outfit, setOutfit] = useState<OutfitSuggestion>(classLook);
  const [saved, setSaved] = useState(false);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);

  const [lastQuery, setLastQuery] = useState("");
  const [variant, setVariant] = useState(0);

  async function fetchOutfit(query: string, v: number): Promise<OutfitSuggestion> {
    const res = await fetch("/api/outfit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variant: v }),
    });
    if (!res.ok) throw new Error("outfit request failed");
    return res.json();
  }

  // Real recommender: the request goes to /api/outfit, which calls the Modal model.
  async function ask(request: string, occasion?: string) {
    if (thinking) return;
    setMessages((prev) => [...prev, { id: `u${prev.length}`, role: "user", text: request }]);
    setText("");
    setThinking(true);
    try {
      const suggestion = await fetchOutfit(request, 0);
      if (occasion) suggestion.occasion = occasion;
      setMessages((prev) => [
        ...prev,
        { id: `a${prev.length}`, role: "assistant", text: "Here is what I would wear.", suggestion },
      ]);
      setOutfit(suggestion);
      setLastQuery(request);
      setVariant(0);
      setSaved(false);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a${prev.length}`, role: "assistant", text: "Sorry, I could not reach the stylist. Try again in a moment." },
      ]);
    } finally {
      setThinking(false);
    }
  }

  async function anotherLook() {
    if (!lastQuery || thinking) return;
    setThinking(true);
    try {
      const next = variant + 1;
      setOutfit(await fetchOutfit(lastQuery, next));
      setVariant(next);
      setSaved(false);
    } catch {
      /* keep the current look */
    } finally {
      setThinking(false);
    }
  }

  return (
    <div>
      <p className="label flex items-center gap-2 text-accent">
        <Sparkles size={14} strokeWidth={1.5} /> AI Stylist
      </p>
      <h1 className="mt-3 font-serif text-5xl sm:text-6xl">Styled for You</h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Conversation */}
        <section className="flex flex-col">
          <div className="max-h-[420px] min-h-[260px] flex-1 space-y-6 overflow-y-auto pr-2">
            {messages.map((m) => (
              <MessageBlock key={m.id} message={m} />
            ))}
            {thinking && <TypingIndicator />}
          </div>

          <div className="mt-8">
            <OccasionPills options={occasions} onSelect={(o) => ask(`What should I wear for ${o.toLowerCase()}?`, o)} />
            <form
              className="mt-6 flex items-end gap-4 rounded-full border border-line px-5 transition-colors focus-within:border-accent"
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) ask(text);
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe the occasion"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted"
              />
              <button className="label py-3 text-accent">Send</button>
            </form>
          </div>
        </section>

        {/* The look */}
        <LookPanel
          outfit={outfit}
          saved={saved}
          onSave={() => setSaved(true)}
          onAnother={anotherLook}
        />
      </div>
    </div>
  );
}
