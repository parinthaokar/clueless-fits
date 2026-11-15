# Closet

Next.js App Router + Tailwind. "Add a piece" tags items through the backend's `/predict`
API (`lib/api.ts`); the stylist is still mocked from `lib/mockData.ts`. The closet, saved looks
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
