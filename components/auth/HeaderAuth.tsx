"use client";

import { usePathname } from "next/navigation";
import AuthButtons from "./AuthButtons";

export default function HeaderAuth() {
  const pathname = usePathname();
  const hideSignedOut = pathname === "/";

  return (
    <header className="app-header-auth" style={{ display: "flex", justifyContent: "flex-end" }}>
      <AuthButtons hideSignedOut={hideSignedOut} />
    </header>
  );
}
