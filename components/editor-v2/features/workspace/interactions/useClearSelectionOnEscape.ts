"use client";

import { useEffect } from "react";
import type { EditorStore } from "@/lib/editor-v2/editor/store";
import {
  createCancelDuplicatePlacementCommand,
  createCancelMirrorCommand,
  createClearSelectionCommand,
} from "../workspaceCommands";

interface UseClearSelectionOnEscapeOptions {
  duplicatePlacementActive?: boolean;
  clearLocalSelection: () => void;
  dispatch: EditorStore["dispatch"];
  hasSelection: boolean;
}

export function useClearSelectionOnEscape({
  duplicatePlacementActive = false,
  clearLocalSelection,
  dispatch,
  hasSelection,
}: UseClearSelectionOnEscapeOptions) {
  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !hasSelection) {
        return;
      }

      if (duplicatePlacementActive) {
        dispatch(createCancelDuplicatePlacementCommand());
        return;
      }

      dispatch(createClearSelectionCommand("hotkey"));
      dispatch(createCancelMirrorCommand("hotkey"));
      clearLocalSelection();
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [clearLocalSelection, dispatch, duplicatePlacementActive, hasSelection]);
}
