"use client";

import { AuthSignInPage } from "@/lib/auth/client";

export function AuthSignInPageContent({ redirectUrl }: { redirectUrl: string }) {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "70vh", padding: 24 }}>
      <AuthSignInPage redirectUrl={redirectUrl} renderStatusCard={StatusCard} />
    </div>
  );
}

function StatusCard({
  title,
  description,
  detail,
}: {
  title: string;
  description: string;
  detail?: string;
}) {
  return (
    <section
      style={{
        width: "min(520px, 100%)",
        borderRadius: 18,
        border: "1px solid rgba(31, 26, 23, 0.12)",
        background: "rgba(255, 255, 255, 0.92)",
        boxShadow: "0 18px 40px rgba(31, 26, 23, 0.08)",
        padding: 20,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.15 }}>{title}</h1>
      <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6 }}>
        {description}
      </p>
      {detail ? (
        <pre
          style={{
            margin: "14px 0 0",
            padding: 12,
            borderRadius: 12,
            background: "#1f1a17",
            color: "#f8f4ec",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {detail}
        </pre>
      ) : null}
    </section>
  );
}
