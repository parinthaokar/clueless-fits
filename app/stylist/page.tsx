"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import ChatBubble from "@/components/ChatBubble";
import Chips from "@/components/Chips";
import OutfitSuggestionCard from "@/components/OutfitSuggestionCard";
import { alternateOutfit, classOutfit, mockConversation, occasions } from "@/lib/mockData";
import type { ChatMessage, OutfitSuggestion } from "@/lib/types";

export default function StylistPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockConversation);
  const [outfit, setOutfit] = useState<OutfitSuggestion>(classOutfit);
  const [saved, setSaved] = useState(false);
  const [text, setText] = useState("");

  // Mock "AI": any request gets the class outfit, relabeled with the occasion.
  function ask(request: string, occasion = "Your look") {
    const suggestion = { ...classOutfit, id: classOutfit.id, occasion };
    setMessages([
      ...messages,
      { id: `u${messages.length}`, role: "user", text: request },
      { id: `a${messages.length}`, role: "assistant", text: "Here's what I'd wear!", suggestion },
    ]);
    setOutfit(suggestion);
    setSaved(false);
    setText("");
  }

  function showAnother() {
    setOutfit(outfit.id === alternateOutfit.id ? classOutfit : alternateOutfit);
    setSaved(false);
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Stylist</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Chat panel */}
        <section className="flex h-[560px] flex-col rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}
          </div>

          <div className="mt-3 border-t border-lilac pt-3">
            <Chips options={occasions} onSelect={(o) => ask(`What should I wear for ${o}?`, o)} />
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) ask(text);
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask your stylist..."
                className="min-w-0 flex-1 rounded-full border border-lavender px-4 py-2 outline-none focus:border-pink-deep"
              />
              <button
                aria-label="Send"
                className="rounded-full bg-pink-deep p-3 text-white"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </section>

        {/* Structured answer */}
        <OutfitSuggestionCard
          outfit={outfit}
          saved={saved}
          onSave={() => setSaved(true)}
          onShowAnother={showAnother}
        />
      </div>
    </div>
  );
}
