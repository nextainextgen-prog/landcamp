import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { loadCardData } from "@/lib/notify/booking";
import { buildCardFlex, type LineCardConfig } from "@/lib/line/cards";
import { pushLineMessages } from "@/lib/line/messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Test-send a (possibly unsaved) LINE card to the real customer of a given
 * booking UUID, so an admin can preview the live result before saving/using it.
 */
export async function POST(request: NextRequest) {
  if (!(await requireSection("settings")).ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  let body: { bookingId?: string; config?: LineCardConfig };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const bookingId = (body.bookingId ?? "").trim();
  if (!bookingId) {
    return NextResponse.json({ error: "กรุณากรอก UUID การจอง" }, { status: 400 });
  }
  if (!body.config) {
    return NextResponse.json({ error: "ไม่มีข้อมูลการ์ด" }, { status: 400 });
  }

  const data = await loadCardData(bookingId);
  if (!data) {
    return NextResponse.json({ error: "ไม่พบการจองตาม UUID นี้" }, { status: 404 });
  }
  if (!data.lineUserId) {
    return NextResponse.json(
      { error: "ลูกค้ารายนี้ยังไม่ได้เชื่อมบัญชี LINE — ส่งทดสอบไม่ได้" },
      { status: 422 },
    );
  }

  const ok = await pushLineMessages(data.lineUserId, [buildCardFlex(body.config, data.vars)]);
  if (!ok) {
    return NextResponse.json(
      { error: "ส่งไม่สำเร็จ — ตรวจการตั้งค่า LINE OA / access token" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sentTo: data.vars.name });
}
