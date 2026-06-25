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
  receiverNameTh: string | null;
  receiverNameEn: string | null;
  paidAt: string | null;
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
      sender?: { account?: { name?: { th?: string; en?: string } } };
      receiver?: {
        account?: {
          name?: { th?: string; en?: string };
          bank?: { account?: string };
        };
      };
    };
  };
};

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
    receiverNameTh: raw?.receiver?.account?.name?.th ?? null,
    receiverNameEn: raw?.receiver?.account?.name?.en ?? null,
    paidAt: raw?.date ?? null,
  };
}
