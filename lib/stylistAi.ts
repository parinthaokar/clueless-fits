// The AI stylist: the shapes sent to and returned by app/api/stylist/route.ts (which calls
// Gemini), and the client call. The Gemini key stays on the server (GEMINI_API_KEY).
import type { HairColor, SkinTone } from "@/components/Model";
import type { ClothingItem, ModelStyle } from "./types";

export interface StylistTurn {
  role: "user" | "assistant";
  text: string;
}

export interface StylistRequest {
  messages: StylistTurn[]; // the conversation so far, ending with the user's new message
  closet: Pick<ClothingItem, "id" | "name" | "category" | "kind" | "color" | "pattern" | "description">[];
  currentLook: { occasion: string; itemIds: string[] };
  appearance: { model: ModelStyle; skinTone: SkinTone; hairColor: HairColor };
  weather: { tempF: number; summary: string; city: string };
}

export interface StylistReply {
  reply: string;
  /** A new or edited look, built only from closet item ids. */
  look?: { occasion: string; itemIds: string[]; why: string; closetGap?: string };
  /** Changes to the model's style; only the fields the user asked to change. */
  appearance?: { model?: ModelStyle; skinTone?: SkinTone; hairColor?: HairColor };
}

export class StylistError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "StylistError";
  }
}

// Longer than the server's own limit (two models × 25 s), so the server's message wins when it can.
const TIMEOUT_MS = 60_000;

export async function askStylist(body: StylistRequest): Promise<StylistReply> {
  let res: Response;
  let data: { error?: string } | null;
  try {
    res = await fetch("/api/stylist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    data = await res.json().catch(() => null);
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new StylistError("The stylist took too long to answer. Try again in a minute.");
    }
    throw new StylistError("I couldn't reach the stylist. Check that the site is still running and try again.");
  }
  if (!res.ok) throw new StylistError(data?.error ?? "Something went wrong.", res.status);
  return data as StylistReply;
}
