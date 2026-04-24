"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ActiveTool,
  EditorStore,
  EditorStoreState,
  GridPoint,
  SelectionPoint,
} from "@/lib/editor-v2/editor/store";
import { getMirrorDirectionAtPoint } from "@/lib/editor-v2/editor/selection/mirrorGeometry";
import {
  createApplyMirrorCommand,
  createApplyMirrorFromSelectionCommand,
  createCommitMirrorSelectionCommand,
  createStartMirrorSelectionCommand,
  createUpdateMirrorSelectionCommand,
} from "../workspaceCommands";

interface UseMirrorDragOptions {
  activeTool: ActiveTool;
  dispatch: EditorStore["dispatch"];
  getClampedSelectionPointFromClient: (
    clientX: number,
    clientY: number,
  ) => SelectionPoint | null;
  state: EditorStoreState;
}

export function useMirrorDrag({
  activeTool,
  dispatch,
  getClampedSelectionPointFromClient,
  state,
}: UseMirrorDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const lastPointRef = useRef<string | null>(null);
  const mirrorSession = state.session.mirrorInteraction.session;
  const canApplyMirrorFromSelection =
    activeTool === "lasso" &&
    Boolean(mirrorSession?.sourceRect) &&
    !mirrorSession?.dragAnchor;

  useEffect(() => {
    if (activeTool === "mirror" || canApplyMirrorFromSelection) {
      return;
    }

    lastPointRef.current = null;
    setIsDragging(false);
  }, [activeTool, canApplyMirrorFromSelection]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    function handleWindowPointerUp(event: PointerEvent) {
      const point = getGridPointFromClient(
        event.clientX,
        event.clientY,
        getClampedSelectionPointFromClient,
      );

      if (point) {
        const pointKey = `${point.x}:${point.y}`;

        if (lastPointRef.current !== pointKey) {
          dispatch(createUpdateMirrorSelectionCommand(point));
        }
      }

      dispatch(createCommitMirrorSelectionCommand());
      lastPointRef.current = null;
      setIsDragging(false);
    }

    function handleWindowPointerMove(event: PointerEvent) {
      const point = getGridPointFromClient(
        event.clientX,
        event.clientY,
        getClampedSelectionPointFromClient,
      );

      if (!point) {
        return;
      }

      const pointKey = `${point.x}:${point.y}`;

      if (lastPointRef.current === pointKey) {
        return;
      }

      lastPointRef.current = pointKey;
      dispatch(createUpdateMirrorSelectionCommand(point));
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [dispatch, getClampedSelectionPointFromClient, isDragging]);

  return {
    handlePointerDown,
  };

  function handlePointerDown(point: GridPoint): boolean {
    if (activeTool !== "mirror" && !canApplyMirrorFromSelection) {
      return false;
    }

    if (mirrorSession?.sourceRect && !mirrorSession.dragAnchor) {
      const direction = getMirrorDirectionAtPoint(
        point,
        mirrorSession.sourceRect,
        state.document.grid.width,
        state.document.grid.height,
      );

      if (direction) {
        dispatch(
          canApplyMirrorFromSelection
            ? createApplyMirrorFromSelectionCommand(direction)
            : createApplyMirrorCommand(direction),
        );
        return true;
      }

      if (canApplyMirrorFromSelection) {
        return false;
      }
    }

    dispatch(createStartMirrorSelectionCommand(point));
    lastPointRef.current = `${point.x}:${point.y}`;
    setIsDragging(true);

    return true;
  }
}

function getGridPointFromClient(
  clientX: number,
  clientY: number,
  getClampedSelectionPointFromClient: (
    clientX: number,
    clientY: number,
  ) => SelectionPoint | null,
): GridPoint | null {
  const point = getClampedSelectionPointFromClient(clientX, clientY);

  if (!point) {
    return null;
  }

  return {
    x: Math.floor(point.x),
    y: Math.floor(point.y),
  };
}
