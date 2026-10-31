import type { ChatMessage } from "@/lib/types";

// A plain text block with a small label, not a chat bubble.
export default function MessageBlock({ message }: { message: ChatMessage }) {
  return (
    <div className="fade-in">
      <p className="label">{message.role === "user" ? "You" : "Stylist"}</p>
      <p className="mt-1 text-sm leading-relaxed">{message.text}</p>
    </div>
  );
}
