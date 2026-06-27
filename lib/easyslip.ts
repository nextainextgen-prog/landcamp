// EasySlip API client — bank-slip verification (server-only, EASYSLIP_API_KEY).
// Docs: https://document.easyslip.com
// Note: PromptPay QR *generation* was removed — payment now shows the admin's
// configured account / uploaded QR, and slips are verified in the background.

const BASE_URL = "https://api.easyslip.com";

function apiKey(): string {
  const key = process.env.EASYSLIP_API_KEY;
  if (!key) {
    throw new Error("EASYSLIP_API_KEY is required for payment operations.");
  }
  return key;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey()}`,
    "Content-Type": "application/json",
  };
}

// ── Slip verification ─────────────────────────
export type VerifyResult = {
  success: boolean;
  message: string | null;
  amountInSlip: number | null;
  isAmountMatched: boolean;
  isDuplicate: boolean;
  transRef: string | null;
  receiverAccount: string | null;
  senderName: string | null;
  /** Sender's bank, human-readable (Thai name, falling back to short code). */
  senderBank: string | null;
  receiverNameTh: string | null;
  receiverNameEn: string | null;
  /** Receiver's bank, human-readable (Thai name, falling back to short code). */
  receiverBank: string | null;
  paidAt: string | null;
  ref1: string | null;
  ref2: string | null;
  ref3: string | null;
  /** The full rawSlip object from EasySlip, for audit/history (stored as jsonb). */
  raw: unknown;
};

type RawBank = { id?: string; name?: string; short?: string };
type RawParty = {
  bank?: RawBank;
  account?: {
    name?: { th?: string; en?: string };
    bank?: { type?: string; account?: string };
  };
};

type RawVerify = {
  success?: boolean;
  message?: string;
  data?: {
    isDuplicate?: boolean;
    amountInSlip?: number;
    isAmountMatched?: boolean;
    rawSlip?: {
      transRef?: string;
      date?: string;
      amount?: { amount?: number };
      ref1?: string;
      ref2?: string;
      ref3?: string;
      sender?: RawParty;
      receiver?: RawParty & {
        account?: { bank?: { account?: string } };
      };
    };
  };
};

/** A bank's display name: Thai name first, then short code (e.g. "KBANK"). */
function bankLabel(bank: RawBank | undefined): string | null {
  return bank?.name ?? bank?.short ?? null;
}

/**
 * Verifies a bank-transfer slip. Provide exactly one of `payload` (QR string)
 * or `base64` (image data, no data: prefix). Passing `matchAmount` asks
 * EasySlip to flag amount mismatches; `matchAccount` validates the receiver
 * against accounts registered in the EasySlip dashboard. Always checks for
 * duplicate submissions.
 */
export async function verifyBankSlip(opts: {
  payload?: string;
  base64?: string;
  matchAmount?: number;
  matchAccount?: boolean;
}): Promise<VerifyResult> {
  const body: Record<string, unknown> = { checkDuplicate: true };
  if (opts.payload) body.payload = opts.payload;
  if (opts.base64) body.base64 = opts.base64;
  if (opts.matchAmount != null) body.matchAmount = opts.matchAmount;
  if (opts.matchAccount) body.matchAccount = true;

  const res = await fetch(`${BASE_URL}/v2/verify/bank`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const json = ((await res.json().catch(() => null)) ?? {}) as RawVerify;
  const data = json.data;
  const raw = data?.rawSlip;

  return {
    success: Boolean(json.success) && res.ok,
    message: json.message ?? null,
    amountInSlip: data?.amountInSlip ?? raw?.amount?.amount ?? null,
    isAmountMatched: Boolean(data?.isAmountMatched),
    isDuplicate: Boolean(data?.isDuplicate),
    transRef: raw?.transRef ?? null,
    receiverAccount: raw?.receiver?.account?.bank?.account ?? null,
    senderName: raw?.sender?.account?.name?.th ?? raw?.sender?.account?.name?.en ?? null,
    senderBank: bankLabel(raw?.sender?.bank),
    receiverNameTh: raw?.receiver?.account?.name?.th ?? null,
    receiverNameEn: raw?.receiver?.account?.name?.en ?? null,
    receiverBank: bankLabel(raw?.receiver?.bank),
    paidAt: raw?.date ?? null,
    ref1: raw?.ref1 ?? null,
    ref2: raw?.ref2 ?? null,
    ref3: raw?.ref3 ?? null,
    raw: raw ?? null,
  };
}

// ── Receiver-account matching (backend-driven) ────────────────────────────
// We no longer rely on EasySlip's dashboard-registered accounts (matchAccount).
// Instead the admin configures the receiving account(s) in /admin/payment-settings
// (the payment_accounts table) and we match the slip's receiver account against
// them here — so the receiving account is managed entirely from our backend.

/** Digits only — strips masking chars, spaces, and dashes. */
export function normalizeAccountDigits(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

/**
 * Masked-aware receiver match. EasySlip usually returns the receiver account
 * with only the last 4 digits visible (e.g. "xxx-x-x4019-x"), so we match on the
 * trailing 4 digits against any configured account number. Returns false when the
 * slip exposes fewer than 4 digits (can't safely match).
 */
export function slipAccountMatches(
  slipAccount: string | null,
  configured: Array<string | null | undefined>,
): boolean {
  const tail = normalizeAccountDigits(slipAccount).slice(-4);
  if (tail.length < 4) return false;
  return configured.some((acc) => {
    const d = normalizeAccountDigits(acc);
    return d.length >= 4 && d.slice(-4) === tail;
  });
}
