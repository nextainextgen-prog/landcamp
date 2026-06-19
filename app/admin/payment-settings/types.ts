// TODO(codex-1): replace this local mirror by importing from
// `@/types/payment-settings` once codex-1 ships the canonical file.
// Field names MUST stay identical to the canonical types so the
// switch-over is a no-op import rewrite.

export type PaymentAccountType =
  | "promptpay_phone"
  | "promptpay_id"
  | "bank_account"
  | "corporate";

export type PaymentAccount = {
  id: string;
  type: PaymentAccountType;
  name: string;
  bank: string | null;
  account_number: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PaymentAccountInput = {
  type: PaymentAccountType;
  name: string;
  bank: string | null;
  account_number: string;
  is_active: boolean;
};

export type PaymentSettings = {
  deposit_enabled: boolean;
  deposit_percent: number;
};

export type CancellationTier = {
  days_before: number;
  refund_percent: number;
};

export type CancellationPolicy = {
  enabled: boolean;
  tiers: CancellationTier[];
};
