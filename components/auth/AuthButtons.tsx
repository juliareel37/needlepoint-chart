"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/design-system";
import { useOpenSignIn } from "./useOpenSignIn";

export default function AuthButtons() {
  const openSignIn = useOpenSignIn();

  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="app-header-sign-in-button"
          onClick={openSignIn}
        >
          Sign in
        </Button>
      </SignedOut>
    </>
  );
}
