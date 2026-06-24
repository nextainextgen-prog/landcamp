import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { requireSection } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, Panel, StatCard, Badge, DataTable, EmptyState } from "@/components/admin/ui";
import type { BookingStatus } from "@/types";
import { CustomerCrm, type CrmNote, type CrmContact } from "./CustomerCrm";

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
const STATUS_TONE: Record<BookingStatus, "amber" | "blue" | "forest" | "sage" | "neutral" | "red"> = {
  pending_payment: "amber",
  payment_review: "blue",
  confirmed: "forest",
  completed: "sage",
  cancelled: "neutral",
  no_show: "red",
};
const EARNING = new Set(["confirmed", "completed"]);

function thaiDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default async function CustomerDetailPage({ params }: Ctx) {
  if (!(await requireSection("customers")).ok) redirect("/admin");
  const { id } = await params;

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from("customers")
    .select("id, full_name, email, phone, avatar_url, is_vip, tags, source, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!customer) notFound();

  const [{ data: bookingsData }, { data: rooms }, { data: notesData }, { data: contactsData }] =
    await Promise.all([
      admin
        .from("bookings")
        .select("id, booking_code, room_id, check_in, check_out, status, total_amount")
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
  const bookings = bookingsData ?? [];
  const totalSpent = bookings
    .filter((b) => EARNING.has(b.status as string))
    .reduce((s, b) => s + ((b.total_amount as number) ?? 0), 0);

  const name = (customer.full_name as string) ?? "—";
  const isVip = Boolean(customer.is_vip);
  const tags = (customer.tags as string[]) ?? [];
  const avatarUrl = (customer.avatar_url as string) ?? "";
  const isWalkIn = (customer.source as string) === "walk_in";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={isVip ? `★ ${name}` : name}
        description={isWalkIn ? "ลูกค้า Walk-in · ประวัติการจอง" : "โปรไฟล์ลูกค้าและประวัติการจอง"}
        actions={
          <Link href="/admin/customers" className="rounded-lg border border-[color:var(--color-forest-deep)]/15 px-3 py-2 text-sm font-medium text-[color:var(--color-forest-deep)] hover:bg-[color:var(--color-bone-soft)]">
            ← กลับ
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard tone="forest" label="จองทั้งหมด" value={bookings.length} />
        <StatCard tone="clay" label="ยอดใช้จ่าย" value={`฿${totalSpent.toLocaleString("en-US")}`} />
        <StatCard tone="sage" label="อีเมล" value={<span className="text-base">{(customer.email as string) ?? "—"}</span>} />
        <StatCard tone="ink" label="เบอร์โทร" value={<span className="text-base">{(customer.phone as string) || "—"}</span>} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="ประวัติการจอง" className="lg:col-span-2" bodyClassName="p-0">
          {bookings.length === 0 ? (
            <div className="p-5"><EmptyState>ยังไม่มีการจอง</EmptyState></div>
          ) : (
            <DataTable
              head={
                <tr>
                  <th className="px-5 py-3 font-medium">รหัส</th>
                  <th className="px-5 py-3 font-medium">ห้อง</th>
                  <th className="px-5 py-3 font-medium">เข้า–ออก</th>
                  <th className="px-5 py-3 font-medium">สถานะ</th>
                  <th className="px-5 py-3 text-right font-medium">ยอด</th>
                </tr>
              }
            >
              {bookings.map((b) => (
                <tr key={b.id as string} className="hover:bg-[color:var(--color-bone-soft)]/30">
                  <td className="px-5 py-3">
                    <Link href={`/booking/${b.booking_code}`} className="font-mono text-[13px] text-[color:var(--color-forest-deep)]">
                      {b.booking_code as string}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[color:var(--color-ink)]/75">{roomName.get(b.room_id as string) ?? "—"}</td>
                  <td className="px-5 py-3 text-[color:var(--color-ink)]/75">
                    {thaiDate(b.check_in as string)} – {thaiDate(b.check_out as string)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[b.status as BookingStatus]}>{STATUS_TH[b.status as BookingStatus]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-[color:var(--color-forest-deep)]">
                    ฿{((b.total_amount as number) ?? 0).toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="ข้อมูลลูกค้า">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-12 w-12 rounded-full border border-[color:var(--color-forest-deep)]/15 bg-[color:var(--color-bone-soft)] object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--color-forest-deep)]/15 bg-[color:var(--color-bone-soft)] text-lg font-semibold text-[color:var(--color-forest-deep)]">
                    {name.trim().charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-[color:var(--color-forest-deep)]">{name}</p>
                  {isVip && (
                    <Badge tone="amber">★ VIP</Badge>
                  )}
                </div>
              </div>
              <dl className="flex flex-col gap-3 text-sm">
                <Field label="อีเมล" value={(customer.email as string) ?? "—"} />
                <Field label="เบอร์โทร" value={(customer.phone as string) || "—"} />
                <Field label="ช่องทาง" value={isWalkIn ? "Walk-in" : "จองออนไลน์"} />
                <Field label="เป็นสมาชิกตั้งแต่" value={thaiDate(customer.created_at as string)} />
              </dl>
            </div>
          </Panel>

          <CustomerCrm
            customerId={customer.id as string}
            initialIsVip={isVip}
            initialTags={tags}
            initialNotes={notes}
            initialContacts={contacts}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[color:var(--color-ink)]/50">{label}</dt>
      <dd className="font-medium text-[color:var(--color-forest-deep)]">{value}</dd>
    </div>
  );
}
