import { headers } from "next/headers";
import { AccountsCard } from "./AccountsCard";
import { DepositCard } from "./DepositCard";
import { CancellationCard } from "./CancellationCard";
import type {
  CancellationPolicy,
  PaymentAccount,
  PaymentSettings,
} from "./types";

// API routes are owned by codex-3 and may not exist yet. Until they do, the
// page must still render — each fetch is wrapped in a guarded helper that
// returns a sane default on any failure.

export const dynamic = "force-dynamic";

async function getRequestContext(): Promise<{ base: string; cookie: string }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return { base: `${proto}://${host}`, cookie: h.get("cookie") ?? "" };
}

async function safeGet<T>(
  url: string,
  fallback: T,
  pick: (json: unknown) => T,
  cookie: string,
): Promise<T> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      // Forward the admin's session so /api/admin/* requireAdmin() passes.
      headers: { accept: "application/json", cookie },
    });
    if (!res.ok) return fallback;
    return pick(await res.json());
  } catch {
    return fallback;
  }
}

const DEFAULT_SETTINGS: PaymentSettings = {
  deposit_enabled: false,
  deposit_percent: 50,
};

const DEFAULT_POLICY: CancellationPolicy = {
  enabled: false,
  tiers: [
    { days_before: 30, refund_percent: 100 },
    { days_before: 14, refund_percent: 50 },
    { days_before: 7, refund_percent: 0 },
  ],
};

export default async function PaymentSettingsPage() {
  const { base, cookie } = await getRequestContext();
  const [accounts, settings, policy] = await Promise.all([
    safeGet<PaymentAccount[]>(
      `${base}/api/admin/payment-accounts`,
      [],
      (json) => (json as { accounts: PaymentAccount[] }).accounts ?? [],
      cookie,
    ),
    safeGet<PaymentSettings>(
      `${base}/api/admin/payment-settings`,
      DEFAULT_SETTINGS,
      (json) =>
        (json as { settings: PaymentSettings }).settings ?? DEFAULT_SETTINGS,
      cookie,
    ),
    safeGet<CancellationPolicy>(
      `${base}/api/admin/cancellation-policy`,
      DEFAULT_POLICY,
      (json) =>
        (json as { policy: CancellationPolicy }).policy ?? DEFAULT_POLICY,
      cookie,
    ),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          ตั้งค่าการเงิน
        </h1>
        <p className="text-sm text-neutral-500">
          จัดการบัญชีรับเงิน เงินมัดจำ และนโยบายการยกเลิก
        </p>
      </header>

      <AccountsCard initialAccounts={accounts} />
      <DepositCard initialSettings={settings} />
      <CancellationCard initialPolicy={policy} />
    </div>
  );
}
