import type { SupabaseClient } from "@supabase/supabase-js";

import type { PaymentKind } from "@/types/payment";
import type { PaymentAccount, PaymentAccountType } from "@/types/payment-settings";

/**
 * The active account a PromptPay QR can be generated for. QR generation only
 * supports PromptPay (phone / national id), so bank_account/corporate accounts
 * are skipped here even when active — they're display-only.
 */
const QR_TYPES: PaymentAccountType[] = ["promptpay_phone", "promptpay_id"];

export async function getActivePromptPayAccount(
  admin: SupabaseClient,
): Promise<PaymentAccount | null> {
  const { data } = await admin
    .from("payment_accounts")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (!data?.length) return null;
  const accounts = data as PaymentAccount[];
  // Prefer phone, then national id.
  for (const type of QR_TYPES) {
    const match = accounts.find((a) => a.type === type);
    if (match) return match;
  }
  return null;
}

export type DepositPlan = { amount: number; kind: PaymentKind; depositPercent: number | null };

/**
 * Resolves how much to charge now from the singleton payment_settings:
 * a deposit (percentage of total, rounded up) when enabled, else the full
 * total. Reads /admin/payment-settings config.
 */
export async function resolveAmountDue(
  admin: SupabaseClient,
  total: number,
): Promise<DepositPlan> {
  const { data } = await admin
    .from("payment_settings")
    .select("deposit_enabled, deposit_percent")
    .eq("id", 1)
    .maybeSingle();

  if (data?.deposit_enabled) {
    const percent = data.deposit_percent ?? 50;
    return { amount: Math.ceil((total * percent) / 100), kind: "deposit", depositPercent: percent };
  }
  return { amount: total, kind: "full", depositPercent: null };
}
