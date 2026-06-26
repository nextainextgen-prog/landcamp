-- 022_otp_settings.sql
--
-- OTP / SMS provider settings (editable in /admin/settings/otp).
--
-- Forward-looking: customer login is LINE-only today, but the owner wants the
-- backoffice ready so a phone-OTP provider can be plugged in later (e.g. to
-- verify the phone number collected at registration) WITHOUT a code change —
-- just fill in the credentials and flip "enabled".
--
-- Single-row table, service-role only (RLS deny-by-default). Secrets are served
-- back masked. Code reads this first and falls back to env vars.
--
-- Safe to re-run.

create table if not exists public.otp_settings (
  id               smallint primary key default 1,
  provider         text,                  -- provider key, e.g. 'thaibulksms' | 'twilio' | 'custom'
  api_key          text,                  -- secret — served masked
  api_secret       text,                  -- secret — served masked
  api_base_url     text,                  -- for custom / self-hosted gateways
  sender_name      text,                  -- SMS sender id shown to the customer
  otp_length       smallint not null default 6,
  otp_ttl_seconds  integer  not null default 300,   -- code lifetime (5 min)
  cooldown_seconds integer  not null default 60,    -- min wait between resends
  max_attempts     smallint not null default 5,     -- wrong tries before lockout
  enabled          boolean  not null default false,
  updated_at       timestamptz not null default now(),
  constraint otp_settings_singleton check (id = 1),
  constraint otp_settings_length_range check (otp_length between 4 and 8)
);

insert into public.otp_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists otp_settings_touch on public.otp_settings;
create trigger otp_settings_touch
  before update on public.otp_settings
  for each row execute function public.touch_updated_at();

-- Service-role only (deny-by-default for anon/authenticated).
alter table public.otp_settings enable row level security;
