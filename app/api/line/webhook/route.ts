import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { getLineConfig } from "@/lib/line/config";
import { logAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LineSource = { type?: string; userId?: string; groupId?: string; roomId?: string };
type LineEvent = { type?: string; source?: LineSource; message?: { type?: string; text?: string } };

/**
 * LINE Messaging API webhook. Right now it captures the source id of every
 * event into the audit log — so the owner can read the team Group ID after
 * inviting the OA to the group and sending a message. (Check-in handling will
 * be added on top of this.)
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const cfg = await getLineConfig();

  // Verify the signature when the Messaging channel secret is configured.
  if (cfg.messagingChannelSecret) {
    const sig = req.headers.get("x-line-signature") ?? "";
    const expected = createHmac("sha256", cfg.messagingChannelSecret).update(raw).digest("base64");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let events: LineEvent[] = [];
  try {
    events = (JSON.parse(raw) as { events?: LineEvent[] }).events ?? [];
  } catch {
    return NextResponse.json({ ok: true });
  }

  for (const ev of events) {
    const s = ev.source ?? {};
    await logAdminAction("LINE", "line.webhook", {
      event: ev.type,
      sourceType: s.type,
      groupId: s.groupId ?? null,
      roomId: s.roomId ?? null,
      userId: s.userId ?? null,
      text: ev.message?.type === "text" ? ev.message.text : undefined,
    });
  }

  return NextResponse.json({ ok: true });
}
