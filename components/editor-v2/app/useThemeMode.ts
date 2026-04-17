"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "wippa:theme";

function applyThemeMode(nextTheme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  if (nextTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function getThemeModeFromDocument(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function useThemeMode() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      const nextTheme: ThemeMode = savedTheme === "dark" ? "dark" : "light";
      applyThemeMode(nextTheme);
      setThemeMode(nextTheme);
    } catch {
      const nextTheme = getThemeModeFromDocument();
      applyThemeMode(nextTheme);
      setThemeMode(nextTheme);
    }
  }, []);

  const setAndPersistThemeMode = (nextTheme: ThemeMode) => {
    applyThemeMode(nextTheme);
    setThemeMode(nextTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {}
  };

  return {
    themeMode,
    setThemeMode: setAndPersistThemeMode,
  };
}
