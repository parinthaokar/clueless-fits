# Clueless Closet

Front-end only UI (Next.js App Router + Tailwind). All data is mock data in `lib/mockData.ts`.

```
npm install
npm run dev   # http://localhost:3000
```

## Structure

| Route | File | Components |
|---|---|---|
| `/closet` | `app/closet/page.tsx` | `Chips`, `ClothingCard`, `AddItemModal`, `EmptyCloset`, `ItemImage` |
| `/stylist` | `app/stylist/page.tsx` | `ChatBubble`, `Chips`, `OutfitSuggestionCard`, `ItemImage` |
| `/try-on` | `app/try-on/page.tsx` | `TryOnView`, `StarRating`, `ItemImage` |
| `/saved` | `app/saved/page.tsx` | `SavedOutfitCard`, `StarRating`, `ItemImage` |

Shared: `components/Navbar.tsx` (in `app/layout.tsx`), `lib/types.ts`, `lib/mockData.ts`.
