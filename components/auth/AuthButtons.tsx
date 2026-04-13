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
              padding: "4px 8px",
              borderRadius: 8,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--surface-card)",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.2,
              transition: "background-color 150ms ease, border-color 150ms ease",
            }}
          >
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
