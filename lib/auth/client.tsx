"use client";

import type { ReactNode } from "react";
import {
  ClerkDegraded,
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  ClerkProvider,
  SignIn,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
  useClerk,
} from "@clerk/nextjs";

export function AuthProvider({
  children,
  publishableKey,
}: {
  children: ReactNode;
  publishableKey: string;
}) {
  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}

export function useAuthStatus() {
  const { isLoaded, isSignedIn } = useAuth();

  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
  };
}

export function useAuthDialog() {
  const clerk = useClerk();

  return {
    isLoaded: clerk.loaded,
    status: clerk.status,
    openSignIn: clerk.openSignIn,
  };
}

export function AuthSignedIn({ children }: { children: ReactNode }) {
  return <SignedIn>{children}</SignedIn>;
}

export function AuthSignedOut({ children }: { children: ReactNode }) {
  return <SignedOut>{children}</SignedOut>;
}

export function AuthUserButton({ afterSignOutUrl }: { afterSignOutUrl: string }) {
  return <UserButton afterSignOutUrl={afterSignOutUrl} />;
}

export function AuthSignInPage({
  redirectUrl,
  renderStatusCard,
}: {
  redirectUrl: string;
  renderStatusCard: (props: {
    title: string;
    description: string;
    detail?: string;
  }) => ReactNode;
}) {
  return (
    <>
      <ClerkLoading>
        {renderStatusCard({
          title: "Loading sign in",
          description: "The authentication UI is still loading.",
        })}
      </ClerkLoading>

      <ClerkLoaded>
        <div style={{ display: "grid", gap: 16, justifyItems: "center" }}>
          <ClerkDegraded>
            {renderStatusCard({
              title: "Authentication is degraded",
              description:
                "The authentication client loaded in a degraded state. Sign in may be temporarily unavailable.",
            })}
          </ClerkDegraded>

          <SignIn
            path="/sign-in"
            routing="path"
            fallbackRedirectUrl={redirectUrl}
            forceRedirectUrl={redirectUrl}
          />
        </div>
      </ClerkLoaded>

      <ClerkFailed>
        {renderStatusCard({
          title: "Authentication failed to load",
          description:
            "The authentication client did not initialize on this page. This usually means the production auth script or domain is failing before the sign-in UI can mount.",
          detail: `redirect_url=${redirectUrl}`,
        })}
      </ClerkFailed>
    </>
  );
}
