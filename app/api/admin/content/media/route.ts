import { NextResponse, type NextRequest } from "next/server";

import { requireSection } from "@/lib/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const ALLOWED_VIDEO = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "video/quicktime": "mov",
};

function extFor(type: string): string {
  return EXT[type] ?? type.split("/")[1] ?? "bin";
}

/** Uploads an image or video to the public `site-media` bucket; returns its URL. */
export async function POST(req: NextRequest) {
  const auth = await requireSection("content");
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
  const isVideo = ALLOWED_VIDEO.has(file.type);
  const isImage = ALLOWED_IMAGE.has(file.type);
  if (!isVideo && !isImage) {
    return NextResponse.json({ error: "unsupported file type" }, { status: 415 });
  }
  const cap = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > cap) {
    return NextResponse.json(
      { error: isVideo ? "video too large (max 50MB)" : "image too large (max 8MB)" },
      { status: 413 },
    );
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const stamp = `${Date.now()}-${Math.round(bytes.length)}`;
  const path = `${isVideo ? "video" : "gallery"}/${stamp}.${extFor(file.type)}`;

  const { error } = await admin.storage
    .from("site-media")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) {
    return NextResponse.json(
      { error: `upload failed: ${error.message} — run migration 014?` },
      { status: 500 },
    );
  }

  const { data } = admin.storage.from("site-media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
