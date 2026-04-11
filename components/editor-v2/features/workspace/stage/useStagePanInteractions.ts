"use client";

import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import type { ActiveTool, EditorStore } from "@/lib/editor-v2/editor/store";
import {
  createPanViewportCommand,
  createSetViewportZoomCommand,
} from "../workspaceCommands";

interface UseStagePanInteractionsOptions {
  activeTool: ActiveTool;
  dispatch: EditorStore["dispatch"];
  panningDisabled?: boolean;
  stageRef: RefObject<HTMLDivElement | null>;
  viewportZoom: number;
  zoomAnchor: { x: number; y: number } | null;
}

export function useStagePanInteractions({
  activeTool,
  dispatch,
  panningDisabled = false,
  stageRef,
  viewportZoom,
  zoomAnchor,
}: UseStagePanInteractionsOptions) {
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanDragging, setIsPanDragging] = useState(false);
  const isSpacePressedRef = useRef(false);
  const panDragRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const panToolActive = activeTool === "pan" && !panningDisabled;
  const cursor = isPanDragging
    ? "grabbing"
    : activeTool === "eyedropper"
      ? "crosshair"
    : (spacePressed && !panningDisabled) || panToolActive
      ? "grab"
      : "default";

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        const isTrackpadPinch = event.ctrlKey && !event.metaKey;
        const zoomSensitivity = isTrackpadPinch ? 0.006 : 0.0009;
        const zoomFactor = Math.exp(-event.deltaY * zoomSensitivity);
        dispatch(
          createSetViewportZoomCommand(
            viewportZoom * zoomFactor,
            zoomAnchor ?? undefined,
          ),
        );
        return;
      }

      if (panningDisabled) {
        return;
      }

      dispatch(createPanViewportCommand(-event.deltaX, -event.deltaY));
    },
    [dispatch, panningDisabled, viewportZoom, zoomAnchor],
  );

  const stopPanDragging = useEffectEvent(() => {
    panDragRef.current = null;
    setIsPanDragging(false);
  });

  useEffect(() => {
    if (!panningDisabled) {
      return;
    }

    stopPanDragging();
  }, [panningDisabled]);

  useEffect(() => {
    const stageElement = stageRef.current;

    if (!stageElement) {
      return;
    }

    const handleGestureEvent = (event: Event) => {
      event.preventDefault();
    };

    stageElement.addEventListener("wheel", handleWheel, { passive: false });
    stageElement.addEventListener("gesturestart", handleGestureEvent);
    stageElement.addEventListener("gesturechange", handleGestureEvent);

    return () => {
      stageElement.removeEventListener("wheel", handleWheel);
      stageElement.removeEventListener("gesturestart", handleGestureEvent);
      stageElement.removeEventListener("gesturechange", handleGestureEvent);
    };
  }, [handleWheel, stageRef]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      isSpacePressedRef.current = true;
      setSpacePressed(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }

      isSpacePressedRef.current = false;
      setSpacePressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const handleWindowMouseMove = (event: MouseEvent) => {
      const dragState = panDragRef.current;

      if (!dragState) {
        return;
      }

      const deltaX = event.clientX - dragState.lastX;
      const deltaY = event.clientY - dragState.lastY;

      panDragRef.current = {
        lastX: event.clientX,
        lastY: event.clientY,
      };

      if (deltaX === 0 && deltaY === 0) {
        return;
      }

      dispatch(createPanViewportCommand(deltaX, deltaY));
    };

    const handleWindowMouseUp = () => {
      if (!panDragRef.current) {
        return;
      }

      stopPanDragging();
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [dispatch]);

  function handleStageMouseDownCapture(event: ReactMouseEvent<HTMLDivElement>) {
    const isMiddleMouseButton = event.button === 1 && !panningDisabled;
    const isSpaceDrag = event.button === 0 && isSpacePressedRef.current && !panningDisabled;
    const isPanToolDrag = event.button === 0 && panToolActive;

    if (!isMiddleMouseButton && !isSpaceDrag && !isPanToolDrag) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    panDragRef.current = {
      lastX: event.clientX,
      lastY: event.clientY,
    };
    setIsPanDragging(true);
  }

  function handleStageAuxClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
  }

  return {
    cursor,
    handleStageAuxClick,
    handleStageMouseDownCapture,
  };
}
