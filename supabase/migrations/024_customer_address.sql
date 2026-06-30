-- 024_customer_address.sql
--
-- Customer contact / billing address, collected from the customer themselves on
-- the profile-completion (registration) form.
--
--   * Distinct from `tax_address` (migration 014): that one is the formal
--     tax-invoice address entered by staff in the CRM tab. This is the plain
--     address the guest types about themselves, used for receipt records.
--   * Team-only: it is shown in the back office (customer profile + bookings
--     list) but is NEVER rendered on the customer-facing booking document.
--
-- Safe to re-run.

alter table public.customers
  add column if not exists address text; -- ที่อยู่ลูกค้า (กรอกเองตอนลงทะเบียน)
