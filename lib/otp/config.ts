/**
 * Resolved OTP / SMS configuration — DB settings (editable in
 * /admin/settings/otp) with env-var fallback. Server-only.
 *
 * Customer login is LINE-only today; this exists so a phone-OTP provider can be
 * connected later without a code change. `getOtpConfig()` is the single entry
 * point future OTP-sending code should call. Any DB read failure (table
 * missing, no env) degrades to safe defaults and `otpReady()` reports false
 * rather than crashing.
 */

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type OtpConfig = {
  provider: string;
  apiKey: string;
  apiSecret: string;
  apiBaseUrl: string;
  senderName: string;
  otpLength: number;
  otpTtlSeconds: number;
  cooldownSeconds: number;
  maxAttempts: number;
  enabled: boolean;
};

function envConfig(): OtpConfig {
  return {
    provider: process.env.OTP_PROVIDER ?? "",
    apiKey: process.env.OTP_API_KEY ?? "",
    apiSecret: process.env.OTP_API_SECRET ?? "",
    apiBaseUrl: process.env.OTP_API_BASE_URL ?? "",
    senderName: process.env.OTP_SENDER_NAME ?? "",
    otpLength: 6,
    otpTtlSeconds: 300,
    cooldownSeconds: 60,
    maxAttempts: 5,
    enabled: false,
  };
}

export async function getOtpConfig(): Promise<OtpConfig> {
  const env = envConfig();
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("otp_settings")
      .select(
        "provider, api_key, api_secret, api_base_url, sender_name, otp_length, otp_ttl_seconds, cooldown_seconds, max_attempts, enabled",
      )
      .eq("id", 1)
      .maybeSingle();
    if (!data) return env;
    return {
      provider: (data.provider as string) || env.provider,
      apiKey: (data.api_key as string) || env.apiKey,
      apiSecret: (data.api_secret as string) || env.apiSecret,
      apiBaseUrl: (data.api_base_url as string) || env.apiBaseUrl,
      senderName: (data.sender_name as string) || env.senderName,
      otpLength: typeof data.otp_length === "number" ? data.otp_length : env.otpLength,
      otpTtlSeconds:
        typeof data.otp_ttl_seconds === "number" ? data.otp_ttl_seconds : env.otpTtlSeconds,
      cooldownSeconds:
        typeof data.cooldown_seconds === "number" ? data.cooldown_seconds : env.cooldownSeconds,
      maxAttempts: typeof data.max_attempts === "number" ? data.max_attempts : env.maxAttempts,
      enabled: typeof data.enabled === "boolean" ? data.enabled : env.enabled,
    };
  } catch {
    return env;
  }
}

/**
 * Whether phone OTP can actually run: explicitly enabled AND has the minimum
 * credentials (a provider + an API key). Future OTP-sending code should guard
 * on this before attempting to send a code.
 */
export function otpReady(cfg: OtpConfig): boolean {
  return Boolean(cfg.enabled && cfg.provider && cfg.apiKey);
}
