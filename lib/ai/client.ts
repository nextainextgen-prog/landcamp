/**
 * Shared Gemini client + prompt config for "น้องแคมป์".
 * Server-only — reads GEMINI_API_KEY from the environment, never hardcoded.
 */

import "server-only";

import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash";

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
