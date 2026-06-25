import { z } from "zod";

/**
 * Customer-facing profile completion (name + phone), collected once after the
 * first LINE/Google sign-in. Kept separate from the admin CRM schemas — this
 * one is written by the customer themselves via /api/customer/profile.
 */

/** Strip spaces / dashes / parens so "08x-xxx xxxx" validates and stores clean. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

// Thai mobile/landline: 9–10 digits starting with 0 (e.g. 0812345678, 021234567).
const thaiPhone = z
  .string()
  .trim()
  .transform(normalizePhone)
  .pipe(z.string().regex(/^0\d{8,9}$/, "เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)"));

export const CompleteProfileSchema = z.object({
  fullName: z.string().trim().min(2, "กรุณากรอกชื่อ").max(80),
  phone: thaiPhone,
});
export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>;
