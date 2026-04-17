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
import {
  clampViewportOffsets,
  type GridWorldMetrics,
  type StageSize,
} from "@/lib/editor-v2/editor/viewport";
import type { ViewportState } from "@/lib/editor-v2/editor/store";

interface UseStagePanInteractionsOptions {
  activeTool: ActiveTool;
  dispatch: EditorStore["dispatch"];
  dragPanningDisabled?: boolean;
  metrics: GridWorldMetrics;
  stageRef: RefObject<HTMLDivElement | null>;
  stageSize: StageSize;
  viewport: ViewportState;
  viewportZoom: number;
  zoomAnchor: { x: number; y: number } | null;
}

export function useStagePanInteractions({
  activeTool,
  dispatch,
  dragPanningDisabled = false,
  metrics,
  stageRef,
  stageSize,
  viewport,
  viewportZoom,
  zoomAnchor,
}: UseStagePanInteractionsOptions) {
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanDragging, setIsPanDragging] = useState(false);
  const isSpacePressedRef = useRef(false);
  const panDragRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const panToolActive = activeTool === "pan" && !dragPanningDisabled;
  const cursor = isPanDragging
    ? "grabbing"
    : activeTool === "eyedropper"
      ? "crosshair"
    : (spacePressed && !dragPanningDisabled) || panToolActive
      ? "grab"
      : "default";

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      const { deltaX, deltaY } = normalizeWheelDelta(event, stageSize);

      if (event.ctrlKey || event.metaKey) {
        const isTrackpadPinch = event.ctrlKey && !event.metaKey;
        const zoomSensitivity = isTrackpadPinch ? 0.006 : 0.0009;
        const zoomFactor = Math.exp(-deltaY * zoomSensitivity);
        const nextZoom = viewportZoom * zoomFactor;
        const anchor = zoomAnchor ?? undefined;

        dispatch(createSetViewportZoomCommand(nextZoom, anchor));
        return;
      }

      const clampedViewport = clampViewportOffsets(
        {
          ...viewport,
          offsetX: viewport.offsetX - deltaX,
          offsetY: viewport.offsetY - deltaY,
        },
        stageSize,
        metrics,
      );
      const panDeltaX = clampedViewport.offsetX - viewport.offsetX;
      const panDeltaY = clampedViewport.offsetY - viewport.offsetY;

      if (panDeltaX === 0 && panDeltaY === 0) {
        return;
      }

      dispatch(createPanViewportCommand(panDeltaX, panDeltaY));
    },
    [dispatch, metrics, stageSize, viewport, viewportZoom, zoomAnchor],
  );

  const stopPanDragging = useEffectEvent(() => {
    panDragRef.current = null;
    setIsPanDragging(false);
  });
  const startPanDragging = useEffectEvent((clientX: number, clientY: number) => {
    panDragRef.current = {
      lastX: clientX,
      lastY: clientY,
    };
    setIsPanDragging(true);
  });

  useEffect(() => {
    if (!dragPanningDisabled) {
      return;
    }

    stopPanDragging();
  }, [dragPanningDisabled, stopPanDragging]);

  useEffect(() => {
    const stageElement = stageRef.current;

    if (!stageElement) {
      return;
    }

    const handleGestureEvent = (event: Event) => {
      event.preventDefault();
    };
    const startNativeMiddlePanCapture = (event: MouseEvent) => {
      if (event.button !== 1) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      startPanDragging(event.clientX, event.clientY);
    };
    const preventNativeMiddleAuxClick = (event: MouseEvent) => {
      if (event.button !== 1) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    stageElement.addEventListener("wheel", handleWheel, { passive: false });
    stageElement.addEventListener("gesturestart", handleGestureEvent);
    stageElement.addEventListener("gesturechange", handleGestureEvent);
    stageElement.addEventListener("mousedown", startNativeMiddlePanCapture, {
      capture: true,
      passive: false,
    });
    stageElement.addEventListener("auxclick", preventNativeMiddleAuxClick, {
      capture: true,
      passive: false,
    });

    return () => {
      stageElement.removeEventListener("wheel", handleWheel);
      stageElement.removeEventListener("gesturestart", handleGestureEvent);
      stageElement.removeEventListener("gesturechange", handleGestureEvent);
      stageElement.removeEventListener("mousedown", startNativeMiddlePanCapture, true);
      stageElement.removeEventListener("auxclick", preventNativeMiddleAuxClick, true);
    };
  }, [handleWheel, stageRef, startPanDragging]);

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

      const clampedViewport = clampViewportOffsets(
        {
          ...viewport,
          offsetX: viewport.offsetX + deltaX,
          offsetY: viewport.offsetY + deltaY,
        },
        stageSize,
        metrics,
      );
      const clampedDeltaX = clampedViewport.offsetX - viewport.offsetX;
      const clampedDeltaY = clampedViewport.offsetY - viewport.offsetY;

      if (clampedDeltaX === 0 && clampedDeltaY === 0) {
        return;
      }

      dispatch(createPanViewportCommand(clampedDeltaX, clampedDeltaY));
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
  }, [dispatch, metrics, stageSize, viewport]);

  function handleStageMouseDownCapture(event: ReactMouseEvent<HTMLDivElement>) {
    const isMiddleMouseButton = event.button === 1;
    const isSpaceDrag =
      event.button === 0 && isSpacePressedRef.current && !dragPanningDisabled;
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

function normalizeWheelDelta(
  event: WheelEvent,
  stageSize: StageSize,
): { deltaX: number; deltaY: number } {
  switch (event.deltaMode) {
    case WheelEvent.DOM_DELTA_LINE:
      return {
        deltaX: event.deltaX * 16,
        deltaY: event.deltaY * 16,
      };
    case WheelEvent.DOM_DELTA_PAGE:
      return {
        deltaX: event.deltaX * Math.max(stageSize.width, 1),
        deltaY: event.deltaY * Math.max(stageSize.height, 1),
      };
    case WheelEvent.DOM_DELTA_PIXEL:
    default:
      return {
        deltaX: event.deltaX,
        deltaY: event.deltaY,
      };
  }
}
