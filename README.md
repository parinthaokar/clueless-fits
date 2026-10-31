# Closet

Front-end only UI (Next.js App Router + Tailwind). All data is mock data in `lib/mockData.ts`.
Colors and fonts are defined once, in the `@theme` block of `app/globals.css`.

```
npm install
npm run dev   # http://localhost:3000
```

| Route | File | Components |
|---|---|---|
| `/wardrobe` | `app/wardrobe/page.tsx` | `TextFilters`, `GarmentCard`, `AddPieceDrawer`, `EmptyState` |
| `/stylist` | `app/stylist/page.tsx` | `MessageBlock`, `OccasionPills`, `LookPanel` |
| `/fitting-room` | `app/fitting-room/page.tsx` | `FittingRoomView`, `RatingDots` |
| `/saved` | `app/saved/page.tsx` | `LookCard`, `RatingDots` |

Shared: `Navbar` (in `app/layout.tsx`), `GarmentImage`, `app/template.tsx` (page fade-in), `lib/types.ts`, `lib/mockData.ts`.
