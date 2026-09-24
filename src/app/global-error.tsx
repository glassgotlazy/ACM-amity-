"use client";

/**
 * Last resort: the root layout itself failed, so no fonts, theme or chrome
 * are available. Everything here is inline and self-contained on purpose.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background: "#0D1422",
          color: "#ECF1F8",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <main style={{ padding: "0 clamp(1.25rem, 4vw, 4.5rem)", maxWidth: 720 }}>
          <p style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.16em", color: "#70C0F6" }}>
            SITE ERROR
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1, letterSpacing: "-0.03em", margin: "1.5rem 0 0" }}>
            The site failed to load.
          </h1>
          <p style={{ color: "#AAB6C8", lineHeight: 1.6, marginTop: "1.5rem" }}>
            This should not happen. Reloading almost always fixes it.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.18em", color: "#8291A8", marginTop: "1rem" }}>
              REFERENCE {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2.5rem",
              height: 56,
              padding: "0 2rem",
              background: "#1670B8",
              color: "#fff",
              border: 0,
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
