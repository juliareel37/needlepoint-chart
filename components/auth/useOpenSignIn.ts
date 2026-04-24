"use client";

import { useClerk } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const MOBILE_SIGN_IN_BREAKPOINT_PX = 768;

export function useOpenSignIn(): () => void {
  const clerk = useClerk();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return useCallback(() => {
    const currentUrl =
      pathname && searchParams?.size
        ? `${pathname}?${searchParams.toString()}`
        : pathname || "/";
    const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`;
    const usePageNavigation =
      typeof window !== "undefined" &&
      window.matchMedia(`(max-width: ${MOBILE_SIGN_IN_BREAKPOINT_PX}px)`).matches;

    if (usePageNavigation) {
      router.push(signInUrl);
      return;
    }

    try {
      clerk.openSignIn({
        fallbackRedirectUrl: currentUrl,
      });
    } catch {
      router.push(signInUrl);
    }
  }, [clerk, pathname, router, searchParams]);
}
