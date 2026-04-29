import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import {
  consumeEditorV2AuthHandoffFromUrl,
  createEditorV2AuthHandoffRedirectUrl,
} from "./editorV2AuthHandoff";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }
}

describe("editor v2 auth handoff", () => {
  const originalWindow = globalThis.window;
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    const localStorage = new MemoryStorage();
    const history = {
      replaceState: vi.fn(),
    };
    const location = {
      href: "http://localhost/editor",
      origin: "http://localhost",
      pathname: "/editor",
      search: "",
    };

    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage,
        history,
        location,
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, "crypto", {
      value: {
        randomUUID: () => "token_123",
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "crypto", {
      value: originalCrypto,
      configurable: true,
      writable: true,
    });
  });

  it("round-trips a logged-out draft through the redirect url", () => {
    const document = createNewDesignState(8, 8).document;

    const redirectUrl = createEditorV2AuthHandoffRedirectUrl(document, "/editor");

    expect(redirectUrl).toBe("/editor?authHandoff=token_123");

    globalThis.window.location.href = `http://localhost${redirectUrl}`;
    globalThis.window.location.search = "?authHandoff=token_123";

    const restoredDocument = consumeEditorV2AuthHandoffFromUrl();

    expect(restoredDocument).toEqual(document);
    expect(globalThis.window.localStorage.getItem("editor-v2-auth-handoff:token_123")).toBeNull();
    expect(globalThis.window.localStorage.getItem("editor-v2-auth-handoff:pending")).toBeNull();
    expect(globalThis.window.history.replaceState).toHaveBeenCalledOnce();
  });

  it("falls back to the pending handoff token when the query param is missing", () => {
    const document = createNewDesignState(10, 12).document;

    createEditorV2AuthHandoffRedirectUrl(document, "/editor");
    globalThis.window.location.href = "http://localhost/editor";
    globalThis.window.location.search = "";

    const restoredDocument = consumeEditorV2AuthHandoffFromUrl();

    expect(restoredDocument).toEqual(document);
    expect(globalThis.window.history.replaceState).not.toHaveBeenCalled();
  });
});
