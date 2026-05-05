"use client";

import type { ReactNode } from "react";
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
