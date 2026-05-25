import { ImageResponse } from "next/og";

/**
 * Dynamic Open Graph image — rendered on the edge at request time
 * and cached aggressively by Vercel. The exact dimensions match the
 * social-media spec (1200×630) so it looks crisp in Twitter / LinkedIn
 * / Slack unfurls.
 *
 * Edit the gradient or copy below to update what people see when they
 * share novaflow.app.
 */

export const runtime = "edge";
export const alt = "NovaFlow — AI-Powered Workspace Collaboration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(94, 106, 210,0.45), transparent 60%), radial-gradient(ellipse 70% 60% at 90% 90%, rgba(14, 165, 233,0.35), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, rgba(79, 70, 229,0.35), transparent 60%), #0b0a10",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #22d3ee 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(94, 106, 210, 0.15)",
              fontSize: 28,
              fontWeight: 700,
              color: "white",
            }}
          >
            N
          </div>
          <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>
            NovaFlow
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              maxWidth: 1000,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>The AI workspace</span>
            <span
              style={{
                background:
                  "linear-gradient(135deg, #a78bfa 0%, #f0abfc 50%, #67e8f9 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              for shipping teams.
            </span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 900,
            }}
          >
            Plan, build, and ship — together. Beautifully fast. Cinematically smooth.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "rgba(255,255,255,0.55)",
            fontSize: 22,
            letterSpacing: "0.02em",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#22d3ee",
                boxShadow: "0 0 12px #22d3ee",
              }}
            />
            novaflow.app
          </span>
          <span style={{ fontFamily: "monospace", fontSize: 18 }}>
            AI · Kanban · Realtime · Workspaces
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
