import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { loadCardData } from "@/lib/notify/booking";
import { buildCardFlex, type LineCardConfig } from "@/lib/line/cards";
import { pushLineMessages } from "@/lib/line/messaging";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/data/siteConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINE_USER_RE = /^U[0-9a-f]{32}$/i;

/** Placeholder values used when there's no real booking behind the test. */
function sampleVars(name: string | null): Record<string, string> {
  return {
    name: name || "ลูกค้า",
    booking_code: "LC-2026-0001",
    room: "วิลล่า 1 · Villa 1",
    check_in: "27 มิ.ย. 2569",
    check_out: "28 มิ.ย. 2569",
    total: "4,500",
    receipt_url: siteConfig.seo.siteUrl,
    map_url: siteConfig.contact.googleMaps,
  };
}

/**
 * Test-send a (possibly unsaved) LINE card. Accepts a booking UUID (real values),
 * a customer UUID, or a raw LINE user id — so an admin can preview the live card
 * even when no booking exists yet (sample values are used in that case).
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

  const target = (body.bookingId ?? "").trim();
  if (!target) {
    return NextResponse.json({ error: "กรุณากรอก UUID การจอง / ลูกค้า" }, { status: 400 });
  }
  if (!body.config) {
    return NextResponse.json({ error: "ไม่มีข้อมูลการ์ด" }, { status: 400 });
  }

  let lineUserId: string | null = null;
  let vars: Record<string, string> | null = null;
  let sentTo = "ลูกค้า";

  // 1) Try as a booking — uses that booking's real values.
  const booking = await loadCardData(target);
  if (booking) {
    if (!booking.lineUserId) {
      return NextResponse.json(
        { error: "ลูกค้าของการจองนี้ยังไม่ได้เชื่อมบัญชี LINE — ส่งทดสอบไม่ได้" },
        { status: 422 },
      );
    }
    lineUserId = booking.lineUserId;
    vars = booking.vars;
    sentTo = booking.vars.name;
  } else {
    // 2) Try as a customer UUID — send with sample values (no booking needed).
    const admin = createSupabaseAdminClient();
    const { data: customer } = await admin
      .from("customers")
      .select("line_user_id, full_name")
      .eq("id", target)
      .maybeSingle<{ line_user_id: string | null; full_name: string | null }>();

    if (customer) {
      if (!customer.line_user_id) {
        return NextResponse.json(
          { error: "ลูกค้ารายนี้ยังไม่ได้เชื่อมบัญชี LINE — ส่งทดสอบไม่ได้" },
          { status: 422 },
        );
      }
      lineUserId = customer.line_user_id;
      vars = sampleVars(customer.full_name);
      sentTo = customer.full_name || "ลูกค้า";
    } else if (LINE_USER_RE.test(target)) {
      // 3) Raw LINE user id — push straight with sample values.
      lineUserId = target;
      vars = sampleVars(null);
      sentTo = "LINE user";
    } else {
      return NextResponse.json(
        { error: "ไม่พบการจองหรือลูกค้าตาม UUID นี้" },
        { status: 404 },
      );
    }
  }

  const ok = await pushLineMessages(lineUserId, [buildCardFlex(body.config, vars)]);
  if (!ok) {
    return NextResponse.json(
      { error: "ส่งไม่สำเร็จ — ตรวจการตั้งค่า LINE OA / access token" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sentTo });
}
