-- 010_retire_admin_users.sql
--
-- The legacy `admin_users` table (Supabase/Google-based admin) is replaced by
-- `admin_accounts` (username/password). All admin reads go through the
-- service-role key, so the RLS policies on notifications / room_availability
-- that referenced admin_users are dead weight. Drop them (RLS stays enabled →
-- deny-by-default for anon/authenticated) and remove the legacy table.
--
-- Safe to re-run.

drop policy if exists "notifications admin read" on public.notifications;
drop policy if exists "room_availability admin read" on public.room_availability;

drop table if exists public.admin_users cascade;
