import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/data/siteConfig";
import { Wordmark } from "@/components/ui/Wordmark";

export const metadata: Metadata = {
  title: "404 — หน้าที่คุณตามหาไม่อยู่ในป่าสนนี้",
  description: "หน้านี้ไม่พบ — กลับสู่หน้าหลักของ LandCamp Villa Khao Yai",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative min-h-[100svh] flex flex-col bg-[color:var(--color-forest-night)] text-[color:var(--color-bone)] overflow-hidden">
      {/* Drifting forest pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <header className="relative z-10 mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-14 py-8 flex items-center justify-between">
        <Wordmark size="md" color="bone" />
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/70 hover:text-[color:var(--color-bone)] transition-colors"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          กลับสู่หน้าหลัก
        </Link>
      </header>

      <section className="relative z-10 flex-1 flex items-center">
        <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-14 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <span
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.42em] text-[color:var(--color-warm-clay)]"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              404 · Page Not Found
            </span>
            <h1
              className="mt-6 font-display font-medium leading-[0.98] text-[44px] sm:text-6xl md:text-7xl lg:text-[104px] text-[color:var(--color-bone)]"
              style={{ letterSpacing: "-0.02em" }}
            >
              <span className="block">หลงทาง</span>
              <span className="block opacity-70">ในป่าสนเขาใหญ่</span>
            </h1>
            <p className="mt-8 max-w-md text-base sm:text-lg leading-[1.65] text-[color:var(--color-bone)]/75">
              หน้าที่คุณตามหาไม่มีอยู่ในที่นี่ — แต่ทุกห้องพักและทุกเรื่องราวของแลนด์แคมป์
              ยังรอคุณอยู่ที่หน้าหลัก
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[color:var(--color-bone)] text-[color:var(--color-forest-night)] px-8 py-4 text-[11px] uppercase tracking-[0.32em] hover:bg-[color:var(--color-warm-clay)] hover:text-[color:var(--color-bone)] transition-colors duration-500 shadow-[0_18px_38px_-18px_rgba(0,0,0,0.45)]"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                กลับสู่หน้าหลัก
                <span aria-hidden className="inline-block h-px w-5 bg-current opacity-70" />
              </Link>
              <a
                href={siteConfig.contact.lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-[color:var(--color-bone)]/35 text-[color:var(--color-bone)]/90 px-8 py-4 text-[11px] uppercase tracking-[0.32em] hover:border-[color:var(--color-bone)] hover:text-[color:var(--color-bone)] transition-colors"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                ติดต่อผ่าน Line
              </a>
            </div>
          </div>

          <aside className="lg:col-span-5 hidden lg:block">
            <div
              className="text-[14vw] font-display leading-none text-[color:var(--color-bone)]/8 select-none"
              style={{ letterSpacing: "-0.04em" }}
              aria-hidden
            >
              404
            </div>
          </aside>
        </div>
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-14 py-10 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center border-t border-[color:var(--color-bone)]/12">
        <p
          className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/45"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          © {new Date().getFullYear()} {siteConfig.brand.nameFull}
        </p>
        <p
          className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-bone)]/45"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Line {siteConfig.contact.line} · {siteConfig.contact.phone}
        </p>
      </footer>
    </main>
  );
}
