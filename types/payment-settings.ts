/**
 * Payment settings types (mirrors supabase/migrations/003_payment_settings.sql).
 * Field names are snake_case to match the DB rows exactly.
 */

export type PaymentAccountType =
  | "promptpay_phone"
  | "promptpay_id"
  | "bank_account"
  | "corporate";

export interface PaymentAccount {
  id: string;
  type: PaymentAccountType;
  account_name: string;
  bank: string | null;
  account_number: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentSettings {
  id: 1;
  deposit_enabled: boolean;
  deposit_percent: number;
  updated_at: string;
}

export interface CancellationPolicy {
  id: 1;
  enabled: boolean;
  updated_at: string;
}

export interface CancellationPolicyTier {
  id: string;
  days_before: number;
  refund_percent: number;
  sort_order: number;
  created_at: string;
}
