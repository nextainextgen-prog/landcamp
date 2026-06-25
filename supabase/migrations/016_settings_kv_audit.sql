-- 016_settings_kv_audit.sql
--
-- Backs the remaining settings-hub pages.
--   * app_settings     — generic key→jsonb store for simple config pages
--                        (tax, goals/KPI, notification routing, templates, pdpa)
--   * admin_audit_log  — record of admin actions (who did what, when)
--
-- Service-role only (RLS deny-by-default).
-- Safe to re-run.

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists app_settings_touch on public.app_settings;
create trigger app_settings_touch
  before update on public.app_settings
  for each row execute function public.touch_updated_at();

alter table public.app_settings enable row level security;

create table if not exists public.admin_audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor      text,
  action     text not null,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;
