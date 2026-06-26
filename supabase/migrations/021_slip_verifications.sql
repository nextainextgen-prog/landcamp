-- 021_slip_verifications.sql
--
-- Slip verification HISTORY — one row per verification attempt.
--
-- Until now each customer slip OVERWROTE the verdict columns on its payments
-- row (006/007), so re-submissions and rejected slips left no trail. This table
-- records every EasySlip check (matched / duplicate / amount_mismatch /
-- unreadable / error) so /admin/slips can show a full audit log, and so the
-- duplicate guard has a queryable record independent of EasySlip.
--
-- The receiver name/bank is recorded straight from what EasySlip verified
-- (receiver_name / receiver_bank) — EasySlip's dashboard is the single source of
-- truth for receiving accounts, so we do NOT cross-link to payment_accounts.
--
-- trans_ref here is intentionally NOT unique (duplicates must stay in history).
-- The hard "one transfer settles one payment" guard remains the unique index on
-- payments.trans_ref (006).
--
-- Safe to re-run.

create table if not exists public.slip_verifications (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  booking_id          uuid references public.bookings(id) on delete set null,
  payment_id          uuid references public.payments(id) on delete set null,
  api_success         boolean not null default false,
  verify_status       text not null,
  is_duplicate        boolean not null default false,
  trans_ref           text,
  amount_in_slip      numeric,
  amount_expected     numeric,
  is_amount_matched   boolean not null default false,
  sender_name         text,
  sender_bank         text,
  receiver_name       text,
  receiver_bank       text,
  receiver_account    text,
  slip_paid_at        timestamptz,
  ref1                text,
  ref2                text,
  ref3                text,
  slip_url            text,
  message             text,
  raw                 jsonb
);

-- Allowed verdicts (added separately so a paste of the CREATE never trips on the
-- multi-value list). Drop-then-add keeps it idempotent.
alter table public.slip_verifications drop constraint if exists slip_verifications_status_check;
alter table public.slip_verifications add constraint slip_verifications_status_check
  check (verify_status in ('matched','duplicate','amount_mismatch','unreadable','error','pending'));

create index if not exists slip_verifications_created_idx on public.slip_verifications (created_at desc);
create index if not exists slip_verifications_booking_idx on public.slip_verifications (booking_id);
create index if not exists slip_verifications_trans_ref_idx on public.slip_verifications (trans_ref);

-- RLS: deny-by-default (all access via service-role API routes, like 003).
alter table public.slip_verifications enable row level security;

drop policy if exists "slip_verifications deny anon" on public.slip_verifications;
create policy "slip_verifications deny anon" on public.slip_verifications for all to anon using (false) with check (false);

drop policy if exists "slip_verifications deny authenticated" on public.slip_verifications;
create policy "slip_verifications deny authenticated" on public.slip_verifications for all to authenticated using (false) with check (false);
