"use client";

import { useEffect, useState } from "react";
import { useAuthSession } from "@/lib/auth/client";
import {
  THEME_MODE_ATTRIBUTE,
  THEME_STORAGE_KEY,
  parseThemeMode,
  type ThemeMode,
} from "@/lib/theme/themePreference";

export type { ThemeMode } from "@/lib/theme/themePreference";
export type ResolvedThemeMode = "light" | "dark";

const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";
const THEME_TRANSITION_ATTRIBUTE = "data-theme-transitioning";
const THEME_TRANSITION_DURATION_MS = 260;
const THEME_CHANGE_EVENT = "wippa:theme-change";

let themeTransitionTimeoutId: number | null = null;
const profileThemeRequestCache = new Map<string, Promise<ThemeMode | null>>();

function getSystemThemeMode(): ResolvedThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light";
}

function resolveThemeMode(nextTheme: ThemeMode): ResolvedThemeMode {
  return nextTheme === "system" ? getSystemThemeMode() : nextTheme;
}

function beginThemeTransition() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  document.documentElement.setAttribute(THEME_TRANSITION_ATTRIBUTE, "true");

  if (themeTransitionTimeoutId !== null) {
    window.clearTimeout(themeTransitionTimeoutId);
  }

  themeTransitionTimeoutId = window.setTimeout(() => {
    document.documentElement.removeAttribute(THEME_TRANSITION_ATTRIBUTE);
    themeTransitionTimeoutId = null;
  }, THEME_TRANSITION_DURATION_MS);
}

function emitThemeChange(nextTheme: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<{ themeMode: ThemeMode }>(THEME_CHANGE_EVENT, {
      detail: { themeMode: nextTheme },
    }),
  );
}

function applyThemeMode(nextTheme: ThemeMode, options?: { animate?: boolean }): ResolvedThemeMode {
  if (typeof document === "undefined") {
    return nextTheme === "dark" ? "dark" : "light";
  }

  if (options?.animate) {
    beginThemeTransition();
  }

  const resolvedTheme = resolveThemeMode(nextTheme);

  document.documentElement.setAttribute(THEME_MODE_ATTRIBUTE, nextTheme);

  if (resolvedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  return resolvedTheme;
}

function getThemeModeFromDocument(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }

  const attributeTheme = parseThemeMode(
    document.documentElement.getAttribute(THEME_MODE_ATTRIBUTE),
  );

  if (attributeTheme) {
    return attributeTheme;
  }

  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function persistThemeModeLocally(nextTheme: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {}
}

async function fetchProfileThemeMode(userId: string): Promise<ThemeMode | null> {
  const cachedRequest = profileThemeRequestCache.get(userId);
  if (cachedRequest) {
    return cachedRequest;
  }

  const request = fetch("/api/auth/theme-preference", {
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }

      const payload = (await response.json().catch(() => null)) as
        | { themeMode?: string }
        | null;

      return parseThemeMode(payload?.themeMode ?? null);
    })
    .catch(() => null)
    .finally(() => {
      profileThemeRequestCache.delete(userId);
    });

  profileThemeRequestCache.set(userId, request);
  return request;
}

async function persistThemeModeToProfile(nextTheme: ThemeMode): Promise<void> {
  await fetch("/api/auth/theme-preference", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ themeMode: nextTheme }),
  });
}

export function useThemeMode() {
  const { isLoaded, isSignedIn, user } = useAuthSession();
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [resolvedThemeMode, setResolvedThemeMode] = useState<ResolvedThemeMode>("light");

  useEffect(() => {
    try {
      const savedTheme = parseThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
      const nextTheme = savedTheme ?? getThemeModeFromDocument();
      const nextResolvedTheme = applyThemeMode(nextTheme);
      setThemeMode(nextTheme);
      setResolvedThemeMode(nextResolvedTheme);
    } catch {
      const nextTheme = getThemeModeFromDocument();
      const nextResolvedTheme = applyThemeMode(nextTheme);
      setThemeMode(nextTheme);
      setResolvedThemeMode(nextResolvedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);

    const handleChange = () => {
      setResolvedThemeMode((currentResolvedTheme) => {
        if (themeMode !== "system") {
          return currentResolvedTheme;
        }

        return applyThemeMode("system", { animate: true });
      });
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncTheme = (nextTheme: ThemeMode) => {
      const nextResolvedTheme = applyThemeMode(nextTheme);
      setThemeMode(nextTheme);
      setResolvedThemeMode(nextResolvedTheme);
    };

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ themeMode?: ThemeMode }>;
      const nextTheme = customEvent.detail?.themeMode;
      if (!nextTheme) {
        return;
      }

      syncTheme(nextTheme);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = parseThemeMode(event.newValue) ?? getThemeModeFromDocument();
      syncTheme(nextTheme);
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !user?.id) {
      const localTheme =
        (typeof window !== "undefined"
          ? parseThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY))
          : null) ?? getThemeModeFromDocument();
      const nextResolvedTheme = applyThemeMode(localTheme);
      setThemeMode(localTheme);
      setResolvedThemeMode(nextResolvedTheme);
      return;
    }

    let isCancelled = false;

    void fetchProfileThemeMode(user.id).then((profileThemeMode) => {
      if (isCancelled || !profileThemeMode) {
        return;
      }

      persistThemeModeLocally(profileThemeMode);
      const nextResolvedTheme = applyThemeMode(profileThemeMode);
      setThemeMode(profileThemeMode);
      setResolvedThemeMode(nextResolvedTheme);
      emitThemeChange(profileThemeMode);
    });

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id]);

  const setAndPersistThemeMode = (nextTheme: ThemeMode) => {
    const nextResolvedTheme = applyThemeMode(nextTheme, { animate: true });
    setThemeMode(nextTheme);
    setResolvedThemeMode(nextResolvedTheme);
    persistThemeModeLocally(nextTheme);
    emitThemeChange(nextTheme);

    if (isSignedIn && user?.id) {
      void persistThemeModeToProfile(nextTheme).catch(() => {});
    }
  };

  return {
    resolvedThemeMode,
    themeMode,
    setThemeMode: setAndPersistThemeMode,
  };
}
