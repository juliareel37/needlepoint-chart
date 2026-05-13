"use client";

import type { CanvasPreferencesDocument } from "@/lib/editor-v2/editor/store";

const STICKY_CANVAS_PREFERENCES_STORAGE_KEY = "editor-v2:sticky-canvas-preferences";

export function readStickyCanvasPreferences(): CanvasPreferencesDocument | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STICKY_CANVAS_PREFERENCES_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    return isCanvasPreferencesDocument(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStickyCanvasPreferences(
  preferences: CanvasPreferencesDocument,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STICKY_CANVAS_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {}
}

function isCanvasPreferencesDocument(
  value: unknown,
): value is CanvasPreferencesDocument {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CanvasPreferencesDocument>;

  return (
    typeof candidate.showGridlines === "boolean" &&
    typeof candidate.showRuler === "boolean" &&
    typeof candidate.showSymbols === "boolean" &&
    typeof candidate.touchSnappingEnabled === "boolean"
  );
}
