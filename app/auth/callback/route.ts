import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Google (Supabase) OAuth callback.
 *
 * Supabase redirects here after a successful Google sign-in with `?code=...`.
 * We exchange the code for a session (writing the auth cookies), stamp the
 * customer's auth_provider = 'google' (and refresh name/avatar), then send the
 * user back. The customer row itself is seeded by the auth.users trigger.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const meta = (user.user_metadata ?? {}) as {
          full_name?: string;
          avatar_url?: string;
        };
        const admin = createSupabaseAdminClient();
        await admin
          .from("customers")
          .update({
            auth_provider: "google",
            ...(meta.full_name ? { full_name: meta.full_name } : {}),
            ...(meta.avatar_url ? { avatar_url: meta.avatar_url } : {}),
          })
          .eq("auth_user_id", user.id);
      }
    } catch {
      // non-fatal — sign-in already succeeded
    }
  }

  return NextResponse.redirect(new URL("/", origin));
}
