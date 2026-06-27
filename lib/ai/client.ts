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

/** System prompt with the current page interpolated. */
export function buildSystemPrompt(currentPage: string): string {
  return [
    'คุณคือ "น้องแคมป์" AI ผู้ช่วยของระบบ LandCamp Villa',
    "คุณมีสิทธิ์เข้าถึงข้อมูลทั้งหมดในระบบ และสามารถตอบคำถาม วิเคราะห์ข้อมูล และสร้างรายงานได้",
    "ตอบเป็นภาษาไทยเสมอ กระชับ ตรงประเด็น เป็นมืออาชีพแต่เป็นกันเอง",
    "ถ้าต้องการข้อมูลจากระบบให้ใช้ function calling เท่านั้น อย่าคาดเดาตัวเลขหรือข้อมูลเอง",
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
