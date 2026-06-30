import { redirect, notFound } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeCustomerMetrics, type MetricsBooking } from "@/lib/customers/metrics";
import type { BookingStatus } from "@/types";
import type { CrmNote, CrmContact, CrmTax } from "./CustomerCrm";
import type { TimelineItem } from "./CustomerTimeline";
import {
  CustomerProfile,
  type ProfileBooking,
  type ProfilePayment,
} from "./CustomerProfile";
import type { NotifyLogItem } from "./CustomerNotifications";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const STATUS_TH: Record<BookingStatus, string> = {
  pending_payment: "รอชำระ",
  payment_review: "รอตรวจสลิป",
  confirmed: "ยืนยันแล้ว",
  cancelled: "ยกเลิก",
  completed: "เสร็จสิ้น",
  no_show: "ไม่มาตามนัด",
};
export default async function CustomerDetailPage({ params }: Ctx) {
  if (!(await requireSection("customers")).ok) redirect("/admin");
  const { id } = await params;

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from("customers")
    .select(
      "id, full_name, email, phone, address, avatar_url, is_vip, tags, source, auth_provider, line_user_id, created_at, tax_id, tax_name, tax_address, tax_branch, is_vat",
    )
    .eq("id", id)
    .maybeSingle();
  if (!customer) notFound();

  const [{ data: bookingsData }, { data: rooms }, { data: notesData }, { data: contactsData }] =
    await Promise.all([
      admin
        .from("bookings")
        .select("id, booking_code, room_id, check_in, check_out, status, total_amount, adults, children, created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
      admin.from("rooms").select("id, name_th"),
      admin
        .from("customer_notes")
        .select("id, body, author_name, created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("customer_contacts")
        .select("id, channel, direction, summary, author_name, created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const notes = (notesData ?? []) as CrmNote[];
  const contacts = (contactsData ?? []) as CrmContact[];
  const roomName = new Map((rooms ?? []).map((r) => [r.id as string, r.name_th as string]));
  const bookingsRaw = bookingsData ?? [];

  // ── Payments for this customer's bookings ──
  const bookingMeta = new Map(
    bookingsRaw.map((b) => [
      b.id as string,
      { code: (b.booking_code as string) ?? "—", room: roomName.get(b.room_id as string) ?? "—" },
    ]),
  );
  let paymentsData: Record<string, unknown>[] = [];
  if (bookingsRaw.length > 0) {
    const { data } = await admin
      .from("payments")
      .select("id, booking_id, amount, kind, method, status, trans_ref, paid_at, slip_url, created_at")
      .in("booking_id", bookingsRaw.map((b) => b.id as string))
      .order("created_at", { ascending: false });
    paymentsData = data ?? [];
  }

  // Resolve slip object paths → temporary signed URLs (private "slips" bucket).
  const slipPaths = paymentsData
    .map((p) => p.slip_url as string | null)
    .filter((v): v is string => Boolean(v));
  const signedSlips = new Map<string, string>();
  if (slipPaths.length > 0) {
    const { data: signed } = await admin.storage.from("slips").createSignedUrls(slipPaths, 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) signedSlips.set(s.path, s.signedUrl);
  }

  const payments: ProfilePayment[] = paymentsData.map((p) => {
    const meta = bookingMeta.get(p.booking_id as string);
    const slipPath = (p.slip_url as string) ?? null;
    return {
      id: p.id as string,
      bookingCode: meta?.code ?? "—",
      roomName: meta?.room ?? "—",
      amount: (p.amount as number) ?? 0,
      kind: (p.kind as ProfilePayment["kind"]) ?? "full",
      method: (p.method as string) ?? null,
      ref: (p.trans_ref as string) ?? null,
      status: (p.status as ProfilePayment["status"]) ?? "pending",
      paidAt: (p.paid_at as string) ?? null,
      slipUrl: (slipPath ? signedSlips.get(slipPath) : null) ?? null,
      createdAt: p.created_at as string,
    };
  });

  const bookings: ProfileBooking[] = bookingsRaw.map((b) => ({
    id: b.id as string,
    code: (b.booking_code as string) ?? "—",
    roomName: roomName.get(b.room_id as string) ?? "—",
    checkIn: b.check_in as string,
    checkOut: b.check_out as string,
    status: b.status as BookingStatus,
    total: (b.total_amount as number) ?? 0,
    adults: (b.adults as number) ?? 0,
    children: (b.children as number) ?? 0,
    createdAt: b.created_at as string,
  }));

  // ── Analytics (RFM / CLV / health) — per-request "now". ──
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const metrics = computeCustomerMetrics(
    bookingsRaw.map((b): MetricsBooking => ({
      status: b.status as string,
      total_amount: (b.total_amount as number) ?? 0,
      created_at: b.created_at as string,
    })),
    nowMs,
  );

  // ── Unified activity timeline (bookings + contacts + notes) ──
  const timeline: TimelineItem[] = [
    ...bookingsRaw.map((b): TimelineItem => ({
      kind: "booking",
      at: b.created_at as string,
      title: `จอง ${roomName.get(b.room_id as string) ?? "ห้องพัก"} · ฿${((b.total_amount as number) ?? 0).toLocaleString("en-US")}`,
      detail: `${STATUS_TH[b.status as BookingStatus]} · ${b.booking_code as string}`,
    })),
    ...contacts.map((c): TimelineItem => ({
      kind: "contact",
      at: c.created_at,
      title: `ติดต่อ — ${c.summary}`,
      detail: `${c.direction === "inbound" ? "ลูกค้าติดต่อมา" : "เราติดต่อไป"} · ${c.author_name ?? "—"}`,
    })),
    ...notes.map((n): TimelineItem => ({
      kind: "note",
      at: n.created_at,
      title: n.body,
      detail: `โน้ตโดย ${n.author_name ?? "—"}`,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  // ── LINE notification send history (kind = card_confirm / card_reminder) ──
  const { data: notifyData } = await admin
    .from("notifications")
    .select("id, kind, status, payload, created_at")
    .eq("payload->>customer_id", id)
    .in("kind", ["card_confirm", "card_reminder"])
    .order("created_at", { ascending: false })
    .limit(50);
  const notifyLog: NotifyLogItem[] = (notifyData ?? []).map((n) => {
    const payload = (n.payload ?? {}) as Record<string, unknown>;
    return {
      id: n.id as string,
      kind: n.kind as string,
      status: (n.status as string) ?? "skipped",
      bookingCode: (payload.booking_code as string) ?? null,
      at: n.created_at as string,
    };
  });

  const tax: CrmTax = {
    taxId: (customer.tax_id as string) ?? "",
    taxName: (customer.tax_name as string) ?? "",
    taxAddress: (customer.tax_address as string) ?? "",
    taxBranch: (customer.tax_branch as string) ?? "",
    isVat: Boolean(customer.is_vat),
  };

  return (
    <CustomerProfile
      customer={{
        id: customer.id as string,
        name: (customer.full_name as string) ?? "—",
        email: (customer.email as string) ?? "",
        phone: (customer.phone as string) ?? "",
        address: (customer.address as string) ?? "",
        avatarUrl: (customer.avatar_url as string) ?? "",
        isVip: Boolean(customer.is_vip),
        tags: (customer.tags as string[]) ?? [],
        source: (customer.source as string) ?? "online",
        authProvider: (customer.auth_provider as string) ?? null,
        createdAt: customer.created_at as string,
      }}
      metrics={metrics}
      bookings={bookings}
      payments={payments}
      notes={notes}
      contacts={contacts}
      tax={tax}
      timeline={timeline}
      totalSpent={metrics.totalSpent}
      lineLinked={Boolean(customer.line_user_id)}
      notifyLog={notifyLog}
    />
  );
}
