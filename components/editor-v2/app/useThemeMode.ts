"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "system" | "dark";
export type ResolvedThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "wippa:theme";
const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";
const THEME_TRANSITION_ATTRIBUTE = "data-theme-transitioning";
const THEME_TRANSITION_DURATION_MS = 260;

let themeTransitionTimeoutId: number | null = null;

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

function applyThemeMode(nextTheme: ThemeMode, options?: { animate?: boolean }): ResolvedThemeMode {
  if (typeof document === "undefined") {
    return nextTheme === "dark" ? "dark" : "light";
  }

  if (options?.animate) {
    beginThemeTransition();
  }

  const resolvedTheme = resolveThemeMode(nextTheme);

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

  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function parseStoredThemeMode(value: string | null): ThemeMode | null {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return null;
}

export function useThemeMode() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [resolvedThemeMode, setResolvedThemeMode] = useState<ResolvedThemeMode>("light");

  useEffect(() => {
    try {
      const savedTheme = parseStoredThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
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

  const setAndPersistThemeMode = (nextTheme: ThemeMode) => {
    const nextResolvedTheme = applyThemeMode(nextTheme, { animate: true });
    setThemeMode(nextTheme);
    setResolvedThemeMode(nextResolvedTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {}
  };

  return {
    resolvedThemeMode,
    themeMode,
    setThemeMode: setAndPersistThemeMode,
  };
}
