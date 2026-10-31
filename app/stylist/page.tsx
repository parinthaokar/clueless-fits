"use client";

import { useState } from "react";
import LookPanel from "@/components/LookPanel";
import MessageBlock from "@/components/MessageBlock";
import OccasionPills from "@/components/OccasionPills";
import { alternateLook, classLook, mockConversation, occasions } from "@/lib/mockData";
import type { ChatMessage, OutfitSuggestion } from "@/lib/types";

export default function StylistPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockConversation);
  const [outfit, setOutfit] = useState<OutfitSuggestion>(classLook);
  const [saved, setSaved] = useState(false);
  const [text, setText] = useState("");

  // Mock "AI": any request gets the class look, relabeled with the occasion.
  function ask(request: string, occasion = "Styled for you") {
    const suggestion = { ...classLook, occasion };
    setMessages([
      ...messages,
      { id: `u${messages.length}`, role: "user", text: request },
      { id: `a${messages.length}`, role: "assistant", text: "Here is what I would wear.", suggestion },
    ]);
    setOutfit(suggestion);
    setSaved(false);
    setText("");
  }

  function anotherLook() {
    setOutfit(outfit.id === alternateLook.id ? classLook : alternateLook);
    setSaved(false);
  }

  return (
    <div>
      <h1 className="font-serif text-5xl sm:text-6xl">Styled for You</h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Conversation */}
        <section className="flex flex-col">
          <div className="max-h-[420px] min-h-[260px] flex-1 space-y-6 overflow-y-auto pr-2">
            {messages.map((m) => (
              <MessageBlock key={m.id} message={m} />
            ))}
          </div>

          <div className="mt-8">
            <OccasionPills options={occasions} onSelect={(o) => ask(`What should I wear for ${o.toLowerCase()}?`, o)} />
            <form
              className="mt-6 flex items-end gap-4 border-b border-ink"
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
              <button className="label py-3 text-ink">Send</button>
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
