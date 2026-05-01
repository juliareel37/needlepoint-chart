"use client";

import type { ReactNode } from "react";
import { createAuthClient } from "@neondatabase/auth/next";
import {
  AccountView,
  AuthView,
  NeonAuthUIProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from "@neondatabase/auth/react/ui";

const authClient = createAuthClient();

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      credentials={{
        forgotPassword: true,
        rememberMe: true,
      }}
      social={{
        providers: ["google"],
      }}
      signUp={{
        fields: ["name"],
      }}
      viewPaths={{
        SIGN_IN: "sign-in",
        SIGN_UP: "sign-up",
        FORGOT_PASSWORD: "forgot-password",
        RESET_PASSWORD: "reset-password",
        CALLBACK: "callback",
      }}
      account={{
        fields: ["image", "name"],
        basePath: "/account",
      }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}

export function useAuthStatus() {
  const session = authClient.useSession();

  return {
    isLoaded: !session.isPending,
    isSignedIn: Boolean(session.data?.user),
  };
}

export function AuthSignedIn({ children }: { children: ReactNode }) {
  return <SignedIn>{children}</SignedIn>;
}

export function AuthSignedOut({ children }: { children: ReactNode }) {
  return <SignedOut>{children}</SignedOut>;
}

export function AuthUserButton() {
  return <UserButton />;
}

export function AuthSignInPage({
  redirectUrl,
}: {
  redirectUrl: string;
}) {
  return <AuthView pathname="sign-in" redirectTo={redirectUrl} />;
}

export function AuthAccountPage() {
  return <AccountView pathname="settings" />;
}
