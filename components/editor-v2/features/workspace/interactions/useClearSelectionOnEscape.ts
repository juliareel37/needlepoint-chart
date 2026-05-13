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
  disabled?: boolean;
  clearLocalSelection: () => void;
  dispatch: EditorStore["dispatch"];
  hasSelection: boolean;
}

export function useClearSelectionOnEscape({
  duplicatePlacementActive = false,
  disabled = false,
  clearLocalSelection,
  dispatch,
  hasSelection,
}: UseClearSelectionOnEscapeOptions) {
  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const editableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        editableTarget ||
        disabled ||
        !hasSelection
      ) {
        return;
      }

      event.preventDefault();

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
  }, [clearLocalSelection, disabled, dispatch, duplicatePlacementActive, hasSelection]);
}
