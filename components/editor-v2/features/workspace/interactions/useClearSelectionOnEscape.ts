"use client";

import { useEffect } from "react";
import type { EditorStore } from "@/lib/editor-v2/editor/store";
import {
  createCancelMirrorCommand,
  createClearSelectionCommand,
} from "../workspaceCommands";

interface UseClearSelectionOnEscapeOptions {
  clearLocalSelection: () => void;
  dispatch: EditorStore["dispatch"];
  hasSelection: boolean;
}

export function useClearSelectionOnEscape({
  clearLocalSelection,
  dispatch,
  hasSelection,
}: UseClearSelectionOnEscapeOptions) {
  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !hasSelection) {
        return;
      }

      dispatch(createClearSelectionCommand("hotkey"));
      dispatch(createCancelMirrorCommand("hotkey"));
      clearLocalSelection();
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [clearLocalSelection, dispatch, hasSelection]);
}
