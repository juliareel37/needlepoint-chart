"use client";

import { AuthSignInPage } from "@/lib/auth/client";

export function AuthSignInPageContent({
  pathname,
  redirectUrl,
}: {
  pathname: string;
  redirectUrl: string;
}) {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "70vh", padding: 24 }}>
      <div style={{ width: "min(520px, 100%)" }}>
        <AuthSignInPage pathname={pathname} redirectUrl={redirectUrl} />
      </div>
    </div>
  );
}
