-- 019_revenue_entries.sql
--
-- Manual / imported revenue ledger for the /admin/revenue dashboard.
--
-- The booking system only knows about online + walk-in reservations. Real
-- businesses also book income that never flows through `bookings`: cash at the
-- front desk, activity/event fees, deposits paid offline, or historical revenue
-- migrated from a spreadsheet. `revenue_entries` is that ledger — every row is
-- one piece of recognised income with a date, amount and category, optionally
-- linked to a room.
--
-- Populated two ways:
--   * `source = 'manual'`  — a single row added from the admin UI.
--   * `source = 'import'`  — bulk CSV / Excel upload; rows share an import_batch
--                            so a botched import can be rolled back as a unit.
--
-- Admin-internal: all access goes through the service-role client
-- (lib/supabase/admin.ts) which bypasses RLS. We still enable RLS with NO
-- public policy so anon/authenticated clients are denied by default.
--
-- Safe to re-run.

create table if not exists public.revenue_entries (
  id            uuid primary key default gen_random_uuid(),
  occurred_at   date        not null,                       -- when the income was earned
  label         text        not null,                       -- human description ("ค่ากิจกรรมแคมป์ไฟ")
  category      text        not null default 'other',
  amount        integer     not null,                        -- THB, integer (no decimals), may be negative for refunds
  method        text,                                        -- cash / transfer / promptpay / card / other
  customer_name text,                                         -- free-text (imports rarely carry a customer_id)
  room_id       uuid        references public.rooms(id) on delete set null,
  source        text        not null default 'manual',
  import_batch  text,                                         -- groups rows from one upload; null for manual
  note          text,
  created_by    uuid,                                         -- admin_accounts.id (kept loose)
  created_at    timestamptz not null default now()
);

alter table public.revenue_entries drop constraint if exists revenue_entries_category_chk;
alter table public.revenue_entries
  add constraint revenue_entries_category_chk
  check (category in ('room','activity','food','walk_in','deposit','other','refund'));

alter table public.revenue_entries drop constraint if exists revenue_entries_source_chk;
alter table public.revenue_entries
  add constraint revenue_entries_source_chk
  check (source in ('manual','import'));

create index if not exists revenue_entries_occurred_idx
  on public.revenue_entries (occurred_at desc);
create index if not exists revenue_entries_batch_idx
  on public.revenue_entries (import_batch) where import_batch is not null;
create index if not exists revenue_entries_room_idx
  on public.revenue_entries (room_id) where room_id is not null;

alter table public.revenue_entries enable row level security;
-- No policy: deny-by-default for anon/authenticated; service role bypasses RLS.
