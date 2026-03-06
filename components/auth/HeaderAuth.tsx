"use client";

import AuthButtons from "./AuthButtons";

export default function HeaderAuth() {
  return (
    <header className="app-header-auth" style={{ display: "flex", justifyContent: "flex-end" }}>
      <AuthButtons />
    </header>
  );
}
