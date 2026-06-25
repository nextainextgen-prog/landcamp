-- ─────────────────────────────────────────────
-- 020 · Bookings operations: check-in state, audit log, housekeeping
--   • bookings.checked_in_at   — guest physically checked in (in-house)
--   • booking_audit            — who changed a booking's status & when
--   • housekeeping_tasks       — room cleaning tasks tied to a booking
-- RLS: deny-by-default; the app uses the service role for all admin access.
-- ─────────────────────────────────────────────

-- 1. Check-in timestamp on bookings
alter table public.bookings
  add column if not exists checked_in_at timestamptz;

-- 2. Booking audit log
create table if not exists public.booking_audit (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  actor       text,
  action      text not null,
  from_status text,
  to_status   text,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists booking_audit_booking_idx
  on public.booking_audit (booking_id, created_at desc);

alter table public.booking_audit enable row level security;
-- No policies = deny all for anon/auth; service role bypasses RLS.

-- 3. Housekeeping tasks
create table if not exists public.housekeeping_tasks (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references public.bookings(id) on delete set null,
  room_id     uuid references public.rooms(id) on delete set null,
  status      text not null default 'pending'
                check (status in ('pending','in_progress','done')),
  assignee    text,
  note        text,
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists housekeeping_status_idx
  on public.housekeeping_tasks (status, due_date);
create index if not exists housekeeping_room_idx
  on public.housekeeping_tasks (room_id);

create trigger housekeeping_touch
  before update on public.housekeeping_tasks
  for each row execute function public.touch_updated_at();

alter table public.housekeeping_tasks enable row level security;
-- No policies = deny all for anon/auth; service role bypasses RLS.
