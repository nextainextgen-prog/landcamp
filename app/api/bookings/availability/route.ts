import { NextResponse, type NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { checkAvailability } from "@/lib/booking/availability";
import { calculateTotal } from "@/lib/booking/pricing";
import { AvailabilityQuerySchema } from "@/lib/schemas/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Room = { id: string; base_price: number };

function createSupabaseAdminClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function diffNights(checkIn: string, checkOut: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = Date.UTC(
    Number(checkIn.slice(0, 4)),
    Number(checkIn.slice(5, 7)) - 1,
    Number(checkIn.slice(8, 10)),
  );
  const end = Date.UTC(
    Number(checkOut.slice(0, 4)),
    Number(checkOut.slice(5, 7)) - 1,
    Number(checkOut.slice(8, 10)),
  );
  return Math.round((end - start) / msPerDay);
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = AvailabilityQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid query", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "server not configured" },
      { status: 500 },
    );
  }

  const { roomId, checkIn, checkOut } = parsed.data;

  const { data: roomRow, error: roomErr } = await admin
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (roomErr) {
    return NextResponse.json({ error: roomErr.message }, { status: 500 });
  }
  if (!roomRow) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }

  const room = roomRow as unknown as Room & Record<string, unknown>;

  const availability = await checkAvailability(admin, roomId, checkIn, checkOut);
  if (!availability.available) {
    return NextResponse.json({
      available: false,
      reason: availability.reason,
    });
  }

  const nights = diffNights(checkIn, checkOut);
  const pricing = calculateTotal({
    basePrice: Number(room.base_price ?? room.price_weekday ?? 0),
    nights,
    adults: 1,
    children: 0,
    extraBed: false,
  });

  return NextResponse.json({
    available: true,
    nights,
    totalAmount: pricing.total,
  });
}
