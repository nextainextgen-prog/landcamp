-- LandCamp Villa Khao Yai — Initial schema
-- Run via Supabase SQL editor or `supabase db push`
--
-- Tables:
--   reviews     — guest reviews shown on the landing page
--   leads       — contact form submissions
--   rooms       — accommodation inventory (optional mirror of data/rooms.ts)
--   menu_items  — food & drinks (optional mirror of data/menu.ts)
--
-- Row Level Security (RLS) is enabled on every table.
-- Public users can: read reviews/rooms/menu_items, insert leads.
-- Service role bypasses RLS for admin work.

-- ─────────────────────────────────────────────
-- Helper: updated_at trigger
-- ─────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- 1. reviews
-- ─────────────────────────────────────────────
create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  reviewer_name   text        not null,
  rating          smallint    not null check (rating between 1 and 5),
  review_text_th  text        not null,
  review_text_en  text        not null,
  review_date     date        not null,
  photo_url       text,
  platform        text        not null check (platform in ('google', 'facebook', 'instagram')),
  is_featured     boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists reviews_featured_idx on public.reviews (is_featured, review_date desc);
create trigger reviews_touch
  before update on public.reviews
  for each row execute function public.touch_updated_at();

alter table public.reviews enable row level security;

create policy "reviews are publicly readable"
  on public.reviews for select
  using (true);

-- ─────────────────────────────────────────────
-- 2. leads
-- ─────────────────────────────────────────────
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  phone         text        not null,
  email         text,
  checkin_date  date,
  message       text,
  source        text default 'landing-page',
  created_at    timestamptz not null default now()
);

create index if not exists leads_created_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

create policy "anyone can submit a lead"
  on public.leads for insert
  with check (true);

-- Reads restricted to authenticated/service role only.

-- ─────────────────────────────────────────────
-- 3. rooms (optional mirror — useful when admin UI is added later)
-- ─────────────────────────────────────────────
create table if not exists public.rooms (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  room_type       text not null check (room_type in ('villa-1bed', 'villa-2bed', 'train', 'camper')),
  name_th         text not null,
  name_en         text not null,
  description_th  text not null,
  description_en  text not null,
  price_weekday   integer not null,
  price_weekend   integer not null,
  max_guests      smallint not null,
  amenities       jsonb not null default '[]'::jsonb,
  images          jsonb not null default '[]'::jsonb,
  is_available    boolean not null default true,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger rooms_touch
  before update on public.rooms
  for each row execute function public.touch_updated_at();

alter table public.rooms enable row level security;

create policy "rooms are publicly readable"
  on public.rooms for select
  using (true);

-- ─────────────────────────────────────────────
-- 4. menu_items
-- ─────────────────────────────────────────────
create table if not exists public.menu_items (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  category        text not null check (category in ('food', 'drinks', 'desserts')),
  name_th         text not null,
  name_en         text not null,
  description_th  text not null,
  description_en  text not null,
  price           integer not null default 0,
  image_url       text,
  is_available    boolean not null default true,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists menu_items_category_idx on public.menu_items (category, display_order);
create trigger menu_items_touch
  before update on public.menu_items
  for each row execute function public.touch_updated_at();

alter table public.menu_items enable row level security;

create policy "menu items are publicly readable"
  on public.menu_items for select
  using (true);
