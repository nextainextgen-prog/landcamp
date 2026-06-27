"use client";

/** ปุ่มบันทึก PDF / พิมพ์ — ใช้ความสามารถพิมพ์ของเบราว์เซอร์ (ซ่อนตัวเองตอนพิมพ์) */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-forest-deep)] px-4 py-2 text-xs font-medium text-[color:var(--color-bone)] transition hover:opacity-90"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9V3h12v6" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="7" rx="1" />
      </svg>
      บันทึก PDF / พิมพ์
    </button>
  );
}
