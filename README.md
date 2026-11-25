# Closet

Next.js App Router + Tailwind. "Add a piece" tags items through the backend's `/predict`
API (`lib/api.ts`); the stylist chat uses Gemini through `app/api/stylist/route.ts` (see
[AI stylist](#ai-stylist-gemini)) and falls back to the mock looks in `lib/mockData.ts`. The closet, saved looks
(with ratings) and the model style / skin tone live in a client store, `lib/store.tsx` (React
context + localStorage), which starts from the mock data when storage is empty.
Colors and fonts are defined once, in the `@theme` block of `app/globals.css`.
Designs: `design/DESIGN.md` and the mockups in `design/screens/`.

## Setup

```
npm install
cp .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
npm run dev                  # http://localhost:3000
```

`.env.local` sets `NEXT_PUBLIC_API_URL`, the backend's base URL (the live API on Modal).
It's gitignored, so each of us copies it from `.env.example`. Restart `npm run dev` after
changing it. The backend currently only accepts requests from `localhost:3000`; to use it from
a Vercel deployment, send the Vercel URL to the backend owner so it can be allowed.

### AI stylist (Gemini)

The Stylist chat can build a look from your closet, edit the current look ("swap the boots
for sneakers") and change the model's body, skin tone and hair colour. To turn it on, get a
free key at https://aistudio.google.com/apikey, set `GEMINI_API_KEY=` in `.env.local` and
restart `npm run dev`. The key is only read on the server (no `NEXT_PUBLIC_` prefix), so it
never reaches the browser; for Vercel, add it under Settings → Environment Variables.

`gemini-flash-latest` is tried first and `gemini-flash-lite-latest` if it's busy or rate-limited
(the free tier is often overloaded). `GEMINI_MODEL` overrides that with a comma-separated list.
Without a key, the occasion pills and Shuffle fall back to the mock looks.

## Routes

| Route | File | Components |
|---|---|---|
| `/` | `app/page.tsx` | `PlaidBand`, `Logo`, `GarmentStrip` |
| `/wardrobe` | `app/(app)/wardrobe/page.tsx` | `TextFilters`, `GarmentCard`, `AddPieceDrawer`, `EmptyState` |
| `/stylist` | `app/(app)/stylist/page.tsx` | `StylistView`, `Model`, `RatingDots` |
| `/fitting-room` | `app/(app)/fitting-room/page.tsx` | `FittingRoomView`, `Model` |
| `/saved` | `app/(app)/saved/page.tsx` | `Model`, `Card`, `Pill`, `Tag`, `RatingDots`, `EmptyState` |

Shared: `Navbar` (in `app/(app)/layout.tsx`), `components/ui/` (Card, Pill, Button, Tag,
ConfidenceBar, RatingDots, Note, Warn…), `GarmentArt`/`GarmentImage`, `app/(app)/template.tsx`
(page fade-in), `lib/store.tsx` (`StoreProvider` in `app/(app)/layout.tsx`, `useStore()`),
`lib/types.ts`, `lib/api.ts`, `lib/mockData.ts`.
