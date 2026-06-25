-- 014_customer_profile_tax.sql
--
-- Customer profile completion + tax (billing) details.
--
--   * Online customers sign in via LINE/Google OAuth, which only yields a
--     display name + avatar — never a phone number. This adds a "completed
--     profile" marker so the booking flow can ask for name + phone once, and
--     the backoffice can see which customers have real contact details.
--   * Tax fields back the invoice/billing block on the customer detail page
--     (เลขผู้เสียภาษี / ที่อยู่ออกใบกำกับ / VAT vs Non-VAT).
--
-- `phone` already exists (migration 004) and is indexed (migration 012); we do
-- NOT re-add either here.
--
-- Safe to re-run.

-- ─────────────────────────────────────────────
-- 1. Profile completion
-- ─────────────────────────────────────────────
alter table public.customers
  add column if not exists profile_completed_at timestamptz,
  add column if not exists phone_verified       boolean not null default false;

-- ─────────────────────────────────────────────
-- 2. Tax / billing details
-- ─────────────────────────────────────────────
alter table public.customers
  add column if not exists tax_id       text,    -- เลขประจำตัวผู้เสียภาษี (13 หลัก)
  add column if not exists tax_name      text,   -- ชื่อผู้เสียภาษี / ชื่อบริษัท (ถ้าต่างจาก full_name)
  add column if not exists tax_address   text,   -- ที่อยู่ออกใบกำกับ
  add column if not exists tax_branch    text,   -- สาขา (เช่น "สำนักงานใหญ่")
  add column if not exists is_vat        boolean not null default false; -- VAT vs Non-VAT
