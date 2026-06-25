"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/ui/Wordmark";

function Icon({ name, className = "h-[18px] w-[18px]" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></>,
    lock: <><rect x="4.5" y="10" width="15" height="10.5" rx="2.2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
    eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.7 3.3M6.2 7.7A17 17 0 0 0 2.5 12s3.5 6 9.5 6a9.4 9.4 0 0 0 3.7-.74" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name] ?? null}
    </svg>
  );
}

export function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        // Always land on the booking calendar (/admin redirects there).
        router.replace("/admin");
        router.refresh();
        return;
      }
      setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
      setSubmitting(false);
    } catch {
      setError("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
      setSubmitting(false);
    }
  }

  const inputBase =
    "w-full rounded-xl border border-[color:var(--color-forest-deep)]/15 bg-white py-3 pl-11 pr-3 text-sm text-[color:var(--color-ink)] outline-none transition-all placeholder:text-[color:var(--color-ink)]/35 focus:border-[color:var(--color-warm-clay)] focus:ring-4 focus:ring-[color:var(--color-warm-clay)]/12";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.15fr_1fr]">
      {/* ── Brand panel ───────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-[color:var(--color-forest-night)] text-[color:var(--color-bone)] lg:flex lg:flex-col">
        {/* layered ambient glow */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 12% 8%, rgba(154,121,91,0.30), transparent 55%), radial-gradient(90% 80% at 95% 100%, rgba(119,132,117,0.32), transparent 60%)",
          }}
        />
        {/* topographic contour lines */}
        <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.10]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 600 800" fill="none" stroke="currentColor" strokeWidth={1.2}>
          {Array.from({ length: 9 }).map((_, i) => (
            <path
              key={i}
              d={`M-40 ${120 + i * 78} C 140 ${60 + i * 78}, 320 ${200 + i * 78}, 660 ${100 + i * 78}`}
            />
          ))}
        </svg>

        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          {/* wordmark — typographic, no image logo */}
          <Wordmark size="lg" color="bone" href="" />

          {/* headline */}
          <div className="max-w-xl">
            <h1
              className="font-semibold leading-[1.12] tracking-tight text-[2.7rem] xl:text-[3.3rem]"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              ยินดีต้อนรับกลับ
              <br />
              สู่หลังบ้าน LandCamp
            </h1>
            <p className="mt-5 max-w-md text-[15px] font-light leading-relaxed text-[color:var(--color-bone)]/70">
              พื้นที่ทำงานสำหรับทีมดูแล Villa Khao Yai
            </p>
          </div>

          {/* spacer to balance the layout */}
          <div className="h-2" />
        </div>
      </aside>

      {/* ── Form panel ────────────────────────────────────────── */}
      <main className="relative flex items-center justify-center bg-[color:var(--color-bone)] px-5 py-10 sm:px-8">
        {/* subtle texture on the form side */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(70% 50% at 50% -10%, rgba(154,121,91,0.08), transparent 60%)",
          }}
        />

        <div className="relative w-full max-w-sm">
          {/* mobile wordmark */}
          <div className="mb-9 flex justify-center lg:hidden">
            <Wordmark size="md" color="ink" href="" />
          </div>

          <div className="mb-8">
            <h2
              className="text-[1.9rem] font-semibold tracking-tight text-[color:var(--color-forest-deep)]"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              เข้าสู่ระบบ
            </h2>
            <p className="mt-1.5 text-sm font-light text-[color:var(--color-ink)]/55">
              กรอกข้อมูลบัญชีผู้ดูแลเพื่อเข้าใช้งานแดชบอร์ด
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {/* username */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--color-ink)]/50">ชื่อผู้ใช้</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-ink)]/35">
                  <Icon name="user" />
                </span>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ชื่อผู้ใช้ของคุณ"
                  className={inputBase}
                  autoFocus
                />
              </div>
            </label>

            {/* password */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--color-ink)]/50">รหัสผ่าน</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-ink)]/35">
                  <Icon name="lock" />
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputBase} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[color:var(--color-ink)]/40 transition-colors hover:bg-[color:var(--color-bone-soft)] hover:text-[color:var(--color-forest-deep)]"
                >
                  <Icon name={showPw ? "eyeOff" : "eye"} />
                </button>
              </div>
            </label>

            {error && (
              <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">!</span>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-forest-deep)] px-4 py-3.5 text-sm font-semibold tracking-wide text-[color:var(--color-bone)] shadow-lg shadow-[color:var(--color-forest-deep)]/20 transition-all hover:bg-[color:var(--color-warm-clay)] hover:shadow-[color:var(--color-warm-clay)]/25 focus:outline-none focus:ring-4 focus:ring-[color:var(--color-warm-clay)]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--color-bone)]/40 border-t-[color:var(--color-bone)]" />
                  กำลังเข้าสู่ระบบ…
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <Icon name="arrow" className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[12px] font-light text-[color:var(--color-ink)]/40">
            © {new Date().getFullYear()} LandCamp · เฉพาะเจ้าหน้าที่ที่ได้รับอนุญาต
          </p>
        </div>
      </main>
    </div>
  );
}
