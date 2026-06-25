-- 006_payment_trans_ref.sql
--
-- Records the verified bank-slip reference on each payment so a slip can't be
-- reused across bookings, plus the verification timestamp.
--
-- Safe to re-run.

alter table public.payments
  add column if not exists trans_ref   text,
  add column if not exists verified_at timestamptz;

-- One verified slip (transRef) can settle at most one payment.
create unique index if not exists payments_trans_ref_uniq
  on public.payments (trans_ref)
  where trans_ref is not null;
