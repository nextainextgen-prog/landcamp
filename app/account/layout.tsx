import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCustomerSession } from "@/lib/customer/session";

export const metadata: Metadata = {
  title: "บัญชีของฉัน",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCustomerSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-bone)] text-[color:var(--color-ink)]">
      <header className="border-b border-[color:var(--color-forest-deep)]/10 bg-[color:var(--color-bone-soft)]/60 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="font-serif text-xl tracking-tight text-[color:var(--color-forest-deep)]"
          >
            LandCamp
          </Link>
          <nav
            className="flex items-center gap-6 text-[11px] uppercase tracking-[0.32em] text-[color:var(--color-forest-deep)]/70"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            <Link href="/account" className="hover:text-[color:var(--color-warm-clay)]">
              บัญชี
            </Link>
            <Link
              href="/account/bookings"
              className="hover:text-[color:var(--color-warm-clay)]"
            >
              การจอง
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>
    </div>
  );
}
