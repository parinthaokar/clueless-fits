// POST /api/stylist: the AI stylist chat (lib/stylistAi.ts has the request and reply shapes).
// Calls Gemini on the server so GEMINI_API_KEY never reaches the browser. Gemini answers in
// JSON (responseSchema below): a reply, and optionally a look built from the user's closet
// and/or changes to the model's style. Item ids and style values are checked before returning.
import { HAIR_COLORS, SKIN_TONES } from "@/components/Model";
import { occasions } from "@/lib/mockData";
import type { StylistReply, StylistRequest } from "@/lib/stylistAi";

// Tried in order: a busy (503), rate-limited (429) or missing (404) model falls through to the
// next. The full flash models are often overloaded on the free tier; the lite one rarely is.
// GEMINI_MODEL can override this with a comma-separated list.
const MODELS = (process.env.GEMINI_MODEL || "gemini-flash-latest,gemini-flash-lite-latest")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const endpoint = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const RETRYABLE = new Set([404, 429, 500, 503, 504]);
const MODEL_TIMEOUT_MS = 25_000;
const MAX_TURNS = 20; // how much of the conversation is sent each time

// Skin tones by name for the model; SKIN_TONES runs light to deep.
const SKIN_NAMES = ["very light", "light", "medium", "tan", "deep"] as const;
const skinName = (hex: string) => SKIN_NAMES[SKIN_TONES.indexOf(hex as (typeof SKIN_TONES)[number])] ?? "medium";

const responseSchema = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING", description: "What the stylist says. Short, friendly, 1-3 sentences." },
    look: {
      type: "OBJECT",
      description: "Include only when suggesting a new outfit or changing the current one.",
      properties: {
        occasion: { type: "STRING" },
        itemIds: { type: "ARRAY", items: { type: "STRING" } },
        why: { type: "STRING", description: "One or two sentences on why the look works." },
        closetGap: { type: "STRING", description: "A piece the closet is missing for this, if any." },
      },
      required: ["occasion", "itemIds", "why"],
    },
    appearance: {
      type: "OBJECT",
      description: "Include only when the user asks to change the model's body, skin tone or hair colour.",
      properties: {
        model: { type: "STRING", enum: ["feminine", "masculine"] },
        skinTone: { type: "STRING", enum: [...SKIN_NAMES] },
        hairColor: { type: "STRING", enum: HAIR_COLORS.map((h) => h.id) },
      },
    },
  },
  required: ["reply"],
};

function systemPrompt(req: StylistRequest) {
  const closet = req.closet
    .map(
      (i) =>
        `- ${i.id}: ${i.name} (${i.category}, ${i.color}${i.pattern !== "solid" ? `, ${i.pattern}` : ""})` +
        (i.description ? ` — ${i.description}` : ""),
    )
    .join("\n");
  const current = req.currentLook.itemIds.length
    ? `${req.currentLook.occasion}: ${req.currentLook.itemIds.join(", ")}`
    : "none yet";
  const { model, skinTone, hairColor } = req.appearance;
  return `You are the AI stylist in "Clueless Closet", a playful outfit app inspired by the movie Clueless (think Cher's computerized closet). Be upbeat and a little fun, but keep replies short.

You can:
1. Create outfits: put together a look using ONLY item ids from the closet below. Never invent items.
2. Edit the current look: swap, add or remove pieces when asked; keep the pieces the user didn't ask to change.
3. Edit the model's style: body (feminine/masculine), skin tone, hair colour, when the user asks.

Outfit rules:
- At most one item per slot: Top, Bottom, Outerwear, Shoes, Bag, Belt (an Accessories item that is a belt), Accessory.
- A dress fills both Top and Bottom, so never pair a dress with a top or bottom.
- A full look normally has a top+bottom (or a dress) and shoes; outerwear, bag and accessories are optional.
- Dress for the weather and the occasion. If the closet lacks something important, say so in closetGap.
- When you return a look, list every item in it (not just the changed ones).
- If the user is only chatting or asking a question, reply without a look.

Today: ${req.weather.tempF}°F and ${req.weather.summary} in ${req.weather.city}.
Current look: ${current}
Current model: ${model} body, ${skinName(skinTone)} skin, ${hairColor} hair.

Closet (id: name (category, colour)):
${closet || "(empty — suggest they add pieces on the Wardrobe page)"}`;
}

const error = (message: string, status: number) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return error("The AI stylist isn't set up yet: add GEMINI_API_KEY to .env.local and restart the site.", 503);
  }

  let req: StylistRequest;
  try {
    req = await request.json();
    if (!Array.isArray(req.messages) || !Array.isArray(req.closet) || req.messages.length === 0) throw new Error();
  } catch {
    return error("Bad request.", 400);
  }

  const contents = req.messages.slice(-MAX_TURNS).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.text).slice(0, 2000) }],
  }));
  // Gemini wants the conversation to start with the user.
  while (contents.length && contents[0].role === "model") contents.shift();
  if (contents.length === 0) return error("Bad request.", 400);

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt(req) }] },
    contents,
    generationConfig: { responseMimeType: "application/json", responseSchema, temperature: 0.8 },
  });

  let res: Response | null = null;
  for (const model of MODELS) {
    try {
      res = await fetch(endpoint(model), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body,
        // An overloaded model sometimes stalls instead of answering 503; give up and try the next.
        signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
      });
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === "TimeoutError";
      console.error(`[stylist] Gemini ${model} ${timedOut ? "timed out" : "unreachable"}`, timedOut ? "" : err);
      res = null;
      continue;
    }
    if (res.ok) break;
    const detail = await res.text().catch(() => "");
    console.error(`[stylist] Gemini ${model} ${res.status}: ${detail.slice(0, 300)}`);
    if (!RETRYABLE.has(res.status)) break;
  }

  if (!res) return error("Gemini didn't answer in time. Try again in a minute.", 504);
  if (!res.ok) {
    const status = res.status;
    if (status === 429) return error("I've hit the free Gemini limit. Give me a minute and ask again.", 429);
    if (status === 400 || status === 401 || status === 403) {
      return error("Gemini rejected the request. Check GEMINI_API_KEY (and GEMINI_MODEL, if set) in .env.local.", 502);
    }
    if (status === 404) return error("None of the Gemini models in GEMINI_MODEL exist. Check .env.local.", 502);
    return error("Gemini is busy right now (Google's servers are overloaded). Try again in a minute.", 502);
  }

  let parsed: StylistReply;
  try {
    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    parsed = JSON.parse(text);
    if (typeof parsed.reply !== "string") throw new Error("no reply");
  } catch (err) {
    console.error("[stylist] Couldn't read Gemini's answer", err);
    return error("I got tongue-tied. Try asking that another way.", 502);
  }

  return Response.json(clean(parsed, req));
}

/** "dinner" → "Dinner", so the matching occasion pill lights up; anything else is kept as written. */
const matchOccasion = (o: string) => occasions.find((x) => x.toLowerCase() === o.trim().toLowerCase()) ?? o.slice(0, 40);

/** Keep only closet item ids and valid style values; map skin tone names back to colours. */
function clean(raw: StylistReply, req: StylistRequest): StylistReply {
  const out: StylistReply = { reply: raw.reply.trim() || "Here you go!" };

  if (raw.look && Array.isArray(raw.look.itemIds)) {
    const ids = new Set(req.closet.map((i) => i.id));
    const itemIds = [...new Set(raw.look.itemIds.filter((id) => ids.has(id)))];
    if (itemIds.length > 0) {
      out.look = {
        occasion: matchOccasion(String(raw.look.occasion || req.currentLook.occasion || "Styled for you")),
        itemIds,
        why: String(raw.look.why ?? ""),
        closetGap: raw.look.closetGap ? String(raw.look.closetGap) : undefined,
      };
    }
  }

  const a = raw.appearance as { model?: string; skinTone?: string; hairColor?: string } | undefined;
  if (a) {
    const appearance: NonNullable<StylistReply["appearance"]> = {};
    if (a.model === "feminine" || a.model === "masculine") appearance.model = a.model;
    const skin = SKIN_NAMES.indexOf(a.skinTone as (typeof SKIN_NAMES)[number]);
    if (skin >= 0) appearance.skinTone = SKIN_TONES[skin];
    const hair = HAIR_COLORS.find((h) => h.id === a.hairColor);
    if (hair) appearance.hairColor = hair.id;
    if (Object.keys(appearance).length > 0) out.appearance = appearance;
  }
  return out;
}
