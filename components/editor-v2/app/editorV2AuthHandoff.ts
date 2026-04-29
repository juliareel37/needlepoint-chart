"use client";

import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";

const AUTH_HANDOFF_QUERY_PARAM = "authHandoff";
const AUTH_HANDOFF_STORAGE_PREFIX = "editor-v2-auth-handoff:";
const AUTH_HANDOFF_PENDING_STORAGE_KEY = "editor-v2-auth-handoff:pending";
const AUTH_HANDOFF_MAX_AGE_MS = 1000 * 60 * 60 * 4;

export function createEditorV2AuthHandoffRedirectUrl(
  document: EditorDocumentState,
  currentUrl: string,
): string {
  if (typeof window === "undefined") {
    return currentUrl;
  }

  const token = crypto.randomUUID();
  const redirectUrl = new URL(currentUrl, window.location.origin);
  redirectUrl.searchParams.set(AUTH_HANDOFF_QUERY_PARAM, token);

  window.localStorage.setItem(
    `${AUTH_HANDOFF_STORAGE_PREFIX}${token}`,
    JSON.stringify(document),
  );
  window.localStorage.setItem(
    AUTH_HANDOFF_PENDING_STORAGE_KEY,
    JSON.stringify({
      token,
      createdAt: Date.now(),
    }),
  );

  return `${redirectUrl.pathname}${redirectUrl.search}`;
}

export function consumeEditorV2AuthHandoffFromUrl(): EditorDocumentState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const currentUrl = new URL(window.location.href);
  const tokenFromUrl = currentUrl.searchParams.get(AUTH_HANDOFF_QUERY_PARAM);
  const token = tokenFromUrl ?? getPendingAuthHandoffToken();

  if (!token) {
    return null;
  }

  const storageKey = `${AUTH_HANDOFF_STORAGE_PREFIX}${token}`;
  const rawPayload = window.localStorage.getItem(storageKey);

  window.localStorage.removeItem(storageKey);
  window.localStorage.removeItem(AUTH_HANDOFF_PENDING_STORAGE_KEY);
  if (tokenFromUrl) {
    currentUrl.searchParams.delete(AUTH_HANDOFF_QUERY_PARAM);
    window.history.replaceState({}, "", currentUrl.toString());
  }

  if (!rawPayload) {
    return null;
  }

  return parseEditorDocumentState(rawPayload);
}

function parseEditorDocumentState(rawPayload: string): EditorDocumentState | null {
  try {
    const candidate = JSON.parse(rawPayload) as EditorDocumentState;

    if (!candidate || typeof candidate !== "object") {
      return null;
    }

    if (
      !candidate.project ||
      !candidate.grid ||
      !candidate.palette ||
      !candidate.text ||
      typeof candidate.project.title !== "string" ||
      typeof candidate.grid.width !== "number" ||
      typeof candidate.grid.height !== "number" ||
      !Array.isArray(candidate.grid.cells)
    ) {
      return null;
    }

    return candidate;
  } catch {
    return null;
  }
}

function getPendingAuthHandoffToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawPending = window.localStorage.getItem(AUTH_HANDOFF_PENDING_STORAGE_KEY);

  if (!rawPending) {
    return null;
  }

  try {
    const candidate = JSON.parse(rawPending) as {
      token?: unknown;
      createdAt?: unknown;
    };
    const token =
      typeof candidate.token === "string" && candidate.token.length > 0
        ? candidate.token
        : null;
    const createdAt =
      typeof candidate.createdAt === "number" ? candidate.createdAt : null;

    if (!token || !createdAt || Date.now() - createdAt > AUTH_HANDOFF_MAX_AGE_MS) {
      window.localStorage.removeItem(AUTH_HANDOFF_PENDING_STORAGE_KEY);
      return null;
    }

    return token;
  } catch {
    window.localStorage.removeItem(AUTH_HANDOFF_PENDING_STORAGE_KEY);
    return null;
  }
}
