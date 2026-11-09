# Closet

Next.js App Router + Tailwind. "Add a piece" tags items through the backend's `/predict`
API (`lib/api.ts`); everything else is still mock data in `lib/mockData.ts`.
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
changing it. The backend only accepts requests from `localhost:3000` and `*.vercel.app`.

## Routes

| Route | File | Components |
|---|---|---|
| `/` | `app/page.tsx` | `PlaidBand`, `Logo`, `GarmentStrip` |
| `/wardrobe` | `app/(app)/wardrobe/page.tsx` | `TextFilters`, `GarmentCard`, `AddPieceDrawer`, `EmptyState` |
| `/stylist` | `app/(app)/stylist/page.tsx` | `MessageBlock`, `OccasionPills`, `LookPanel` |
| `/fitting-room` | `app/(app)/fitting-room/page.tsx` | `FittingRoomView`, `RatingDots` |
| `/saved` | `app/(app)/saved/page.tsx` | `LookCard`, `RatingDots` |

Shared: `Navbar` (in `app/(app)/layout.tsx`), `components/ui/` (Card, Pill, Button, Tag,
ConfidenceBar, RatingDots, Note, Warn…), `GarmentArt`/`GarmentImage`, `app/(app)/template.tsx`
(page fade-in), `lib/types.ts`, `lib/api.ts`, `lib/mockData.ts`.
