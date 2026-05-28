"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createAuthClient } from "@neondatabase/auth/next";

const authClient = createAuthClient();
const authActions = {
  changeEmail: authClient.changeEmail,
  changePassword: authClient.changePassword,
  listSessions: authClient.listSessions,
  requestPasswordReset: authClient.requestPasswordReset,
  revokeOtherSessions: authClient.revokeOtherSessions,
  revokeSession: authClient.revokeSession,
  sendVerificationEmail: authClient.sendVerificationEmail,
  resetPassword: authClient.resetPassword,
  signInWithEmail: authClient.signIn.email,
  signInWithGoogle: authClient.signIn.social,
  signOut: authClient.signOut,
  signUpWithEmail: authClient.signUp.email,
  updateUser: authClient.updateUser,
};

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function useAuthSession() {
  const session = authClient.useSession();

  return {
    isLoaded: !session.isPending,
    isSignedIn: Boolean(session.data?.user),
    isPending: session.isPending,
    user: session.data?.user ?? null,
    session: session.data?.session ?? null,
    error: session.error,
    refetch: session.refetch,
  };
}

export function useAuthStatus() {
  const { isLoaded, isSignedIn } = useAuthSession();
  return { isLoaded, isSignedIn };
}

export function useAuthAccessState() {
  const { isLoaded, isSignedIn } = useAuthSession();
  const [accessState, setAccessState] = useState<
    "loading" | "signed_out" | "approved" | "pending_approval"
  >(isSignedIn ? "loading" : "signed_out");
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setAccessState("signed_out");
      setResolvedEmail(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/auth/access-state", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        const body = (await response.json().catch(() => null)) as
          | { accessState?: unknown; hasAppAccess?: unknown; email?: unknown }
          | null;

        if (cancelled) {
          return;
        }

        setResolvedEmail(typeof body?.email === "string" ? body.email : null);

        if (body?.accessState === "approved" && body?.hasAppAccess === true) {
          setAccessState("approved");
          return;
        }

        if (body?.accessState === "pending_approval") {
          setAccessState("pending_approval");
          return;
        }

        setAccessState("signed_out");
      } catch {
        if (!cancelled) {
          setAccessState("signed_out");
          setResolvedEmail(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  return {
    isLoaded: isLoaded && (!isSignedIn || accessState !== "loading"),
    accessState,
    hasAppAccess: accessState === "approved",
    resolvedEmail,
  };
}

export function useAuthActions() {
  return authActions;
}

export function AuthSignedIn({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuthSession();
  return isSignedIn ? <>{children}</> : null;
}

export function AuthSignedOut({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuthSession();
  return isSignedIn ? null : <>{children}</>;
}
