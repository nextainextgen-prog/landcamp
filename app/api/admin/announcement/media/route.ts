import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const EXT: Record<string, string> = { "image/jpeg": "jpg" };

/** Uploads an announcement image to the public `site-media` bucket; returns its URL. */
export async function POST(req: NextRequest) {
  const auth = await requireSection("settings");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }
  if (!ALLOWED_IMAGE.has(file.type)) {
    return NextResponse.json({ error: "รองรับเฉพาะไฟล์รูปภาพ" }, { status: 415 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "รูปใหญ่เกินไป (สูงสุด 8MB)" }, { status: 413 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = EXT[file.type] ?? file.type.split("/")[1] ?? "bin";
  const path = `announcement/${Date.now()}-${bytes.length}.${ext}`;

  const { error } = await admin.storage
    .from("site-media")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) {
    return NextResponse.json({ error: `อัปโหลดไม่สำเร็จ: ${error.message}` }, { status: 500 });
  }

  const { data } = admin.storage.from("site-media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
