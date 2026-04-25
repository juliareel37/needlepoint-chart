"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const MOBILE_SIGN_IN_BREAKPOINT_PX = 768;

export function useOpenSignIn(): () => void {
  const clerk = useClerk();
  const router = useRouter();

  return useCallback(() => {
    const currentUrl =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/";
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

    if (!clerk.loaded || clerk.status !== "ready") {
      console.warn("Sign-in modal unavailable before Clerk finished loading", {
        clerkLoaded: clerk.loaded,
        clerkStatus: clerk.status,
      });
      navigateToSignInPage();
      return;
    }

    try {
      clerk.openSignIn({
        fallbackRedirectUrl: currentUrl,
        forceRedirectUrl: currentUrl,
      });
    } catch (error) {
      console.warn("Sign-in modal failed to open, falling back to sign-in page", {
        error,
        clerkLoaded: clerk.loaded,
        clerkStatus: clerk.status,
      });
      navigateToSignInPage();
    }
  }, [clerk, router]);
}
