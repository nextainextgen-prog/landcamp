-- 013_line_auth.sql
--
-- Switch customer authentication from Google (Supabase Auth) to LINE Login.
--
-- Customers are now identified by their LINE userId (captured at LINE Login),
-- which is also the key used later to push Flex messages to them. The app
-- manages its own signed `lc_customer` session cookie (like the admin one),
-- so Supabase Auth is no longer used for customers.
--
--   * line_user_id : LINE userId (unique) — the push key. Same value the
--                    Messaging API uses IFF the Login + Messaging channels are
--                    under the same LINE provider.
--   * line_friend  : whether the customer added the Official Account as a
--                    friend (so we know we can push to them).
--
-- The existing google_sub / avatar_url / full_name columns are reused for the
-- LINE profile (avatar_url = picture, full_name = display name).
--
-- Also retires the auth.users → customers sync trigger from migration 005,
-- since customers are no longer created from Supabase Auth.
--
-- Safe to re-run.

alter table public.customers
  add column if not exists line_user_id text,
  add column if not exists line_friend  boolean not null default false;

create unique index if not exists customers_line_user_id_key
  on public.customers (line_user_id)
  where line_user_id is not null;

-- Retire the Google/Supabase-Auth sync trigger (migration 005).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user();

-- ── LINE integration settings (editable in /admin/settings) ──
-- Single-row store so the owner can enter LINE channel credentials + the OA
-- messaging token in the backoffice instead of in code/env. Code reads this
-- first and falls back to env vars. Secrets are served back masked.
create table if not exists public.line_settings (
  id                     smallint primary key default 1,
  login_channel_id       text,
  login_channel_secret   text,
  messaging_access_token text,
  oa_basic_id            text,
  add_friend             boolean not null default true,
  updated_at             timestamptz not null default now(),
  constraint line_settings_singleton check (id = 1)
);

insert into public.line_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists line_settings_touch on public.line_settings;
create trigger line_settings_touch
  before update on public.line_settings
  for each row execute function public.touch_updated_at();

-- Service-role only (deny-by-default for anon/authenticated).
alter table public.line_settings enable row level security;
