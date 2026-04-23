"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/design-system";

export default function AuthButtons() {
  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="app-header-sign-in-button"
          >
            Sign in
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
