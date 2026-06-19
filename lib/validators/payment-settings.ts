/**
 * Runtime validators for Payment Settings API payloads.
 *
 * Hand-rolled (no zod) so package.json stays untouched. Each validator returns
 * a discriminated union so callers can branch on `ok` without re-checking
 * field shapes. Output `data` shape is the cleaned, type-narrowed payload
 * ready to hand to Supabase.
 *
 * Consumed by /api/admin/payment-* route handlers in codex-3's scope.
 */

import type { PaymentAccountType } from "@/types/payment-settings";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: Record<string, string> };

const PAYMENT_ACCOUNT_TYPES: readonly PaymentAccountType[] = [
  "promptpay_phone",
  "promptpay_id",
  "bank_account",
  "corporate",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asOptionalTrimmedString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (!Number.isInteger(value)) return null;
  return value;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

// ─────────────────────────────────────────────
// PaymentAccount input
// Used for POST /api/admin/payment-accounts and PATCH /[id]
// All fields are optional at the type level so the same validator can power
// both create and partial-update; callers pass `partial: true` for PATCH.
// ─────────────────────────────────────────────

export interface PaymentAccountInput {
  type?: PaymentAccountType;
  account_name?: string;
  bank?: string | null;
  account_number?: string;
  is_active?: boolean;
  sort_order?: number;
}

export function validatePaymentAccountInput(
  input: unknown,
  options: { partial?: boolean } = {},
): ValidationResult<PaymentAccountInput> {
  const errors: Record<string, string> = {};

  if (!isPlainObject(input)) {
    return { ok: false, errors: { _root: "Body must be a JSON object." } };
  }

  const partial = options.partial === true;
  const data: PaymentAccountInput = {};

  // type
  if (input.type !== undefined) {
    if (
      typeof input.type !== "string" ||
      !PAYMENT_ACCOUNT_TYPES.includes(input.type as PaymentAccountType)
    ) {
      errors.type = `type must be one of: ${PAYMENT_ACCOUNT_TYPES.join(", ")}.`;
    } else {
      data.type = input.type as PaymentAccountType;
    }
  } else if (!partial) {
    errors.type = "type is required.";
  }

  // account_name
  if (input.account_name !== undefined) {
    const name = asTrimmedString(input.account_name);
    if (name === null) {
      errors.account_name = "account_name must be a non-empty string.";
    } else {
      data.account_name = name;
    }
  } else if (!partial) {
    errors.account_name = "account_name is required.";
  }

  // bank (optional, nullable)
  if (input.bank !== undefined) {
    const bank = asOptionalTrimmedString(input.bank);
    if (bank === undefined) {
      errors.bank = "bank must be a string or null.";
    } else {
      data.bank = bank;
    }
  }

  // account_number
  if (input.account_number !== undefined) {
    const num = asTrimmedString(input.account_number);
    if (num === null) {
      errors.account_number = "account_number must be a non-empty string.";
    } else {
      data.account_number = num;
    }
  } else if (!partial) {
    errors.account_number = "account_number is required.";
  }

  // is_active (optional)
  if (input.is_active !== undefined) {
    const active = asBoolean(input.is_active);
    if (active === null) {
      errors.is_active = "is_active must be a boolean.";
    } else {
      data.is_active = active;
    }
  }

  // sort_order (optional)
  if (input.sort_order !== undefined) {
    const order = asInteger(input.sort_order);
    if (order === null) {
      errors.sort_order = "sort_order must be an integer.";
    } else {
      data.sort_order = order;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data };
}

// ─────────────────────────────────────────────
// PaymentSettings input (singleton)
// PATCH /api/admin/payment-settings — both fields optional.
// ─────────────────────────────────────────────

export interface PaymentSettingsInput {
  deposit_enabled?: boolean;
  deposit_percent?: number;
}

export function validatePaymentSettingsInput(
  input: unknown,
): ValidationResult<PaymentSettingsInput> {
  const errors: Record<string, string> = {};

  if (!isPlainObject(input)) {
    return { ok: false, errors: { _root: "Body must be a JSON object." } };
  }

  const data: PaymentSettingsInput = {};

  if (input.deposit_enabled !== undefined) {
    const enabled = asBoolean(input.deposit_enabled);
    if (enabled === null) {
      errors.deposit_enabled = "deposit_enabled must be a boolean.";
    } else {
      data.deposit_enabled = enabled;
    }
  }

  if (input.deposit_percent !== undefined) {
    const percent = asInteger(input.deposit_percent);
    if (percent === null) {
      errors.deposit_percent = "deposit_percent must be an integer.";
    } else if (percent < 1 || percent > 100) {
      errors.deposit_percent = "deposit_percent must be between 1 and 100.";
    } else {
      data.deposit_percent = percent;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data };
}

// ─────────────────────────────────────────────
// CancellationPolicy input
// PUT /api/admin/cancellation-policy — replace-all tiers, plus enabled flag.
// ─────────────────────────────────────────────

export interface CancellationPolicyTierInput {
  days_before: number;
  refund_percent: number;
  sort_order?: number;
}

export interface CancellationPolicyInput {
  enabled: boolean;
  tiers: CancellationPolicyTierInput[];
}

export function validateCancellationPolicyInput(
  input: unknown,
): ValidationResult<CancellationPolicyInput> {
  const errors: Record<string, string> = {};

  if (!isPlainObject(input)) {
    return { ok: false, errors: { _root: "Body must be a JSON object." } };
  }

  const enabled = asBoolean(input.enabled);
  if (enabled === null) {
    errors.enabled = "enabled must be a boolean.";
  }

  const cleanedTiers: CancellationPolicyTierInput[] = [];

  if (!Array.isArray(input.tiers)) {
    errors.tiers = "tiers must be an array.";
  } else {
    input.tiers.forEach((raw, index) => {
      if (!isPlainObject(raw)) {
        errors[`tiers[${index}]`] = "tier must be an object.";
        return;
      }

      const days = asInteger(raw.days_before);
      if (days === null) {
        errors[`tiers[${index}].days_before`] =
          "days_before must be an integer.";
      } else if (days < 0) {
        errors[`tiers[${index}].days_before`] =
          "days_before must be >= 0.";
      }

      const refund = asInteger(raw.refund_percent);
      if (refund === null) {
        errors[`tiers[${index}].refund_percent`] =
          "refund_percent must be an integer.";
      } else if (refund < 0 || refund > 100) {
        errors[`tiers[${index}].refund_percent`] =
          "refund_percent must be between 0 and 100.";
      }

      let sortOrder: number | undefined;
      if (raw.sort_order !== undefined) {
        const order = asInteger(raw.sort_order);
        if (order === null) {
          errors[`tiers[${index}].sort_order`] =
            "sort_order must be an integer.";
        } else {
          sortOrder = order;
        }
      }

      if (
        days !== null &&
        days >= 0 &&
        refund !== null &&
        refund >= 0 &&
        refund <= 100
      ) {
        cleanedTiers.push({
          days_before: days,
          refund_percent: refund,
          ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
        });
      }
    });
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      enabled: enabled as boolean,
      tiers: cleanedTiers,
    },
  };
}
