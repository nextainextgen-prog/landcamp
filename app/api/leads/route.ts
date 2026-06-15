import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Contact-form submission endpoint.
 *
 * Runs server-side with the service-role key — bypasses RLS so we don't
 * need to expose anon INSERT on the leads table. This also gives us a
 * clean place to add rate-limit / spam protection later.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

type LeadPayload = {
  name?: string;
  phone?: string;
  email?: string | null;
  checkin_date?: string | null;
  message?: string | null;
  source?: string;
};

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: NextRequest) {
  if (!admin) {
    console.error("Supabase env vars not configured");
    return bad("Server not configured", 500);
  }

  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const email = (body.email ?? "").trim() || null;
  const message = (body.message ?? "").trim() || null;
  const checkin = (body.checkin_date ?? "").trim() || null;
  const source = (body.source ?? "landing-page").trim();

  if (!name || !phone) {
    return bad("name and phone required");
  }
  if (name.length > 120 || phone.length > 40) {
    return bad("input too long");
  }
  if (message && message.length > 2000) {
    return bad("message too long");
  }

  const { error } = await admin.from("leads").insert({
    name,
    phone,
    email,
    checkin_date: checkin,
    message,
    source,
  });

  if (error) {
    console.error("leads insert error:", error);
    return bad(error.message, 500);
  }

  return NextResponse.json({ ok: true });
}
