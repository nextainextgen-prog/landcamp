import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BookingStatus, Customer } from "@/types";
import { AccountDashboard, type BookingCard, type Profile } from "./AccountDashboard";

export const dynamic = "force-dynamic";

const PROVIDER_LABEL: Record<string, string> = {
  line: "เข้าสู่ระบบผ่าน LINE",
  google: "เข้าสู่ระบบผ่าน Google",
};

type BookingRow = {
  id: string;
  booking_code: string;
  room_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  extra_bed: boolean;
  base_amount: number;
  extra_bed_amount: number;
  total_amount: number;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
};

export default async function AccountBookingsPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/");

  const admin = createSupabaseAdminClient();

  const [{ data: customer }, { data: bookingData }] = await Promise.all([
    admin
      .from("customers")
      .select("id, full_name, email, avatar_url")
      .eq("id", session.id)
      .maybeSingle<Pick<Customer, "id" | "full_name" | "email" | "avatar_url">>(),
    admin
      .from("bookings")
      .select(
        "id, booking_code, room_id, check_in, check_out, nights, adults, children, extra_bed, base_amount, extra_bed_amount, total_amount, status, notes, created_at",
      )
      .eq("customer_id", session.id)
      .order("created_at", { ascending: false }),
  ]);

  const rows = (bookingData ?? []) as BookingRow[];

  // Resolve room names + latest slip per booking in two batched queries.
  const roomIds = [...new Set(rows.map((r) => r.room_id))];
  const bookingIds = rows.map((r) => r.id);
  const [{ data: rooms }, { data: payments }] = await Promise.all([
    roomIds.length
      ? admin.from("rooms").select("id, name_th").in("id", roomIds)
      : Promise.resolve({ data: [] as { id: string; name_th: string }[] }),
    bookingIds.length
      ? admin
          .from("payments")
          .select("booking_id, slip_image, trans_ref, created_at")
          .in("booking_id", bookingIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { booking_id: string; slip_image: string | null; trans_ref: string | null }[] }),
  ]);

  const roomName = new Map((rooms ?? []).map((r) => [r.id as string, r.name_th as string]));
  const slipByBooking = new Map<string, { slip_image: string | null; trans_ref: string | null }>();
  for (const p of (payments ?? []) as { booking_id: string; slip_image: string | null; trans_ref: string | null }[]) {
    // ordered newest-first → keep the first seen per booking
    if (!slipByBooking.has(p.booking_id)) {
      slipByBooking.set(p.booking_id, { slip_image: p.slip_image, trans_ref: p.trans_ref });
    }
  }

  const bookings: BookingCard[] = rows.map((r) => ({
    ...r,
    room_name: roomName.get(r.room_id) ?? "ห้องพัก",
    slip_image: slipByBooking.get(r.id)?.slip_image ?? null,
    trans_ref: slipByBooking.get(r.id)?.trans_ref ?? null,
  }));

  const profile: Profile = {
    fullName: customer?.full_name ?? session.displayName ?? null,
    email: customer?.email ?? "",
    avatarUrl: customer?.avatar_url ?? session.pictureUrl ?? null,
    providerLabel: PROVIDER_LABEL[session.provider] ?? "",
  };

  return <AccountDashboard profile={profile} bookings={bookings} />;
}
