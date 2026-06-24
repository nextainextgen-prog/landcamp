-- 008_account_name_en.sql
--
-- Bilingual account holder names: keep account_name as the Thai name and add
-- an English name. For qr_code accounts these can be auto-filled by reading
-- the uploaded QR image (EasySlip OCR).
--
-- Safe to re-run.

alter table public.payment_accounts
  add column if not exists account_name_en text;
