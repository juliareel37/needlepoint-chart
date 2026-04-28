"use client";

import { useEffect } from "react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App render failed", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f6f4ee",
        color: "#1f1a17",
        fontFamily:
          'Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          width: "min(680px, 100%)",
          borderRadius: 20,
          border: "1px solid rgba(31, 26, 23, 0.12)",
          background: "rgba(255, 255, 255, 0.9)",
          boxShadow: "0 24px 60px rgba(31, 26, 23, 0.12)",
          padding: 24,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#7b5d37",
          }}
        >
          Runtime Error
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: 28, lineHeight: 1.1 }}>
          The app hit an error instead of rendering a blank page.
        </h1>
        <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.6 }}>
          This should make the production failure visible so we can identify the
          real crash.
        </p>
        <pre
          style={{
            margin: "20px 0 0",
            padding: 16,
            borderRadius: 14,
            background: "#1f1a17",
            color: "#f8f4ec",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {error.message || "Unknown error"}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 20,
            border: 0,
            borderRadius: 12,
            background: "#8b5e34",
            color: "#fffaf3",
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </section>
    </main>
  );
}
