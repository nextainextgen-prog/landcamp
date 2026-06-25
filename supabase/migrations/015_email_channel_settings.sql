-- 015_email_channel_settings.sql
--
-- Settings hub config stores (editable in /admin/settings):
--   * email_settings — Resend email sender config (for confirmation/receipt mail)
--   * channel_sync   — external booking-platform iCal URLs (Airbnb/Booking/Agoda)
--
-- Single-row tables, service-role only (RLS deny-by-default). Secrets served
-- back masked. Code reads these with env fallback where relevant.
--
-- Safe to re-run.

create table if not exists public.email_settings (
  id             smallint primary key default 1,
  resend_api_key text,
  from_email     text,
  from_name      text,
  reply_to       text,
  enabled        boolean not null default false,
  updated_at     timestamptz not null default now(),
  constraint email_settings_singleton check (id = 1)
);

insert into public.email_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists email_settings_touch on public.email_settings;
create trigger email_settings_touch
  before update on public.email_settings
  for each row execute function public.touch_updated_at();

alter table public.email_settings enable row level security;

create table if not exists public.channel_sync (
  id               smallint primary key default 1,
  airbnb_ical_url  text,
  booking_ical_url text,
  agoda_ical_url   text,
  export_enabled   boolean not null default false,
  updated_at       timestamptz not null default now(),
  constraint channel_sync_singleton check (id = 1)
);

insert into public.channel_sync (id) values (1) on conflict (id) do nothing;

drop trigger if exists channel_sync_touch on public.channel_sync;
create trigger channel_sync_touch
  before update on public.channel_sync
  for each row execute function public.touch_updated_at();

alter table public.channel_sync enable row level security;
