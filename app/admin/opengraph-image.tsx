import { ImageResponse } from "next/og";

// Link-unfurl preview for the backoffice: a branded mock of the login screen,
// so sharing the /admin URL in chat shows the LandCamp sign-in page.
export const runtime = "nodejs";
export const alt = "LandCamp Backoffice — Sign in";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FOREST_NIGHT = "#2c3327";
const FOREST_DEEP = "#4d584b";
const CLAY = "#9a795b";
const BONE = "#f5f1ea";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", fontFamily: "sans-serif" }}>
        {/* ── Brand panel ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "60%",
            height: "100%",
            padding: "72px",
            color: BONE,
            background: `radial-gradient(1200px 600px at 10% 0%, rgba(154,121,91,0.35), transparent 55%), ${FOREST_NIGHT}`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 64, fontWeight: 600, letterSpacing: -1 }}>LandCamp</div>
            <div style={{ fontSize: 20, letterSpacing: 10, color: "rgba(245,241,234,0.55)", marginTop: 6 }}>
              VILLA KHAO YAI
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "8px 18px",
                borderRadius: 999,
                fontSize: 22,
                letterSpacing: 3,
                color: "rgba(245,241,234,0.8)",
                background: "rgba(245,241,234,0.08)",
                border: "1px solid rgba(245,241,234,0.18)",
              }}
            >
              BACKOFFICE
            </div>
            <div style={{ fontSize: 54, fontWeight: 600, lineHeight: 1.1 }}>Backoffice Sign-in</div>
            <div style={{ fontSize: 24, color: "rgba(245,241,234,0.6)" }}>
              Management system · Villa Khao Yai
            </div>
          </div>
        </div>

        {/* ── Form panel (mock sign-in) ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "40%",
            height: "100%",
            padding: "72px 64px",
            background: BONE,
          }}
        >
          <div style={{ fontSize: 44, fontWeight: 700, color: FOREST_DEEP }}>Sign in</div>
          <div style={{ fontSize: 20, color: "rgba(26,24,20,0.5)", marginTop: 8 }}>
            Staff access
          </div>

          <div style={{ display: "flex", height: 56, marginTop: 36, borderRadius: 14, background: "#ffffff", border: "1px solid rgba(77,88,75,0.18)" }} />
          <div style={{ display: "flex", height: 56, marginTop: 18, borderRadius: 14, background: "#ffffff", border: "1px solid rgba(77,88,75,0.18)" }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 60,
              marginTop: 24,
              borderRadius: 999,
              background: FOREST_DEEP,
              color: BONE,
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            Sign in  →
          </div>

          <div style={{ display: "flex", marginTop: 28, fontSize: 16, color: "rgba(26,24,20,0.4)" }}>
            Authorized staff only
          </div>
          {/* clay accent bar */}
          <div style={{ display: "flex", height: 6, width: 96, marginTop: 28, borderRadius: 999, background: CLAY }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
