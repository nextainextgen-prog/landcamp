import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { getGeminiClient, buildSystemPrompt, generateContentResilient, isTransientGeminiError } from "@/lib/ai/client";
import { functionDeclarations, dispatchFunction } from "@/lib/ai/functions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "model"; content: string };
type Json = Record<string, unknown>;

/** Function results worth offering as a downloadable PDF, mapped to a layout. */
const REPORT_TYPE: Record<string, "revenue" | "bookings" | "summary"> = {
  getRevenueReport: "revenue",
  getBookings: "bookings",
  getUpcomingCheckIns: "bookings",
  getCancellations: "bookings",
  getDashboardSummary: "summary",
};

const MAX_HISTORY = 20;
const MAX_TOOL_ROUNDS = 6;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ai = getGeminiClient();
  if (!ai) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ — กรุณาเพิ่มคีย์ใน .env ก่อนใช้งานน้องแคมป์" },
      { status: 503 },
    );
  }

  let body: { messages?: ChatMessage[]; currentPage?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  // Keep the last N messages, but Gemini requires the transcript to start with a
  // user turn — drop any leading model messages (e.g. the proactive report).
  const trimmed = (body.messages ?? []).slice(-MAX_HISTORY);
  const firstUser = trimmed.findIndex((m) => m.role === "user");
  const history = firstUser >= 0 ? trimmed.slice(firstUser) : [];
  if (history.length === 0) return NextResponse.json({ error: "ไม่มีข้อความ" }, { status: 400 });

  // Gemini Content[] — only user/model roles carry text here.
  const contents: { role: string; parts: { text?: string; functionResponse?: Json }[] }[] = history.map((m) => ({
    role: m.role === "model" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const systemInstruction = buildSystemPrompt(body.currentPage ?? "");
  let report: { type: string; title: string; data: Json } | null = null;

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const res = await generateContentResilient(ai, {
        contents,
        config: { systemInstruction, tools: [{ functionDeclarations }], temperature: 0.3 },
      });

      const calls = res.functionCalls;
      if (!calls || calls.length === 0) {
        return NextResponse.json({ reply: res.text ?? "ขออภัยครับ ตอบไม่ได้ในตอนนี้", report });
      }

      // Echo the model's tool-call turn back into the transcript.
      const modelContent = res.candidates?.[0]?.content;
      if (modelContent) contents.push(modelContent as (typeof contents)[number]);

      const responseParts: { functionResponse: Json }[] = [];
      for (const call of calls) {
        const name = call.name ?? "";
        const result = await dispatchFunction(name, (call.args ?? {}) as Json);
        responseParts.push({ functionResponse: { name, response: result } });
        // Remember the latest report-worthy, non-error result for the PDF button.
        if (REPORT_TYPE[name] && !("error" in result)) {
          report = { type: REPORT_TYPE[name], title: reportTitle(name), data: result };
        }
      }
      contents.push({ role: "user", parts: responseParts });
    }
    // Tool loop exhausted without a final text answer.
    return NextResponse.json({ reply: "ดึงข้อมูลซับซ้อนเกินไปครับ ลองถามใหม่แบบเจาะจงขึ้นได้ไหม", report });
  } catch (e) {
    if (isTransientGeminiError(e)) {
      return NextResponse.json(
        { error: "ตอนนี้ระบบ AI มีผู้ใช้งานหนาแน่นชั่วคราว ลองถามใหม่อีกครั้งในอีกสักครู่นะครับ" },
        { status: 503 },
      );
    }
    const detail = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: `น้องแคมป์เชื่อมต่อ AI ไม่สำเร็จ: ${detail}` }, { status: 502 });
  }
}

function reportTitle(name: string): string {
  switch (name) {
    case "getRevenueReport":
      return "รายงานรายได้";
    case "getBookings":
      return "รายการจอง";
    case "getUpcomingCheckIns":
      return "เช็คอินที่กำลังจะมาถึง";
    case "getCancellations":
      return "รายการยกเลิก";
    case "getDashboardSummary":
      return "ภาพรวมระบบ";
    default:
      return "รายงาน";
  }
}
