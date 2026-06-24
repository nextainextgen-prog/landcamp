-- 007_payment_redesign.sql
--
-- Payment-flow redesign:
--   * bookings gain a 'payment_review' state (slip submitted, awaiting admin).
--     The double-booking EXCLUDE must hold these dates too, so it's recreated.
--   * payment_accounts support a 'qr_code' method (admin-uploaded QR image);
--     account_number becomes optional (QR has no number).
--   * payments store the customer slip image + the background verification
--     verdict (shown to admins only, never to the customer).
--
-- Safe to re-run.

-- ── bookings: payment_review status ──
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check
  check (status in (
    'pending_payment','payment_review','confirmed','cancelled','completed','no_show'
  ));

-- Hold dates for slip-submitted bookings too (else they could be double-booked).
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    room_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (status in ('confirmed','pending_payment','payment_review'));

-- ── payment_accounts: QR-image method ──
alter table public.payment_accounts drop constraint if exists payment_accounts_type_check;
alter table public.payment_accounts
  add constraint payment_accounts_type_check
  check (type in (
    'promptpay_phone','promptpay_id','bank_account','corporate','qr_code'
  ));
alter table public.payment_accounts alter column account_number drop not null;
alter table public.payment_accounts add column if not exists qr_image text;

-- ── payments: slip + verification verdict ──
alter table public.payments
  add column if not exists slip_image    text,
  add column if not exists verify_status text,
  add column if not exists verify_note   text;
