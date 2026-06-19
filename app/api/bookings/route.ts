import { NextResponse, type NextRequest } from "next/server";

import { CreateBookingSchema } from "@/lib/schemas/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { error: "scaffold — payment integration pending" },
    { status: 501 },
  );
}
