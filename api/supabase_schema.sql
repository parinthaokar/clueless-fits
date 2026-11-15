-- Clueless Closet: wardrobe and saved outfits.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: everything uses "if not exists" or is dropped and recreated.
--
-- Mirrors what the frontend keeps in localStorage today (lib/types.ts, lib/store.tsx):
--   wardrobe_items       <- ClothingItem          (store.closet)
--   saved_outfits        <- SavedOutfit           (store.saved)
--   saved_outfit_items   <- OutfitItem            (SavedOutfit.items)
--   user_settings        <- modelStyle, skinTone, hairColor
--
-- Every row belongs to a Supabase Auth user. Row Level Security lets each user
-- read and write only their own rows; nothing is public.

-- ---- wardrobe ---------------------------------------------------------------

create table if not exists wardrobe_items (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
    name                text not null check (length(trim(name)) between 1 and 200),
    category            text not null check (category in
                            ('Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Bags', 'Accessories')),
    kind                text not null,          -- GarmentKind: the drawing used when there's no photo
    color               text not null,          -- ColorName (lib/colors.ts)
    pattern             text not null default 'solid' check (pattern in ('solid', 'plaid', 'stripe')),
    description         text check (length(description) <= 2000),
    photo_path          text,                   -- path in the wardrobe-photos bucket: <user_id>/<file>
    -- What POST /predict said when the piece was added (null if the user picked the category).
    predicted_category  text,
    confidence          real check (confidence between 0 and 1),
    added_at            date not null default current_date,
    created_at          timestamptz not null default now()
);

create index if not exists wardrobe_items_user_idx on wardrobe_items (user_id, added_at desc);

-- ---- saved outfits ----------------------------------------------------------

create table if not exists saved_outfits (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
    occasion    text not null,
    why         text not null,
    closet_gap  text,                           -- something the closet is missing for this occasion
    model       text check (model in ('feminine', 'masculine')),
    rating      smallint not null default 0 check (rating between 0 and 5),  -- 0 = not rated yet
    saved_at    date not null default current_date,
    created_at  timestamptz not null default now()
);

create index if not exists saved_outfits_user_idx on saved_outfits (user_id, saved_at desc);

-- One row per piece in a look. Each row keeps a copy of the piece (`item`), so a look still
-- shows it after the piece is removed from the closet, and looks can use the Stylist's demo
-- pieces, which aren't in anyone's closet. `item_id` links back when the piece is the user's.
create table if not exists saved_outfit_items (
    id          uuid primary key default gen_random_uuid(),
    outfit_id   uuid not null references saved_outfits (id) on delete cascade,
    position    smallint not null,              -- order of the piece in the look
    slot        text not null check (slot in
                    ('Top', 'Bottom', 'Outerwear', 'Shoes', 'Belt', 'Bag', 'Accessory')),
    item_id     uuid references wardrobe_items (id) on delete set null,
    item        jsonb not null                  -- ClothingItem when the look was saved (no photo data)
);

create index if not exists saved_outfit_items_outfit_idx on saved_outfit_items (outfit_id, position);
create index if not exists saved_outfit_items_item_idx on saved_outfit_items (item_id);

-- ---- per-user settings ------------------------------------------------------

create table if not exists user_settings (
    user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
    model_style text check (model_style in ('feminine', 'masculine')),  -- null until picked
    skin_tone   text,                           -- one of SKIN_TONES in components/Model.tsx
    hair_color  text,                           -- one of HAIR_COLORS ids in components/Model.tsx
    updated_at  timestamptz not null default now()
);

-- ---- row level security -----------------------------------------------------

alter table wardrobe_items     enable row level security;
alter table saved_outfits      enable row level security;
alter table saved_outfit_items enable row level security;
alter table user_settings      enable row level security;

drop policy if exists "own wardrobe items" on wardrobe_items;
create policy "own wardrobe items" on wardrobe_items
    for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own saved outfits" on saved_outfits;
create policy "own saved outfits" on saved_outfits
    for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A look's pieces are visible through the look; a linked item must be the user's too.
drop policy if exists "own saved outfit items" on saved_outfit_items;
create policy "own saved outfit items" on saved_outfit_items
    for all to authenticated
    using (exists (select 1 from saved_outfits o where o.id = outfit_id and o.user_id = auth.uid()))
    with check (
        exists (select 1 from saved_outfits o where o.id = outfit_id and o.user_id = auth.uid())
        and (item_id is null
             or exists (select 1 from wardrobe_items w where w.id = item_id and w.user_id = auth.uid()))
    );

drop policy if exists "own settings" on user_settings;
create policy "own settings" on user_settings
    for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- photo storage ----------------------------------------------------------
-- Private bucket; each user's photos live under a folder named after their user id.
-- The frontend shows them with signed URLs (supabase.storage.from(...).createSignedUrl).

insert into storage.buckets (id, name, public)
values ('wardrobe-photos', 'wardrobe-photos', false)
on conflict (id) do nothing;

drop policy if exists "own wardrobe photos" on storage.objects;
create policy "own wardrobe photos" on storage.objects
    for all to authenticated
    using (bucket_id = 'wardrobe-photos' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'wardrobe-photos' and (storage.foldername(name))[1] = auth.uid()::text);
