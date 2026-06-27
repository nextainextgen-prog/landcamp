import { redirect } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui";
import { BookingsManager, type BookingRow } from "./BookingsManager";

export const dynamic = "force-dynamic";

function firstImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const first = images.find((x) => x && typeof x === "object" && typeof (x as { src?: unknown }).src === "string");
  return first ? (first as { src: string }).src : null;
}

export default async function AdminBookingsPage() {
  if (!(await requireSection("bookings")).ok) redirect("/admin");

  let rows: BookingRow[] = [];
  let errorMsg: string | null = null;

  try {
    const admin = createAdminClient();

    const { data: bookings } = await admin
      .from("bookings")
      .select(
        "id, booking_code, room_id, customer_id, check_in, check_out, adults, children, status, total_amount, notes, checked_in_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(80);

    const list = bookings ?? [];
    const ids = list.map((b) => b.id as string);
    const roomIds = [...new Set(list.map((b) => b.room_id as string))];
    const customerIds = [...new Set(list.map((b) => b.customer_id as string))];

    const [{ data: payments }, { data: rooms }, { data: customers }] = await Promise.all([
      ids.length
        ? admin
            .from("payments")
            .select("booking_id, amount, kind, status, verify_status, verify_note, slip_url, created_at")
            .in("booking_id", ids)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      roomIds.length
        ? admin.from("rooms").select("id, name_th, images").in("id", roomIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      customerIds.length
        ? admin
            .from("customers")
            .select("id, full_name, email, phone, avatar_url, line_user_id, auth_provider, is_vip, tags")
            .in("id", customerIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    ]);

    const roomMap = new Map(
      (rooms ?? []).map((r) => [r.id as string, { name: (r.name_th as string) ?? "—", image: firstImage(r.images) }]),
    );
    const customerMap = new Map(
      (customers ?? []).map((c) => [
        c.id as string,
        {
          name: (c.full_name as string) ?? "—",
          email: (c.email as string) ?? "",
          phone: (c.phone as string) ?? "",
          avatar: (c.avatar_url as string) ?? null,
          provider: (c.auth_provider as string) ?? null,
          lineUserId: (c.line_user_id as string) ?? null,
          isVip: c.is_vip === true,
          tags: Array.isArray(c.tags) ? (c.tags as string[]) : [],
        },
      ]),
    );

    const latestPayment = new Map<string, Record<string, unknown>>();
    for (const p of payments ?? []) {
      const bid = p.booking_id as string;
      if (!latestPayment.has(bid)) latestPayment.set(bid, p);
    }

    const slipPaths = [...latestPayment.values()]
      .map((p) => p.slip_url as string | null)
      .filter((v): v is string => Boolean(v));
    const signed = new Map<string, string>();
    if (slipPaths.length) {
      const { data: signedData } = await admin.storage.from("slips").createSignedUrls(slipPaths, 3600);
      for (const s of signedData ?? []) {
        if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
      }
    }

    rows = list.map((b) => {
      const p = latestPayment.get(b.id as string);
      const room = roomMap.get(b.room_id as string);
      const c = customerMap.get(b.customer_id as string);
      return {
        id: b.id as string,
        booking_code: b.booking_code as string,
        customer_id: b.customer_id as string,
        room_id: b.room_id as string,
        room_name: room?.name ?? (b.room_id as string).slice(0, 8),
        room_image: room?.image ?? null,
        customer: c ?? { name: "—", email: "", phone: "", avatar: null, provider: null, lineUserId: null, isVip: false, tags: [] },
        check_in: b.check_in as string,
        check_out: b.check_out as string,
        adults: b.adults as number,
        children: b.children as number,
        status: b.status as BookingRow["status"],
        total_amount: b.total_amount as number,
        notes: (b.notes as string) ?? null,
        checked_in_at: (b.checked_in_at as string) ?? null,
        created_at: b.created_at as string,
        payment: p
          ? {
              amount: p.amount as number,
              kind: p.kind as string,
              status: p.status as string,
              verify_status: (p.verify_status as string) ?? null,
              verify_note: (p.verify_note as string) ?? null,
              // Signed URL from the `slips` bucket. The legacy base64 `slip_image`
              // column is no longer selected in this list query (it bloated the
              // payload across up to 80 bookings); open the slip detail to view it.
              slip_image:
                (p.slip_url ? signed.get(p.slip_url as string) : null) ?? null,
            }
          : null,
      };
    });
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "failed to load bookings";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="รายการจอง"
        description="ข้อมูลลูกค้า + รายละเอียดการจอง + ขั้นตอน — ตรวจสลิปและยืนยันได้ในที่เดียว"
      />
      {errorMsg ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {errorMsg}
        </div>
      ) : (
        <BookingsManager initialRows={rows} />
      )}
    </div>
  );
}
