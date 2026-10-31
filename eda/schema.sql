-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Creates the three tables the dashboard reads, allows public READ only,
-- and creates a public storage bucket for sample images.

create table if not exists items (
    item_id         text primary key,
    url_name        text,
    title           text,
    description     text,
    category        text not null,
    has_title       boolean,
    has_description boolean,
    desc_len        integer,
    non_ascii       boolean,
    image_url       text
);

create table if not exists category_summary (
    category           text primary key,
    n_items            integer,
    pct_of_items       real,
    pct_missing_title  real,
    pct_missing_desc   real,
    median_desc_len    real
);

create table if not exists dataset_stats (
    stat  text primary key,
    value real,
    note  text
);

-- Row Level Security: anyone with the anon key can read, nobody can write.
-- (The loader uses the service_role key, which bypasses RLS.)
alter table items            enable row level security;
alter table category_summary enable row level security;
alter table dataset_stats    enable row level security;

drop policy if exists "public read" on items;
drop policy if exists "public read" on category_summary;
drop policy if exists "public read" on dataset_stats;
create policy "public read" on items            for select using (true);
create policy "public read" on category_summary for select using (true);
create policy "public read" on dataset_stats    for select using (true);

-- Public bucket for the sample product images shown in the dashboard gallery.
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;
