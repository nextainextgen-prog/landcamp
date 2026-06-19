/**
 * STUB — codex-3 placeholder.
 * TODO: remove once codex-1 lands the canonical types/payment-settings.ts.
 *
 * Shapes kept intentionally minimal — codex-1 owns the canonical definition.
 */

export type PaymentAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch?: string | null;
  qr_url?: string | null;
  notes?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type PaymentAccountInput = {
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  branch?: string | null;
  qr_url?: string | null;
  notes?: string | null;
  sort_order?: number;
};

export type PaymentSettings = {
  id: number;
  deposit_enabled: boolean;
  deposit_percent: number;
  updated_at?: string;
};

export type PaymentSettingsInput = {
  deposit_enabled?: boolean;
  deposit_percent?: number;
};

export type CancellationTier = {
  id: string;
  days_before: number;
  refund_percent: number;
  sort_order: number;
};

export type CancellationTierInput = {
  days_before: number;
  refund_percent: number;
};

export type CancellationPolicy = {
  enabled: boolean;
  tiers: CancellationTier[];
};

export type CancellationPolicyInput = {
  enabled: boolean;
  tiers: CancellationTierInput[];
};
