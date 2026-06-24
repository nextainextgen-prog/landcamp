-- 013_line_auth.sql
--
-- Add LINE Login alongside the existing Google (Supabase Auth) login. Both
-- methods are supported; the UI emphasises LINE. Customers may be identified by
-- their LINE userId and/or their Google auth user.
--
--   * line_user_id  : LINE userId (unique) — the push key. Same value the
--                     Messaging API uses IFF the Login + Messaging channels are
--                     under the same LINE provider.
--   * line_friend   : whether the customer added the Official Account as a
--                     friend (so we know we can push to them).
--   * auth_provider : which channel the customer last signed in with
--                     ('line' | 'google') — shown on the profile + kept as data.
--
-- The existing google_sub / avatar_url / full_name columns are reused for the
-- profile (avatar_url = picture, full_name = display name). The Google
-- auth.users → customers sync trigger (migration 005) stays in place.
--
-- Safe to re-run.

alter table public.customers
  add column if not exists line_user_id  text,
  add column if not exists line_friend   boolean not null default false,
  add column if not exists auth_provider text;

create unique index if not exists customers_line_user_id_key
  on public.customers (line_user_id)
  where line_user_id is not null;

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
