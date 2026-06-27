"use client";

// Global error boundary — the last-resort fallback that also catches errors
// thrown by the root layout itself. Must render its own <html>/<body>.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="th">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          fontFamily: "system-ui, sans-serif",
          background: "#f3efe6",
          color: "#2d3728",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>เกิดข้อผิดพลาด</h1>
        <p style={{ fontSize: "0.9rem", opacity: 0.7, maxWidth: "28rem" }}>
          ขออภัย ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง
        </p>
        <button
          onClick={reset}
          style={{
            border: "none",
            borderRadius: "9999px",
            background: "#2d3728",
            color: "#fff",
            padding: "0.65rem 1.5rem",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          ลองใหม่อีกครั้ง
        </button>
      </body>
    </html>
  );
}
