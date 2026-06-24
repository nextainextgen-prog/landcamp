import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/customer/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lightweight session probe for client components (navbar, booking modal). */
export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: session.id,
      displayName: session.displayName,
      pictureUrl: session.pictureUrl,
      provider: session.provider,
    },
  });
}
