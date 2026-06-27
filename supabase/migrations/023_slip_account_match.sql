-- 023_slip_account_match.sql
--
-- Backend-driven receiver-account matching for slip verification.
--
-- The receiving account is now configured in the admin backend (payment_accounts)
-- instead of the EasySlip dashboard. When a slip is paid to an account that is
-- NOT one of the configured accounts, the verdict is 'account_mismatch' (routed to
-- manual review, never auto-confirmed). This adds that value to the allowed set.
--
-- Safe to re-run.

alter table public.slip_verifications drop constraint if exists slip_verifications_status_check;
alter table public.slip_verifications add constraint slip_verifications_status_check
  check (verify_status in (
    'matched',
    'duplicate',
    'amount_mismatch',
    'account_mismatch',
    'unreadable',
    'error',
    'pending'
  ));
