"use client";

import { useEffect, useState } from "react";
import { Button, ButtonIcon } from "@/components/design-system";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import { createEditorV2AuthHandoffRedirectUrl } from "@/components/editor-v2/app/editorV2AuthHandoff";
import { AuthSignedIn, AuthSignedOut } from "@/lib/auth/client";
import { AuthUserMenu } from "./AuthUserMenu";
import { useOpenSignIn } from "./useOpenSignIn";

type EditorV2WindowWithDraftGetter = Window & {
  __editorV2GetCurrentDocument?: () => EditorDocumentState;
  __editorV2ShouldPreserveDraftOnSignIn?: () => boolean;
};

type AuthButtonsProps = {
  hideSignedOut?: boolean;
};

export default function AuthButtons({ hideSignedOut = false }: AuthButtonsProps) {
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
      <AuthSignedIn>
        <AuthUserMenu />
      </AuthSignedIn>
      {!hideSignedOut ? (
        <AuthSignedOut>
          <Button
            type="button"
            variant="ghostV2"
            size="lg"
            className="app-header-sign-in-button"
            onClick={() => {
              if (typeof window === "undefined") {
                openSignIn();
                return;
              }

              const currentUrl = `${window.location.pathname}${window.location.search}`.replace(
                /^\/editor-v2(?=\/|$)/,
                "/editor",
              );

              if (
                window.location.pathname.startsWith("/editor") ||
                window.location.pathname.startsWith("/editor-v2")
              ) {
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
            {/* <ButtonIcon icon="/icons/lucide/user.svg" /> */}
            Log in
          </Button>
        </AuthSignedOut>
      ) : null}
    </>
  );
}
