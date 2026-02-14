"use client";

import AuthButtons from "./AuthButtons";

export default function HeaderAuth() {
  return (
    <header style={{ display: "flex", justifyContent: "flex-end" }}>
      <AuthButtons />
    </header>
  );
}
