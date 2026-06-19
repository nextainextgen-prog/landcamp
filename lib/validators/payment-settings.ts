/**
 * STUB — codex-3 placeholder.
 * TODO: remove once codex-1 lands the canonical lib/validators/payment-settings.ts.
 *
 * Lightweight validators returning { ok, data } or { ok, fields }. Routes
 * surface `fields` as part of the 400 error shape.
 */

import type {
  PaymentAccountInput,
  PaymentSettingsInput,
  CancellationPolicyInput,
} from "@/types/payment-settings";

export type ValidationFields = Record<string, string>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; fields: ValidationFields };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function asBoolean(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

const REQUIRED_ACCOUNT_FIELDS = ["bank_name", "account_name", "account_number"] as const;

export function validatePaymentAccountInput(
  input: unknown,
  { partial = false }: { partial?: boolean } = {},
): ValidationResult<PaymentAccountInput> {
  if (!isObject(input)) {
    return { ok: false, fields: { _: "body must be an object" } };
  }

  const fields: ValidationFields = {};
  const data: PaymentAccountInput = {};

  for (const key of REQUIRED_ACCOUNT_FIELDS) {
    const raw = input[key];
    if (raw === undefined) {
      if (!partial) fields[key] = `${key} is required`;
      continue;
    }
    const s = asString(raw);
    if (s === null || s.trim() === "") {
      fields[key] = `${key} must be a non-empty string`;
      continue;
    }
    data[key] = s.trim();
  }

  for (const key of ["branch", "qr_url", "notes"] as const) {
    if (input[key] === undefined) continue;
    if (input[key] === null) {
      data[key] = null;
      continue;
    }
    const s = asString(input[key]);
    if (s === null) {
      fields[key] = `${key} must be a string or null`;
      continue;
    }
    data[key] = s.trim() || null;
  }

  if (input.sort_order !== undefined) {
    const n = asNumber(input.sort_order);
    if (n === null || !Number.isInteger(n) || n < 0) {
      fields.sort_order = "sort_order must be a non-negative integer";
    } else {
      data.sort_order = n;
    }
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, data };
}

export function validatePaymentSettingsInput(
  input: unknown,
): ValidationResult<PaymentSettingsInput> {
  if (!isObject(input)) {
    return { ok: false, fields: { _: "body must be an object" } };
  }

  const fields: ValidationFields = {};
  const data: PaymentSettingsInput = {};

  if (input.deposit_enabled !== undefined) {
    const b = asBoolean(input.deposit_enabled);
    if (b === null) {
      fields.deposit_enabled = "deposit_enabled must be a boolean";
    } else {
      data.deposit_enabled = b;
    }
  }

  if (input.deposit_percent !== undefined) {
    const n = asNumber(input.deposit_percent);
    if (n === null || n < 0 || n > 100) {
      fields.deposit_percent = "deposit_percent must be a number between 0 and 100";
    } else {
      data.deposit_percent = n;
    }
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, data };
}

export function validateCancellationPolicyInput(
  input: unknown,
): ValidationResult<CancellationPolicyInput> {
  if (!isObject(input)) {
    return { ok: false, fields: { _: "body must be an object" } };
  }

  const fields: ValidationFields = {};

  const enabled = asBoolean(input.enabled);
  if (enabled === null) fields.enabled = "enabled must be a boolean";

  const rawTiers = input.tiers;
  if (!Array.isArray(rawTiers)) {
    fields.tiers = "tiers must be an array";
    return { ok: false, fields };
  }

  const tiers: CancellationPolicyInput["tiers"] = [];
  rawTiers.forEach((tier, i) => {
    if (!isObject(tier)) {
      fields[`tiers[${i}]`] = "tier must be an object";
      return;
    }
    const days = asNumber(tier.days_before);
    const pct = asNumber(tier.refund_percent);
    if (days === null || !Number.isInteger(days) || days < 0) {
      fields[`tiers[${i}].days_before`] = "days_before must be a non-negative integer";
    }
    if (pct === null || pct < 0 || pct > 100) {
      fields[`tiers[${i}].refund_percent`] = "refund_percent must be a number between 0 and 100";
    }
    if (days !== null && pct !== null) {
      tiers.push({ days_before: days, refund_percent: pct });
    }
  });

  if (Object.keys(fields).length > 0 || enabled === null) {
    return { ok: false, fields };
  }
  return { ok: true, data: { enabled, tiers } };
}
