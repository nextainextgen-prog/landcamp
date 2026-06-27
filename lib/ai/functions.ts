/**
 * Gemini Function-Calling tools for "น้องแคมป์" (the admin AI assistant).
 *
 * Every tool has:
 *   • a FunctionDeclaration (name + Thai description + parameter schema) sent to
 *     Gemini so it knows what it can call, and
 *   • a handler that queries Supabase with the service-role client and returns
 *     structured JSON. Handlers NEVER throw — on failure they resolve to
 *     `{ error: string }` so the model can explain the problem instead of the
 *     request crashing.
 *
 * Metric definitions mirror the admin dashboard (app/admin/dashboard/page.tsx)
 * so the numbers น้องแคมป์ quotes match what staff already see on screen:
 *   • "today" is the Bangkok calendar day (UTC+7).
 *   • revenue-bearing / room-occupying stays = status in (confirmed, completed).
 */

import "server-only";

import { Type, type FunctionDeclaration } from "@google/genai";

import { createAdminClient } from "@/lib/supabase/admin";

type Row = Record<string, unknown>;
type Json = Record<string, unknown>;

/** Stays that count as earned revenue / as occupying a room. */
const EARNING = new Set(["confirmed", "completed"]);
const OCCUPYING = new Set(["confirmed", "completed"]);

/* ── date helpers (Bangkok = UTC+7) ─────────────────────────────── */
function bangkokToday(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}
function addDays(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}
function nightsBetween(from: string, to: string): number {
  return Math.max(0, Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000));
}
function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการอ่านข้อมูล";
}

/** Resolve a period keyword into an [from, to) date window (to is exclusive). */
function periodWindow(period: string, today = bangkokToday()): { from: string; to: string } {
  const toExclusive = addDays(today, 1); // include today
  switch (period) {
    case "day":
      return { from: today, to: toExclusive };
    case "week":
      return { from: addDays(today, -6), to: toExclusive };
    case "year":
      return { from: `${today.slice(0, 4)}-01-01`, to: toExclusive };
    case "month":
    default:
      return { from: `${today.slice(0, 7)}-01`, to: toExclusive };
  }
}

/* ── shared lookups ─────────────────────────────────────────────── */
async function roomNameMap(admin: ReturnType<typeof createAdminClient>): Promise<Map<string, string>> {
  const { data } = await admin.from("rooms").select("id, name_th");
  return new Map((data ?? []).map((r: Row) => [r.id as string, (r.name_th as string) ?? "—"]));
}
async function customerNameMap(
  admin: ReturnType<typeof createAdminClient>,
  ids: string[],
): Promise<Map<string, Row>> {
  if (ids.length === 0) return new Map();
  const { data } = await admin
    .from("customers")
    .select("id, full_name, phone")
    .in("id", [...new Set(ids)]);
  return new Map((data ?? []).map((c: Row) => [c.id as string, c]));
}

/* ════════════════════════════════════════════════════════════════
 * Handlers
 * ════════════════════════════════════════════════════════════════ */

async function getDashboardSummary(): Promise<Json> {
  try {
    const admin = createAdminClient();
    const today = bangkokToday();
    const [bRes, rRes, revRes, availRes] = await Promise.all([
      admin.from("bookings").select("id, room_id, check_in, check_out, status, total_amount, created_at"),
      admin.from("rooms").select("id, name_th, is_available"),
      admin.from("revenue_entries").select("amount").eq("occurred_at", today),
      admin.from("room_availability").select("room_id, available").eq("date", today),
    ]);
    if (bRes.error) throw bRes.error;
    const bookings = (bRes.data ?? []) as Row[];
    const rooms = (rRes.data ?? []) as Row[];
    const roomsTotal = rooms.length;

    const bookingsToday = bookings.filter((b) => String(b.created_at).slice(0, 10) === today).length;
    const arrivalsToday = bookings.filter((b) => b.check_in === today && b.status !== "cancelled").length;

    const maintenance = new Set<string>([
      ...rooms.filter((r) => r.is_available === false).map((r) => r.id as string),
      ...((availRes.data ?? []) as Row[]).filter((a) => a.available === false).map((a) => a.room_id as string),
    ]);
    const occupied = new Set(
      bookings
        .filter((b) => OCCUPYING.has(b.status as string) && (b.check_in as string) <= today && today < (b.check_out as string))
        .map((b) => b.room_id as string),
    );
    const occupiedCount = [...occupied].filter((id) => !maintenance.has(id)).length;
    const maintenanceCount = maintenance.size;
    const available = Math.max(0, roomsTotal - occupiedCount - maintenanceCount);

    const revenueToday = ((revRes.data ?? []) as Row[]).reduce((s, r) => s + ((r.amount as number) ?? 0), 0);
    const slipsPending = bookings.filter((b) => b.status === "payment_review").length;

    return {
      date: today,
      bookingsToday,
      arrivalsToday,
      revenueToday,
      roomsTotal,
      roomsAvailable: available,
      roomsOccupied: occupiedCount,
      roomsMaintenance: maintenanceCount,
      slipsPending,
    };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

async function getBookings(args: Json): Promise<Json> {
  try {
    const admin = createAdminClient();
    const limit = Math.min(Number(args.limit) || 50, 200);
    const dateField = args.dateField === "created" ? "created_at" : "check_in";

    let q = admin
      .from("bookings")
      .select("booking_code, customer_id, room_id, check_in, check_out, nights, status, total_amount, created_at");
    if (args.status) q = q.eq("status", String(args.status));
    if (args.roomId) q = q.eq("room_id", String(args.roomId));
    if (args.from) q = q.gte(dateField, String(args.from));
    if (args.to) q = q.lte(dateField, String(args.to));
    q = q.order(dateField, { ascending: false }).limit(limit);

    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    const rooms = await roomNameMap(admin);
    const customers = await customerNameMap(admin, rows.map((b) => b.customer_id as string));

    return {
      count: rows.length,
      bookings: rows.map((b) => ({
        bookingCode: b.booking_code,
        customer: (customers.get(b.customer_id as string)?.full_name as string) ?? "—",
        room: rooms.get(b.room_id as string) ?? "—",
        checkIn: b.check_in,
        checkOut: b.check_out,
        nights: b.nights,
        status: b.status,
        amount: b.total_amount,
      })),
    };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

async function getRevenueReport(args: Json): Promise<Json> {
  try {
    const admin = createAdminClient();
    const win =
      args.from && args.to
        ? { from: String(args.from), to: addDays(String(args.to), 1) }
        : periodWindow(String(args.period ?? "month"));

    let q = admin
      .from("revenue_entries")
      .select("occurred_at, label, category, amount, method, room_id")
      .gte("occurred_at", win.from)
      .lt("occurred_at", win.to);
    if (args.roomId) q = q.eq("room_id", String(args.roomId));
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    const rooms = await roomNameMap(admin);

    const total = rows.reduce((s, r) => s + ((r.amount as number) ?? 0), 0);
    const byCategory: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    const byRoom: Record<string, number> = {};
    for (const r of rows) {
      const amt = (r.amount as number) ?? 0;
      byCategory[(r.category as string) || "other"] = (byCategory[(r.category as string) || "other"] ?? 0) + amt;
      byMethod[(r.method as string) || "ไม่ระบุ"] = (byMethod[(r.method as string) || "ไม่ระบุ"] ?? 0) + amt;
      if (r.room_id) {
        const name = rooms.get(r.room_id as string) ?? "—";
        byRoom[name] = (byRoom[name] ?? 0) + amt;
      }
    }
    return {
      period: args.from && args.to ? `${args.from} ถึง ${args.to}` : String(args.period ?? "month"),
      from: win.from,
      entries: rows.length,
      total,
      byCategory,
      byMethod,
      byRoom,
    };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

async function getRoomStatus(): Promise<Json> {
  try {
    const admin = createAdminClient();
    const today = bangkokToday();
    const [rRes, bRes, aRes] = await Promise.all([
      admin.from("rooms").select("id, name_th, is_available").order("display_order", { ascending: true }),
      admin.from("bookings").select("customer_id, room_id, check_in, check_out, status"),
      admin.from("room_availability").select("room_id, available, reason").eq("date", today),
    ]);
    if (rRes.error) throw rRes.error;
    const rooms = (rRes.data ?? []) as Row[];
    const bookings = (bRes.data ?? []) as Row[];
    const overrides = new Map(((aRes.data ?? []) as Row[]).map((a) => [a.room_id as string, a]));
    const customers = await customerNameMap(admin, bookings.map((b) => b.customer_id as string));

    const list = rooms.map((room) => {
      const id = room.id as string;
      const override = overrides.get(id);
      const closed = room.is_available === false || override?.available === false;
      const stay = bookings.find(
        (b) => b.room_id === id && OCCUPYING.has(b.status as string) && (b.check_in as string) <= today && today < (b.check_out as string),
      );
      let status: "maintenance" | "occupied" | "available" = "available";
      if (closed) status = "maintenance";
      else if (stay) status = "occupied";
      return {
        room: room.name_th,
        status,
        guest: stay ? (customers.get(stay.customer_id as string)?.full_name as string) ?? "—" : null,
        checkOut: stay ? stay.check_out : null,
        note: closed ? (override?.reason as string) ?? "ปิดปรับปรุง" : null,
      };
    });
    const summary = {
      total: list.length,
      available: list.filter((r) => r.status === "available").length,
      occupied: list.filter((r) => r.status === "occupied").length,
      maintenance: list.filter((r) => r.status === "maintenance").length,
    };
    return { date: today, summary, rooms: list };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

async function getCustomerInfo(args: Json): Promise<Json> {
  try {
    const query = String(args.query ?? "").trim();
    if (!query) return { error: "กรุณาระบุชื่อ เบอร์โทร UUID หรือ LINE ID ของลูกค้า" };
    const admin = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);

    let q = admin.from("customers").select("id, full_name, phone, email, line_user_id, created_at");
    if (isUuid) {
      q = q.or(`id.eq.${query},line_user_id.eq.${query}`);
    } else {
      const safe = query.replace(/[%,()]/g, " ");
      q = q.or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%,line_user_id.eq.${query}`);
    }
    const { data, error } = await q.limit(10);
    if (error) throw error;
    const customers = (data ?? []) as Row[];
    if (customers.length === 0) return { count: 0, customers: [], note: "ไม่พบลูกค้าที่ตรงกับคำค้น" };

    // Stay history for the matched customers.
    const ids = customers.map((c) => c.id as string);
    const { data: bk } = await admin
      .from("bookings")
      .select("customer_id, status, total_amount, check_in")
      .in("customer_id", ids);
    const agg = new Map<string, { stays: number; spent: number; last: string | null }>();
    for (const b of (bk ?? []) as Row[]) {
      const cid = b.customer_id as string;
      const cur = agg.get(cid) ?? { stays: 0, spent: 0, last: null };
      if (EARNING.has(b.status as string)) {
        cur.stays += 1;
        cur.spent += (b.total_amount as number) ?? 0;
        const ci = b.check_in as string;
        if (!cur.last || ci > cur.last) cur.last = ci;
      }
      agg.set(cid, cur);
    }
    return {
      count: customers.length,
      customers: customers.map((c) => {
        const a = agg.get(c.id as string);
        return {
          id: c.id,
          name: c.full_name ?? "—",
          phone: c.phone ?? "—",
          email: c.email ?? null,
          hasLine: Boolean(c.line_user_id),
          stays: a?.stays ?? 0,
          totalSpent: a?.spent ?? 0,
          lastStay: a?.last ?? null,
        };
      }),
    };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

async function getSlipsSummary(args: Json): Promise<Json> {
  try {
    const admin = createAdminClient();
    let q = admin.from("slip_verifications").select("verify_status, amount_in_slip, created_at");
    if (args.from) q = q.gte("created_at", String(args.from));
    if (args.to) q = q.lte("created_at", `${String(args.to)}T23:59:59`);
    const [vRes, pendingRes] = await Promise.all([
      q,
      admin.from("bookings").select("id", { count: "exact", head: true }).eq("status", "payment_review"),
    ]);
    if (vRes.error) throw vRes.error;
    const rows = (vRes.data ?? []) as Row[];
    const byStatus: Record<string, number> = {};
    for (const r of rows) {
      const s = (r.verify_status as string) || "unknown";
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    }
    return {
      awaitingReview: pendingRes.count ?? 0, // bookings with a slip submitted, not yet confirmed
      verificationsChecked: rows.length,
      matched: byStatus.matched ?? 0,
      duplicate: byStatus.duplicate ?? 0,
      amountMismatch: byStatus.amount_mismatch ?? 0,
      unreadable: byStatus.unreadable ?? 0,
      error: byStatus.error ?? 0,
      byStatus,
    };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

async function getHousekeepingStatus(args: Json): Promise<Json> {
  try {
    const admin = createAdminClient();
    const date = String(args.date ?? bangkokToday());
    const { data, error } = await admin
      .from("housekeeping_tasks")
      .select("room_id, status, assignee, note, due_date")
      .eq("due_date", date);
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    const rooms = await roomNameMap(admin);
    const byStatus = { pending: 0, in_progress: 0, done: 0 } as Record<string, number>;
    for (const r of rows) byStatus[r.status as string] = (byStatus[r.status as string] ?? 0) + 1;
    return {
      date,
      total: rows.length,
      summary: byStatus,
      tasks: rows.map((r) => ({
        room: rooms.get(r.room_id as string) ?? "—",
        status: r.status,
        assignee: r.assignee ?? null,
        note: r.note ?? null,
      })),
    };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

async function getUpcomingCheckIns(args: Json): Promise<Json> {
  try {
    const admin = createAdminClient();
    const hours = Number(args.hours) || 48;
    const today = bangkokToday();
    const until = addDays(today, Math.max(1, Math.ceil(hours / 24)));
    const { data, error } = await admin
      .from("bookings")
      .select("booking_code, customer_id, room_id, check_in, check_out, status, adults, children")
      .gte("check_in", today)
      .lte("check_in", until)
      .neq("status", "cancelled")
      .order("check_in", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    const rooms = await roomNameMap(admin);
    const customers = await customerNameMap(admin, rows.map((b) => b.customer_id as string));
    return {
      windowHours: hours,
      from: today,
      to: until,
      count: rows.length,
      checkIns: rows.map((b) => ({
        bookingCode: b.booking_code,
        customer: (customers.get(b.customer_id as string)?.full_name as string) ?? "—",
        phone: (customers.get(b.customer_id as string)?.phone as string) ?? "—",
        room: rooms.get(b.room_id as string) ?? "—",
        checkIn: b.check_in,
        checkOut: b.check_out,
        guests: ((b.adults as number) ?? 0) + ((b.children as number) ?? 0),
        status: b.status,
      })),
    };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

async function getOccupancyRate(args: Json): Promise<Json> {
  try {
    const admin = createAdminClient();
    const today = bangkokToday();
    const from = String(args.from ?? today);
    const to = String(args.to ?? addDays(from, 7)); // exclusive end
    const days = nightsBetween(from, to);
    if (days <= 0) return { error: "ช่วงวันที่ไม่ถูกต้อง — 'to' ต้องมากกว่า 'from'" };

    const [rRes, bRes] = await Promise.all([
      admin.from("rooms").select("id", { count: "exact", head: true }),
      admin.from("bookings").select("room_id, check_in, check_out, status"),
    ]);
    const roomsTotal = rRes.count ?? 0;
    const bookings = (bRes.data ?? []) as Row[];

    let occupiedRoomNights = 0;
    for (const b of bookings) {
      if (!OCCUPYING.has(b.status as string)) continue;
      const ci = b.check_in as string;
      const co = b.check_out as string;
      const start = ci > from ? ci : from;
      const end = co < to ? co : to;
      occupiedRoomNights += nightsBetween(start, end);
    }
    const capacity = roomsTotal * days;
    const rate = capacity > 0 ? Math.round((occupiedRoomNights / capacity) * 1000) / 10 : 0;
    return { from, to, nights: days, roomsTotal, capacityRoomNights: capacity, occupiedRoomNights, occupancyRate: rate };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

async function getCancellations(args: Json): Promise<Json> {
  try {
    const admin = createAdminClient();
    const to = String(args.to ?? bangkokToday());
    const from = String(args.from ?? addDays(to, -29));
    const { data, error } = await admin
      .from("bookings")
      .select("id, booking_code, customer_id, room_id, check_in, total_amount, created_at")
      .eq("status", "cancelled")
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    const rooms = await roomNameMap(admin);
    const customers = await customerNameMap(admin, rows.map((b) => b.customer_id as string));

    // Best-effort cancellation reason from the audit trail.
    const ids = rows.map((b) => b.id as string);
    const reasons = new Map<string, string>();
    if (ids.length) {
      const { data: audit } = await admin
        .from("booking_audit")
        .select("booking_id, note, to_status, created_at")
        .in("booking_id", ids)
        .eq("to_status", "cancelled")
        .order("created_at", { ascending: false });
      for (const a of (audit ?? []) as Row[]) {
        const bid = a.booking_id as string;
        if (!reasons.has(bid) && a.note) reasons.set(bid, a.note as string);
      }
    }
    const lostValue = rows.reduce((s, b) => s + ((b.total_amount as number) ?? 0), 0);
    return {
      from,
      to,
      count: rows.length,
      lostValue,
      cancellations: rows.map((b) => ({
        bookingCode: b.booking_code,
        customer: (customers.get(b.customer_id as string)?.full_name as string) ?? "—",
        room: rooms.get(b.room_id as string) ?? "—",
        checkIn: b.check_in,
        amount: b.total_amount,
        reason: reasons.get(b.id as string) ?? "ไม่ระบุเหตุผล",
      })),
    };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

/* ════════════════════════════════════════════════════════════════
 * Registry — declarations sent to Gemini + handler dispatch
 * ════════════════════════════════════════════════════════════════ */

type Handler = (args: Json) => Promise<Json>;

const HANDLERS: Record<string, Handler> = {
  getDashboardSummary: () => getDashboardSummary(),
  getBookings,
  getRevenueReport,
  getRoomStatus: () => getRoomStatus(),
  getCustomerInfo,
  getSlipsSummary,
  getHousekeepingStatus,
  getUpcomingCheckIns,
  getOccupancyRate,
  getCancellations,
};

const dateProp = (desc: string) => ({ type: Type.STRING, description: `${desc} (รูปแบบ YYYY-MM-DD)` });

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "getDashboardSummary",
    description: "ภาพรวมวันนี้: จำนวนการจองที่เข้ามาวันนี้, เช็คอินวันนี้, รายได้วันนี้, ห้องว่าง/ไม่ว่าง/ปิดปรับปรุง และจำนวนสลิปที่รอตรวจ",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "getBookings",
    description: "ดึงรายการจอง กรองตามช่วงวันที่ สถานะ และห้องได้",
    parameters: {
      type: Type.OBJECT,
      properties: {
        from: dateProp("วันเริ่มต้นของช่วง"),
        to: dateProp("วันสิ้นสุดของช่วง"),
        status: {
          type: Type.STRING,
          description: "สถานะการจอง",
          enum: ["pending_payment", "payment_review", "confirmed", "cancelled", "completed", "no_show"],
        },
        roomId: { type: Type.STRING, description: "UUID ของห้อง (ถ้าต้องการเฉพาะห้องนั้น)" },
        dateField: { type: Type.STRING, description: "อ้างอิงวันที่จากวันเข้าพักหรือวันที่สร้างการจอง", enum: ["check_in", "created"] },
        limit: { type: Type.NUMBER, description: "จำนวนรายการสูงสุด (ค่าเริ่มต้น 50)" },
      },
    },
  },
  {
    name: "getRevenueReport",
    description: "รายงานรายได้จากบัญชีรายรับ สรุปยอดรวม แยกตามหมวด วิธีรับเงิน และห้อง",
    parameters: {
      type: Type.OBJECT,
      properties: {
        period: { type: Type.STRING, description: "ช่วงเวลาแบบสำเร็จรูป", enum: ["day", "week", "month", "year"] },
        from: dateProp("วันเริ่มต้น (ใช้คู่กับ to เพื่อกำหนดช่วงเอง)"),
        to: dateProp("วันสิ้นสุด (ใช้คู่กับ from)"),
        roomId: { type: Type.STRING, description: "UUID ของห้อง (ถ้าต้องการเฉพาะห้องนั้น)" },
      },
    },
  },
  {
    name: "getRoomStatus",
    description: "สถานะห้องพักทุกห้องตอนนี้: ว่าง (available), มีคนพัก (occupied) พร้อมชื่อผู้เข้าพัก หรือปิดปรับปรุง (maintenance)",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "getCustomerInfo",
    description: "ค้นหาข้อมูลลูกค้าด้วยชื่อ เบอร์โทร UUID หรือ LINE User ID พร้อมประวัติการเข้าพักและยอดใช้จ่ายรวม",
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING, description: "ชื่อ / เบอร์โทร / UUID / LINE ID" } },
      required: ["query"],
    },
  },
  {
    name: "getSlipsSummary",
    description: "สรุปสลิปการชำระเงิน: จำนวนที่รอตรวจ, ตรวจผ่าน (matched), ซ้ำ (duplicate), ยอดไม่ตรง (amount_mismatch) ฯลฯ",
    parameters: {
      type: Type.OBJECT,
      properties: { from: dateProp("วันเริ่มต้น"), to: dateProp("วันสิ้นสุด") },
    },
  },
  {
    name: "getHousekeepingStatus",
    description: "งานแม่บ้านของวันที่ระบุ (ค่าเริ่มต้นวันนี้) แยกตามสถานะ รอทำ/กำลังทำ/เสร็จ พร้อมห้องและผู้รับผิดชอบ",
    parameters: {
      type: Type.OBJECT,
      properties: { date: dateProp("วันที่ต้องการดู (ค่าเริ่มต้นวันนี้)") },
    },
  },
  {
    name: "getUpcomingCheckIns",
    description: "เช็คอินที่กำลังจะมาถึงภายในกี่ชั่วโมงข้างหน้า (ค่าเริ่มต้น 48 ชั่วโมง) พร้อมชื่อลูกค้า เบอร์โทร และห้อง",
    parameters: {
      type: Type.OBJECT,
      properties: { hours: { type: Type.NUMBER, description: "จำนวนชั่วโมงล่วงหน้า (เช่น 24 หรือ 48)" } },
    },
  },
  {
    name: "getOccupancyRate",
    description: "อัตราการเข้าพัก (%) ในช่วงวันที่ที่ระบุ คำนวณจากจำนวนคืน-ห้องที่ขายได้เทียบกับความจุทั้งหมด",
    parameters: {
      type: Type.OBJECT,
      properties: { from: dateProp("วันเริ่มต้น"), to: dateProp("วันสิ้นสุด (ไม่นับรวมวันนี้)") },
    },
  },
  {
    name: "getCancellations",
    description: "รายการการจองที่ถูกยกเลิกในช่วงวันที่ พร้อมเหตุผล (ถ้ามี) และมูลค่าที่เสียไป (ค่าเริ่มต้น 30 วันล่าสุด)",
    parameters: {
      type: Type.OBJECT,
      properties: { from: dateProp("วันเริ่มต้น"), to: dateProp("วันสิ้นสุด") },
    },
  },
];

/** Execute a Gemini-requested function by name. Always resolves (never throws). */
export async function dispatchFunction(name: string, args: Json): Promise<Json> {
  const handler = HANDLERS[name];
  if (!handler) return { error: `ไม่รู้จักฟังก์ชัน "${name}"` };
  return handler(args ?? {});
}
