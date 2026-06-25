-- 009_admin_accounts.sql
--
-- Separate username/password admin accounts (independent of Supabase/Google
-- customer auth). Each account has a role and a list of section permissions;
-- super_admin implicitly has every section.
--
-- Auth is handled in app code with a signed session cookie, so all access is
-- via the service-role key — RLS denies everyone else.
--
-- Safe to re-run.

create table if not exists public.admin_accounts (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  password_hash text not null,
  role          text not null default 'admin' check (role in ('super_admin', 'admin')),
  permissions   jsonb not null default '[]'::jsonb,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists admin_accounts_touch on public.admin_accounts;
create trigger admin_accounts_touch
  before update on public.admin_accounts
  for each row execute function public.touch_updated_at();

alter table public.admin_accounts enable row level security;

drop policy if exists "admin_accounts deny anon" on public.admin_accounts;
create policy "admin_accounts deny anon"
  on public.admin_accounts for all to anon using (false) with check (false);

drop policy if exists "admin_accounts deny authenticated" on public.admin_accounts;
create policy "admin_accounts deny authenticated"
  on public.admin_accounts for all to authenticated using (false) with check (false);
