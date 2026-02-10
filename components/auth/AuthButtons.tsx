"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function AuthButtons() {
  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button
            type="button"
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--panel-border)",
              background: "var(--card-bg)",
              color: "var(--foreground)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
