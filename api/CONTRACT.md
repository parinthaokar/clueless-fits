# API Contract: Clueless Closet

This file is the agreement between the backend (`api/`, FastAPI on Modal) and
the frontend (Next.js + shadcn/ui on Vercel). **Change it only through a pull
request that both the backend and frontend owners approve.** The live,
always-current version is the API's own docs page: `<API_URL>/docs`.

- **Base URL (production):** `https://rgollapa105--clueless-closet-api-fastapi-app.us-east.modal.run`
- **Base URL (local):** `http://127.0.0.1:8000`
- **Format:** JSON in, JSON out. No auth.
- **CORS:** allowed from `http://localhost:3000` and any `https://*.vercel.app`.

---

## `GET /health`
Always returns 200 if the server is up.

```json
{ "status": "ok", "model_loaded": true }
```

## `GET /pipeline-info`
Information about the loaded model. Returns **503** if no model is loaded.

```json
{
  "model_name": "stub-keyword-rules",
  "model_version": "0.1-stub",
  "sklearn_version": "1.9.1",
  "classes": ["accessories", "all-body", "bags", "bottoms", "hats", "jewellery",
              "outerwear", "scarves", "shoes", "sunglasses", "tops"],
  "is_stub": true,
  "metrics": {}
}
```
`is_stub` is `true` until the real D4 model replaces the placeholder. The
response shape doesn't change when that happens.

## `POST /predict`
Predicts what kind of clothing item something is, from its name.

**Request**
| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | yes | 1–200 characters, not blank |
| `description` | string | no | up to 2000 characters |

```json
{ "name": "Black leather ankle boots", "description": "Block heel, side zip" }
```

**Response 200**
```json
{
  "category": "shoes",
  "app_category": "Shoes",
  "slots": ["Shoes"],
  "confidence": 0.91,
  "top_3": [
    { "category": "shoes", "probability": 0.91 },
    { "category": "bags", "probability": 0.04 },
    { "category": "bottoms", "probability": 0.02 }
  ]
}
```
- `category`: the raw model label (11 possible values). Show it only if useful.
- `app_category`: **use this one in the UI.** It always matches `Category` in `lib/types.ts`.
- `slots`: which outfit slots the item can fill (matches `Slot` in `lib/types.ts`). A dress returns `["Top", "Bottom"]`.
- `confidence`: 0–1. Suggestion: under 0.5, show the prediction as a pre-filled
  choice the user can change instead of an automatic label.

### Category mapping (done by the backend)
| Model label | `app_category` | `slots` |
|---|---|---|
| tops | Tops | Top |
| bottoms | Bottoms | Bottom |
| all-body | Dresses | Top, Bottom |
| outerwear | Outerwear | Top |
| shoes | Shoes | Shoes |
| bags | Bags | Accessory |
| jewellery, sunglasses, hats, scarves, accessories | Accessories | Accessory |

## Errors
| Status | When | Body |
|---|---|---|
| **422** | Bad input: missing or blank `name`, wrong type, too long, unknown field | `{ "detail": [ { "loc": [...], "msg": "...", "type": "..." } ] }` |
| **503** | The model failed to load on the server | `{ "detail": "Model not available" }` |

---

## Database (Supabase)

The wardrobe and saved outfits live in Supabase, not in this API. The frontend
reads and writes them directly with `@supabase/supabase-js`, signed in through
Supabase Auth. Schema: [`supabase_schema.sql`](supabase_schema.sql) (run it once
in the Supabase SQL Editor).

| Table | Frontend type | Notes |
|---|---|---|
| `wardrobe_items` | `ClothingItem` | `category` uses the 7 app categories; `predicted_category` / `confidence` keep what `/predict` said |
| `saved_outfits` | `SavedOutfit` | `rating` is 0–5, 0 = not rated yet |
| `saved_outfit_items` | `OutfitItem` | one row per piece in a look, with a copy of the piece in `item`; `item_id` links to the closet when it's the user's piece |
| `user_settings` | `modelStyle`, `skinTone`, `hairColor` | one row per user |

- **Access:** Row Level Security on every table. A signed-in user can only see
  and change their own rows; nothing is readable without signing in.
- **Photos:** private `wardrobe-photos` storage bucket, one folder per user
  (`<user_id>/<file>`). `wardrobe_items.photo_path` stores the path; show it
  with a signed URL.
- **Vercel env vars:** `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the anon key is safe in the browser because
  of RLS; never put the service-role key in the frontend).

---

## Notes for the frontend (Next.js + shadcn/ui on Vercel)

**TypeScript types**: add to `lib/types.ts`:
```ts
export interface PredictRequest {
  name: string;
  description?: string;
}

export interface PredictResponse {
  category: string;
  app_category: Category;
  slots: Slot[];
  confidence: number;
  top_3: { category: string; probability: number }[];
}
```

**One place for API calls**: a `lib/api.ts` along these lines:
```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function predictCategory(body: PredictRequest): Promise<PredictResponse> {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 422) throw new Error("Please enter a valid item name.");
  if (res.status === 503) throw new Error("The stylist is unavailable right now. Try again soon.");
  if (!res.ok) throw new Error("Something went wrong.");
  return res.json();
}
```

**Vercel**: set `NEXT_PUBLIC_API_URL` to the Modal base URL in Vercel → Project
→ Settings → Environment Variables (and in `.env.local` for local dev). Send
the Vercel URL to the backend owner so it can be added to CORS.

**shadcn/ui ideas for D5's required loading and error states:**
- `Input` + `Button` for the item name in the Add Piece drawer
- `Skeleton` or a spinner in the `Button` while waiting
- `Badge` for the predicted category, `Select` to let the user override it
- `Alert` (destructive variant) or `Sonner` toast for 422/503 errors
