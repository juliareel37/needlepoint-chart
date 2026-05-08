export type ThemeMode = "light" | "system" | "dark";

export const THEME_STORAGE_KEY = "wippa:theme";
export const THEME_MODE_ATTRIBUTE = "data-theme-mode";

export function parseThemeMode(value: string | null | undefined): ThemeMode | null {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return null;
}
