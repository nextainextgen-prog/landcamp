-- 004_booking_system.sql
--
-- Booking system foundation (impl-plan §1.1–1.5):
--   customers          — customer profiles (linked to auth.users when signed in)
--   bookings           — reservations
--   payments           — payment records linked to bookings
--   notifications      — outbound notification log (Line/Email/SMS)
--   room_availability  — manual room availability overrides
--   admin_users        — staff with admin access (roles)
--
-- All tables with `updated_at` reuse `public.touch_updated_at` defined in 001_init.sql.
-- Double-booking prevention uses btree_gist + daterange EXCLUDE constraint.
-- RLS is enabled on every table.
--
-- Safe to re-run.

-- ─────────────────────────────────────────────
-- Required extension for EXCLUDE (uuid = + daterange &&)
-- ─────────────────────────────────────────────
create extension if not exists btree_gist;

-- ─────────────────────────────────────────────
-- 1. customers
-- ─────────────────────────────────────────────
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique references auth.users(id) on delete set null,
  email           text,
  full_name       text,
  phone           text,
  google_sub      text,
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists customers_email_idx on public.customers (email);
create index if not exists customers_auth_user_idx on public.customers (auth_user_id);

drop trigger if exists customers_touch on public.customers;
create trigger customers_touch
  before update on public.customers
  for each row execute function public.touch_updated_at();

alter table public.customers enable row level security;

drop policy if exists "customers self select" on public.customers;
create policy "customers self select"
  on public.customers
  for select
  to authenticated
  using (auth.uid() = auth_user_id);

-- ─────────────────────────────────────────────
-- 2. bookings
-- ─────────────────────────────────────────────
create table if not exists public.bookings (
  id                 uuid primary key default gen_random_uuid(),
  booking_code       text unique not null,
  customer_id        uuid not null references public.customers(id) on delete restrict,
  room_id            uuid not null,
  check_in           date not null,
  check_out          date not null,
  adults             smallint not null default 1,
  children           smallint not null default 0,
  extra_bed          boolean not null default false,
  nights             integer generated always as ((check_out - check_in)) stored,
  base_amount        integer not null default 0,
  extra_bed_amount   integer not null default 0,
  total_amount       integer not null default 0,
  status             text not null default 'pending_payment'
                       check (status in ('pending_payment','confirmed','cancelled','completed','no_show')),
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint bookings_dates_chk check (check_out > check_in)
);

create index if not exists bookings_customer_created_idx
  on public.bookings (customer_id, created_at desc);
create index if not exists bookings_dates_idx
  on public.bookings (check_in, check_out);
create index if not exists bookings_status_checkin_idx
  on public.bookings (status, check_in);
create index if not exists bookings_room_idx
  on public.bookings (room_id);

-- Prevent double-booking same room on overlapping dates for active bookings.
-- daterange '[)' = check_in inclusive, check_out exclusive (matches hotel semantics).
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    room_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (status in ('confirmed','pending_payment'));

drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch
  before update on public.bookings
  for each row execute function public.touch_updated_at();

alter table public.bookings enable row level security;

drop policy if exists "bookings self select" on public.bookings;
create policy "bookings self select"
  on public.bookings
  for select
  to authenticated
  using (
    customer_id in (
      select id from public.customers where auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 3. payments
-- ─────────────────────────────────────────────
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings(id) on delete cascade,
  amount       integer not null,
  kind         text not null check (kind in ('deposit','remainder','full')),
  method       text,
  status       text not null default 'pending'
                 check (status in ('pending','paid','failed','refunded')),
  paid_at      timestamptz,
  slip_url     text,
  created_at   timestamptz not null default now()
);

create index if not exists payments_booking_idx on public.payments (booking_id);

alter table public.payments enable row level security;

drop policy if exists "payments self select via booking" on public.payments;
create policy "payments self select via booking"
  on public.payments
  for select
  to authenticated
  using (
    booking_id in (
      select b.id
      from public.bookings b
      join public.customers c on c.id = b.customer_id
      where c.auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 4. notifications
-- ─────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null,
  payload     jsonb not null default '{}'::jsonb,
  sent_at     timestamptz,
  status      text,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_created_idx
  on public.notifications (created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications admin read" on public.notifications;
create policy "notifications admin read"
  on public.notifications
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where user_id = auth.uid() and is_active = true
    )
  );

-- ─────────────────────────────────────────────
-- 5. room_availability
-- ─────────────────────────────────────────────
create table if not exists public.room_availability (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null,
  date        date not null,
  available   boolean not null default true,
  reason      text,
  created_at  timestamptz not null default now(),
  unique (room_id, date)
);

create index if not exists room_availability_date_idx
  on public.room_availability (date);

alter table public.room_availability enable row level security;

drop policy if exists "room_availability admin read" on public.room_availability;
create policy "room_availability admin read"
  on public.room_availability
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where user_id = auth.uid() and is_active = true
    )
  );

-- ─────────────────────────────────────────────
-- 6. admin_users
-- ─────────────────────────────────────────────
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('super_admin','reception','housekeeping')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists admin_users_active_idx
  on public.admin_users (is_active);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users self read" on public.admin_users;
create policy "admin_users self read"
  on public.admin_users
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_users a
      where a.user_id = auth.uid() and a.is_active = true
    )
  );
