-- 017_line_messaging.sql
--
-- Extra LINE settings for messaging (pushing cards to customers + notifying the
-- team group):
--   * messaging_channel_secret — Messaging API channel secret (verifies webhooks)
--   * team_group_id            — LINE group id the OA posts team alerts to
--
-- Safe to re-run.

alter table public.line_settings
  add column if not exists messaging_channel_secret text,
  add column if not exists team_group_id            text;
