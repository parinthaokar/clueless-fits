import type { ChatMessage } from "@/lib/types";

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
          isUser ? "rounded-br-sm bg-pink" : "rounded-bl-sm bg-lilac"
        }`}
      >
        {message.text}
      </p>
    </div>
  );
}
