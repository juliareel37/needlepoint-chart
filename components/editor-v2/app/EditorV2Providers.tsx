"use client";

import type { ReactNode } from "react";
import type { EditorStoreState } from "@/lib/editor-v2/editor/store";
import { EditorStoreProvider } from "./editorStoreContext";

export function EditorV2Providers({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState: EditorStoreState;
}) {
  return (
    <EditorStoreProvider initialState={initialState}>
      {children}
    </EditorStoreProvider>
  );
}
