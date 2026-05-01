"use client";

import { AuthSignInPage } from "@/lib/auth/client";

export function AuthSignInPageContent({ redirectUrl }: { redirectUrl: string }) {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "70vh", padding: 24 }}>
      <div style={{ width: "min(520px, 100%)" }}>
        <AuthSignInPage redirectUrl={redirectUrl} />
      </div>
    </div>
  );
}
