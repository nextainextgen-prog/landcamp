import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getInitials } from "@/lib/account/format";
import type { Customer } from "@/types";

export const dynamic = "force-dynamic";

const PROVIDER_LABEL: Record<string, string> = {
  line: "เข้าสู่ระบบผ่าน LINE",
  google: "เข้าสู่ระบบผ่าน Google",
};

export default async function AccountHomePage() {
  const session = await getCustomerSession();

  if (!session) {
    // Belt-and-braces — layout already redirects, but keeps TS narrowing happy.
    redirect("/");
  }

  const admin = createSupabaseAdminClient();
  const { data: customer } = await admin
    .from("customers")
    .select("id, full_name, email, avatar_url")
    .eq("id", session.id)
    .maybeSingle<Pick<Customer, "id" | "full_name" | "email" | "avatar_url">>();

  let bookingCount = 0;
  if (customer?.id) {
    const { count } = await admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customer.id);
    bookingCount = count ?? 0;
  }

  const avatarUrl = customer?.avatar_url ?? session.pictureUrl ?? null;
  const fullName = customer?.full_name ?? session.displayName ?? null;
  const email = customer?.email ?? "";
  const initials = getInitials(fullName);
  const providerLabel = PROVIDER_LABEL[session.provider] ?? "";

  return (
    <div className="space-y-10">
      <div
        className="flex items-center gap-3 text-[10px] uppercase tracking-[0.42em] sm:text-[11px]"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        <span className="text-[color:var(--color-warm-clay)]">01</span>
        <span aria-hidden className="h-px w-10 bg-[color:var(--color-forest-deep)]/35" />
        <span className="text-[color:var(--color-forest-deep)]/65">บัญชีของฉัน</span>
      </div>

      <section className="rounded-[22px] border border-[color:var(--color-forest-deep)]/8 bg-white/70 p-7 shadow-[0_20px_45px_-22px_rgba(45,55,40,0.18)] sm:p-9">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-[color:var(--color-forest-deep)] text-[color:var(--color-bone)] sm:h-24 sm:w-24">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={fullName ?? "avatar"}
                width={96}
                height={96}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] leading-tight text-[color:var(--color-forest-deep)] sm:text-[36px]">
              {fullName ?? "ผู้เยี่ยมชม"}
            </h1>
            <p className="mt-2 truncate text-sm text-[color:var(--color-ink)]/65">
              {email}
            </p>
            {providerLabel && (
              <span
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-forest-deep)]/8 px-3 py-1 text-[11px] font-medium text-[color:var(--color-forest-deep)]"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {providerLabel}
              </span>
            )}
          </div>

          <div className="sm:ml-auto sm:text-right">
            <div
              className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/55"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              การจองทั้งหมด
            </div>
            <div className="mt-1 font-display text-4xl text-[color:var(--color-forest-deep)] sm:text-5xl">
              {bookingCount}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[color:var(--color-forest-deep)]/10 pt-6">
          <Link
            href="/account/bookings"
            className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-warm-clay)] transition-colors hover:text-[color:var(--color-forest-deep)]"
          >
            ดูการจองทั้งหมด
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
