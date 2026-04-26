"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "system" | "dark";
export type ResolvedThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "wippa:theme";
const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function getSystemThemeMode(): ResolvedThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light";
}

function resolveThemeMode(nextTheme: ThemeMode): ResolvedThemeMode {
  return nextTheme === "system" ? getSystemThemeMode() : nextTheme;
}

function applyThemeMode(nextTheme: ThemeMode): ResolvedThemeMode {
  if (typeof document === "undefined") {
    return nextTheme === "dark" ? "dark" : "light";
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

        return applyThemeMode("system");
      });
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  const setAndPersistThemeMode = (nextTheme: ThemeMode) => {
    const nextResolvedTheme = applyThemeMode(nextTheme);
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
