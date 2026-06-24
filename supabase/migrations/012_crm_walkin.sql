-- 012_crm_walkin.sql
--
-- CRM + Walk-in backend (ROADMAP ลำดับ 4):
--   * customers gain CRM fields: is_vip, tags, source (online vs walk-in/manual).
--   * bookings gain source + created_by so front-desk (walk-in) reservations are
--     distinguishable from online ones, and we record which admin made them.
--   * customer_notes     — free-form admin notes timeline per customer.
--   * customer_contacts  — contact log (call / email / line / chat) per customer.
--
-- The two new tables are admin-internal: all access goes through the
-- service-role client (lib/supabase/admin.ts), which bypasses RLS. We still
-- enable RLS with NO public policy so anon/authenticated clients are denied by
-- default (deny-by-default, never reference the retired admin_users table).
--
-- Safe to re-run.

-- ─────────────────────────────────────────────
-- 1. customers: CRM fields
-- ─────────────────────────────────────────────
alter table public.customers
  add column if not exists is_vip boolean not null default false,
  add column if not exists tags   text[]  not null default '{}',
  add column if not exists source text     not null default 'online';

alter table public.customers drop constraint if exists customers_source_chk;
alter table public.customers
  add constraint customers_source_chk
  check (source in ('online','walk_in','manual'));

create index if not exists customers_is_vip_idx on public.customers (is_vip) where is_vip;
create index if not exists customers_phone_idx  on public.customers (phone);

-- ─────────────────────────────────────────────
-- 2. bookings: channel + author
-- ─────────────────────────────────────────────
alter table public.bookings
  add column if not exists source     text not null default 'online',
  add column if not exists created_by uuid;  -- admin_accounts.id (null for online)

alter table public.bookings drop constraint if exists bookings_source_chk;
alter table public.bookings
  add constraint bookings_source_chk
  check (source in ('online','walk_in'));

create index if not exists bookings_source_idx on public.bookings (source);

-- ─────────────────────────────────────────────
-- 3. customer_notes
-- ─────────────────────────────────────────────
create table if not exists public.customer_notes (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  author_id    uuid,        -- admin_accounts.id (kept loose; admins may be removed)
  author_name  text,        -- denormalized username for display without a join
  body         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists customer_notes_customer_idx
  on public.customer_notes (customer_id, created_at desc);

alter table public.customer_notes enable row level security;
-- No policy: deny-by-default for anon/authenticated; service role bypasses RLS.

-- ─────────────────────────────────────────────
-- 4. customer_contacts (contact log)
-- ─────────────────────────────────────────────
create table if not exists public.customer_contacts (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  channel      text not null check (channel in ('phone','email','line','chat','other')),
  direction    text not null default 'outbound' check (direction in ('inbound','outbound')),
  summary      text not null,
  author_id    uuid,
  author_name  text,
  created_at   timestamptz not null default now()
);

create index if not exists customer_contacts_customer_idx
  on public.customer_contacts (customer_id, created_at desc);

alter table public.customer_contacts enable row level security;
-- No policy: deny-by-default for anon/authenticated; service role bypasses RLS.
