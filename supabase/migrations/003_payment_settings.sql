-- 003_payment_settings.sql
--
-- Payment Settings foundation (impl-plan §1.1–1.3):
--   payment_accounts            — PromptPay / bank / corporate accounts list
--   payment_settings            — singleton: deposit toggle + percent
--   cancellation_policy         — singleton: policy toggle
--   cancellation_policy_tiers   — refund tier list (days_before, refund_percent)
--
-- All four tables:
--   * use the shared `public.touch_updated_at` trigger (defined in 001_init.sql)
--     where an `updated_at` column exists
--   * have RLS ENABLED with deny-by-default policies (no anon, no authenticated).
--     All writes/reads currently go through API routes using the service-role key,
--     which bypasses RLS.
--
-- Safe to re-run.

-- ─────────────────────────────────────────────
-- 1. payment_accounts
-- ─────────────────────────────────────────────
create table if not exists public.payment_accounts (
  id              uuid primary key default gen_random_uuid(),
  type            text        not null check (type in (
                    'promptpay_phone',
                    'promptpay_id',
                    'bank_account',
                    'corporate'
                  )),
  account_name    text        not null,
  bank            text,
  account_number  text        not null,
  is_active       boolean     not null default true,
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists payment_accounts_active_sort_idx
  on public.payment_accounts (is_active, sort_order);

drop trigger if exists payment_accounts_touch on public.payment_accounts;
create trigger payment_accounts_touch
  before update on public.payment_accounts
  for each row execute function public.touch_updated_at();

alter table public.payment_accounts enable row level security;

drop policy if exists "payment_accounts deny anon" on public.payment_accounts;
create policy "payment_accounts deny anon"
  on public.payment_accounts
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists "payment_accounts deny authenticated" on public.payment_accounts;
create policy "payment_accounts deny authenticated"
  on public.payment_accounts
  for all
  to authenticated
  using (false)
  with check (false);

-- ─────────────────────────────────────────────
-- 2. payment_settings (singleton)
-- ─────────────────────────────────────────────
create table if not exists public.payment_settings (
  id               integer primary key default 1 check (id = 1),
  deposit_enabled  boolean     not null default false,
  deposit_percent  integer     not null default 50 check (deposit_percent between 1 and 100),
  updated_at       timestamptz not null default now()
);

insert into public.payment_settings (id, deposit_enabled, deposit_percent)
  values (1, false, 50)
  on conflict (id) do nothing;

drop trigger if exists payment_settings_touch on public.payment_settings;
create trigger payment_settings_touch
  before update on public.payment_settings
  for each row execute function public.touch_updated_at();

alter table public.payment_settings enable row level security;

drop policy if exists "payment_settings deny anon" on public.payment_settings;
create policy "payment_settings deny anon"
  on public.payment_settings
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists "payment_settings deny authenticated" on public.payment_settings;
create policy "payment_settings deny authenticated"
  on public.payment_settings
  for all
  to authenticated
  using (false)
  with check (false);

-- ─────────────────────────────────────────────
-- 3. cancellation_policy (singleton)
-- ─────────────────────────────────────────────
create table if not exists public.cancellation_policy (
  id          integer primary key default 1 check (id = 1),
  enabled     boolean     not null default false,
  updated_at  timestamptz not null default now()
);

insert into public.cancellation_policy (id, enabled)
  values (1, false)
  on conflict (id) do nothing;

drop trigger if exists cancellation_policy_touch on public.cancellation_policy;
create trigger cancellation_policy_touch
  before update on public.cancellation_policy
  for each row execute function public.touch_updated_at();

alter table public.cancellation_policy enable row level security;

drop policy if exists "cancellation_policy deny anon" on public.cancellation_policy;
create policy "cancellation_policy deny anon"
  on public.cancellation_policy
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists "cancellation_policy deny authenticated" on public.cancellation_policy;
create policy "cancellation_policy deny authenticated"
  on public.cancellation_policy
  for all
  to authenticated
  using (false)
  with check (false);

-- ─────────────────────────────────────────────
-- 4. cancellation_policy_tiers
-- ─────────────────────────────────────────────
create table if not exists public.cancellation_policy_tiers (
  id              uuid primary key default gen_random_uuid(),
  days_before     integer     not null,
  refund_percent  integer     not null check (refund_percent between 0 and 100),
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists cancellation_policy_tiers_sort_idx
  on public.cancellation_policy_tiers (sort_order);

alter table public.cancellation_policy_tiers enable row level security;

drop policy if exists "cancellation_policy_tiers deny anon" on public.cancellation_policy_tiers;
create policy "cancellation_policy_tiers deny anon"
  on public.cancellation_policy_tiers
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists "cancellation_policy_tiers deny authenticated" on public.cancellation_policy_tiers;
create policy "cancellation_policy_tiers deny authenticated"
  on public.cancellation_policy_tiers
  for all
  to authenticated
  using (false)
  with check (false);
