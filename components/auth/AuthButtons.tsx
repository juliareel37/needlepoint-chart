"use client";

import { useEffect, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/design-system";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import { createEditorV2AuthHandoffRedirectUrl } from "@/components/editor-v2/app/editorV2AuthHandoff";
import { useOpenSignIn } from "./useOpenSignIn";

type EditorV2WindowWithDraftGetter = Window & {
  __editorV2GetCurrentDocument?: () => EditorDocumentState;
  __editorV2ShouldPreserveDraftOnSignIn?: () => boolean;
};

export default function AuthButtons() {
  const openSignIn = useOpenSignIn();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <SignedIn>
        <UserButton afterSignOutUrl="/editor-v2" />
      </SignedIn>
      <SignedOut>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="app-header-sign-in-button"
          onClick={() => {
            if (typeof window === "undefined") {
              openSignIn();
              return;
            }

            const currentUrl = `${window.location.pathname}${window.location.search}`;

            if (window.location.pathname.startsWith("/editor-v2")) {
              const editorWindow = window as EditorV2WindowWithDraftGetter;
              const shouldPreserveDraft =
                editorWindow.__editorV2ShouldPreserveDraftOnSignIn?.() ?? true;
              const currentDocument = editorWindow.__editorV2GetCurrentDocument?.();

              if (shouldPreserveDraft && currentDocument) {
                openSignIn({
                  redirectUrl: createEditorV2AuthHandoffRedirectUrl(
                    currentDocument,
                    currentUrl,
                  ),
                });
                return;
              }
            }

            openSignIn({ redirectUrl: currentUrl });
          }}
        >
          Sign in
        </Button>
      </SignedOut>
    </>
  );
}
