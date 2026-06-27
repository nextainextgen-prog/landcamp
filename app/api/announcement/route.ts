import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Announcement = {
  enabled?: boolean;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLink?: string;
  showOnce?: boolean;
};

/** Public read of the site announcement pop-up (only safe fields, only when on). */
export async function GET() {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "announcement")
      .maybeSingle<{ value: Announcement }>();

    const a = data?.value ?? {};
    const title = (a.title ?? "").trim();
    const message = (a.message ?? "").trim();
    if (!a.enabled || (!title && !message)) {
      return NextResponse.json({ enabled: false });
    }

    const buttonText = (a.buttonText ?? "").trim();
    const buttonLink = (a.buttonLink ?? "").trim();

    // Content version → dismissing is remembered per content; editing re-shows it.
    const raw = `${title}|${message}|${buttonText}|${buttonLink}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) | 0;

    return NextResponse.json({
      enabled: true,
      title,
      message,
      buttonText: buttonLink ? buttonText : "",
      buttonLink: buttonText ? buttonLink : "",
      showOnce: a.showOnce !== false,
      version: String(hash >>> 0),
    });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
