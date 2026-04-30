"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAuthDialog } from "@/lib/auth/client";

const MOBILE_SIGN_IN_BREAKPOINT_PX = 768;

export function useOpenSignIn(): (options?: { redirectUrl?: string }) => void {
  const authDialog = useAuthDialog();
  const router = useRouter();

  return useCallback((options?: { redirectUrl?: string }) => {
    const currentUrl =
      options?.redirectUrl ??
      (typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/");
    const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`;
    const usePageNavigation =
      typeof window !== "undefined" &&
      window.matchMedia(`(max-width: ${MOBILE_SIGN_IN_BREAKPOINT_PX}px)`).matches;
    const navigateToSignInPage = () => {
      router.push(signInUrl);
    };

    if (usePageNavigation) {
      navigateToSignInPage();
      return;
    }

    if (!authDialog.isLoaded || authDialog.status !== "ready") {
      console.warn("Sign-in modal unavailable before auth client finished loading", {
        authLoaded: authDialog.isLoaded,
        authStatus: authDialog.status,
      });
      navigateToSignInPage();
      return;
    }

    try {
      authDialog.openSignIn({
        fallbackRedirectUrl: currentUrl,
        forceRedirectUrl: currentUrl,
      });
    } catch (error) {
      console.warn("Sign-in modal failed to open, falling back to sign-in page", {
        error,
        authLoaded: authDialog.isLoaded,
        authStatus: authDialog.status,
      });
      navigateToSignInPage();
    }
  }, [authDialog, router]);
}
