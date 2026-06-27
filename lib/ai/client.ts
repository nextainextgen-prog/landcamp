/**
 * Shared Gemini client + prompt config for "น้องแคมป์".
 * Server-only — reads GEMINI_API_KEY from the environment, never hardcoded.
 */

import "server-only";

import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";

/**
 * Model preference chain. We try the primary first; on transient overload
 * (503 / UNAVAILABLE / 429) we retry, then fall back to the next model so a
 * busy "flash" model doesn't take น้องแคมป์ down with it.
 */
export const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;
export const GEMINI_MODEL = GEMINI_MODELS[0];

/** Returns a client, or null when no API key is configured (callers handle it). */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

/** Today in Asia/Bangkok — both ISO (for function args) and Thai (Buddhist year). */
function bangkokNow(): { iso: string; thai: string } {
  const d = new Date(Date.now() + 7 * 3600 * 1000); // shift to UTC+7, then read UTC parts
  const iso = d.toISOString().slice(0, 10);
  const thai = `${d.getUTCDate()} ${TH_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
  return { iso, thai };
}

/** System prompt with the current date + page interpolated. */
export function buildSystemPrompt(currentPage: string): string {
  const { iso, thai } = bangkokNow();
  return [
    'คุณคือ "น้องแคมป์" AI ผู้ช่วยของระบบ LandCamp Villa',
    "คุณมีสิทธิ์เข้าถึงข้อมูลทั้งหมดในระบบ และสามารถตอบคำถาม วิเคราะห์ข้อมูล และสร้างรายงานได้",
    "ตอบเป็นภาษาไทยเสมอ กระชับ ตรงประเด็น เป็นมืออาชีพแต่เป็นกันเอง",
    "ถ้าต้องการข้อมูลจากระบบให้ใช้ function calling เท่านั้น อย่าคาดเดาตัวเลขหรือข้อมูลเอง",
    // Gemini doesn't know the real date and otherwise defaults to its training era
    // (~พ.ศ. 2566). Pin it so narration AND any date passed to functions are correct.
    `วันที่ปัจจุบันตามเวลาประเทศไทยคือ ${thai} (รูปแบบ ISO: ${iso})`,
    `เมื่ออ้างถึง "วันนี้/เดือนนี้/ปีนี้" หรือต้องส่งวันที่ให้ function ให้ยึดวันที่ ${iso} นี้เสมอ ห้ามใช้ปีอื่น`,
    `ปัจจุบันผู้ใช้อยู่ที่หน้า: ${currentPage || "ไม่ทราบ"}`,
  ].join("\n");
}

/** True for transient/overload errors that are worth retrying or falling back on. */
export function isTransientGeminiError(e: unknown): boolean {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return /\b(503|429)\b|unavailable|overloaded|high demand|resource_exhausted|try again|temporarily/.test(msg);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type GenParams = Omit<Parameters<GoogleGenAI["models"]["generateContent"]>[0], "model">;

/**
 * generateContent with retry + model fallback. Retries each model up to 3 times
 * with exponential backoff on transient overload, then moves to the next model
 * in GEMINI_MODELS. Non-transient errors (bad request, auth) throw immediately.
 */
export async function generateContentResilient(
  ai: GoogleGenAI,
  params: GenParams,
): Promise<GenerateContentResponse> {
  let lastErr: unknown;
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await ai.models.generateContent({ model, ...params });
      } catch (e) {
        lastErr = e;
        if (!isTransientGeminiError(e)) throw e;
        if (attempt < 2) await sleep(400 * 2 ** attempt); // 400ms, 800ms
      }
    }
    // This model stayed overloaded — fall through to the next one.
  }
  throw lastErr;
}
