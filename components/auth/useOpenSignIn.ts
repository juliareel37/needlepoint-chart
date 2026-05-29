"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useOpenSignIn(): (options?: { redirectUrl?: string }) => void {
  const router = useRouter();

  return useCallback((options?: { redirectUrl?: string }) => {
    const requestedUrl =
      options?.redirectUrl ??
      (typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/");
    const currentUrl = requestedUrl === "/" ? "/library" : requestedUrl;
    router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
  }, [router]);
}
