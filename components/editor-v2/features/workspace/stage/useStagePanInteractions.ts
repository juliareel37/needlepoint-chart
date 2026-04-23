"use client";

import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
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
  zoomAnchor,
}: UseStagePanInteractionsOptions) {
  const ZOOM_INTERACTION_SETTLE_DELAY_MS = 120;
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanDragging, setIsPanDragging] = useState(false);
  const [isZoomInteracting, setIsZoomInteracting] = useState(false);
  const isSpacePressedRef = useRef(false);
  const panDragRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const touchGestureRef = useRef<{
    centerX: number;
    centerY: number;
    distance: number;
    zoom: number;
  } | null>(null);
  const zoomInteractionTimeoutRef = useRef<number | null>(null);
  const viewportRef = useRef(viewport);
  const zoomAnchorRef = useRef(zoomAnchor);
  const panToolActive = activeTool === "pan" && !dragPanningDisabled;
  const cursor = isPanDragging
    ? "grabbing"
    : activeTool === "eyedropper" || activeTool === "fill"
      ? "crosshair"
    : (spacePressed && !dragPanningDisabled) || panToolActive
      ? "grab"
      : "default";

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    zoomAnchorRef.current = zoomAnchor;
  }, [zoomAnchor]);

  const beginZoomInteraction = useEffectEvent(() => {
    if (zoomInteractionTimeoutRef.current !== null) {
      window.clearTimeout(zoomInteractionTimeoutRef.current);
      zoomInteractionTimeoutRef.current = null;
    }

    setIsZoomInteracting(true);
  });

  const scheduleZoomInteractionEnd = useEffectEvent(() => {
    if (zoomInteractionTimeoutRef.current !== null) {
      window.clearTimeout(zoomInteractionTimeoutRef.current);
    }

    zoomInteractionTimeoutRef.current = window.setTimeout(() => {
      zoomInteractionTimeoutRef.current = null;
      setIsZoomInteracting(false);
    }, ZOOM_INTERACTION_SETTLE_DELAY_MS);
  });

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      const currentViewport = viewportRef.current;
      const { deltaX, deltaY } = normalizeWheelDelta(event, stageSize);

      if (event.ctrlKey || event.metaKey) {
        const isTrackpadPinch = event.ctrlKey && !event.metaKey;
        const zoomSensitivity = isTrackpadPinch ? 0.006 : 0.0009;
        const zoomFactor = Math.exp(-deltaY * zoomSensitivity);
        const nextZoom = currentViewport.zoom * zoomFactor;
        const anchor = zoomAnchorRef.current ?? undefined;

        beginZoomInteraction();
        dispatch(createSetViewportZoomCommand(nextZoom, anchor));
        scheduleZoomInteractionEnd();
        return;
      }

      const clampedViewport = clampViewportOffsets(
        {
          ...currentViewport,
          offsetX: currentViewport.offsetX - deltaX,
          offsetY: currentViewport.offsetY - deltaY,
        },
        stageSize,
        metrics,
      );
      const panDeltaX = clampedViewport.offsetX - currentViewport.offsetX;
      const panDeltaY = clampedViewport.offsetY - currentViewport.offsetY;

      if (panDeltaX === 0 && panDeltaY === 0) {
        return;
      }

      dispatch(createPanViewportCommand(panDeltaX, panDeltaY));
    },
    [beginZoomInteraction, dispatch, metrics, scheduleZoomInteractionEnd, stageSize],
  );

  const stopPanDragging = useEffectEvent(() => {
    panDragRef.current = null;
    touchGestureRef.current = null;
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
    const getTouchGeometry = (touches: TouchList) => {
      if (touches.length < 2) {
        return null;
      }

      const first = touches[0];
      const second = touches[1];
      const centerX = (first.clientX + second.clientX) / 2;
      const centerY = (first.clientY + second.clientY) / 2;
      const distance = Math.hypot(
        second.clientX - first.clientX,
        second.clientY - first.clientY,
      );

      if (distance <= 0) {
        return null;
      }

      return { centerX, centerY, distance };
    };
    const getTouchZoomAnchor = (clientX: number, clientY: number) => {
      const rect = stageElement.getBoundingClientRect();
      const frameOriginX = (stageSize.width - metrics.surfaceWidth) / 2;
      const frameOriginY = (stageSize.height - metrics.surfaceHeight) / 2;

      return {
        x: clientX - rect.left - frameOriginX,
        y: clientY - rect.top - frameOriginY,
      };
    };
    const startTouchGesture = (event: TouchEvent) => {
      if (dragPanningDisabled || event.touches.length !== 2) {
        return;
      }

      const geometry = getTouchGeometry(event.touches);

      if (!geometry) {
        return;
      }

      event.preventDefault();
      beginZoomInteraction();
      touchGestureRef.current = {
        ...geometry,
        zoom: viewportRef.current.zoom,
      };
    };
    const updateTouchGesture = (event: TouchEvent) => {
      const gesture = touchGestureRef.current;

      if (!gesture || event.touches.length < 2) {
        return;
      }

      const geometry = getTouchGeometry(event.touches);

      if (!geometry) {
        return;
      }

      event.preventDefault();

      const anchor = getTouchZoomAnchor(geometry.centerX, geometry.centerY);
      const nextZoom = gesture.zoom * (geometry.distance / gesture.distance);
      const panDeltaX = geometry.centerX - gesture.centerX;
      const panDeltaY = geometry.centerY - gesture.centerY;

      beginZoomInteraction();
      dispatch(createSetViewportZoomCommand(nextZoom, anchor));

      if (panDeltaX !== 0 || panDeltaY !== 0) {
        dispatch(createPanViewportCommand(panDeltaX, panDeltaY));
      }

      touchGestureRef.current = {
        ...geometry,
        zoom: nextZoom,
      };
      scheduleZoomInteractionEnd();
    };
    const endTouchGesture = () => {
      if (!touchGestureRef.current) {
        return;
      }

      touchGestureRef.current = null;
      scheduleZoomInteractionEnd();
    };

    stageElement.addEventListener("wheel", handleWheel, { passive: false });
    stageElement.addEventListener("gesturestart", handleGestureEvent);
    stageElement.addEventListener("gesturechange", handleGestureEvent);
    stageElement.addEventListener("gestureend", handleGestureEvent);
    stageElement.addEventListener("mousedown", startNativeMiddlePanCapture, {
      capture: true,
      passive: false,
    });
    stageElement.addEventListener("auxclick", preventNativeMiddleAuxClick, {
      capture: true,
      passive: false,
    });
    stageElement.addEventListener("touchstart", startTouchGesture, {
      passive: false,
    });
    stageElement.addEventListener("touchmove", updateTouchGesture, {
      passive: false,
    });
    stageElement.addEventListener("touchend", endTouchGesture);
    stageElement.addEventListener("touchcancel", endTouchGesture);

    return () => {
      if (zoomInteractionTimeoutRef.current !== null) {
        window.clearTimeout(zoomInteractionTimeoutRef.current);
        zoomInteractionTimeoutRef.current = null;
      }

      stageElement.removeEventListener("wheel", handleWheel);
      stageElement.removeEventListener("gesturestart", handleGestureEvent);
      stageElement.removeEventListener("gesturechange", handleGestureEvent);
      stageElement.removeEventListener("gestureend", handleGestureEvent);
      stageElement.removeEventListener("mousedown", startNativeMiddlePanCapture, true);
      stageElement.removeEventListener("auxclick", preventNativeMiddleAuxClick, true);
      stageElement.removeEventListener("touchstart", startTouchGesture);
      stageElement.removeEventListener("touchmove", updateTouchGesture);
      stageElement.removeEventListener("touchend", endTouchGesture);
      stageElement.removeEventListener("touchcancel", endTouchGesture);
    };
  }, [
    dispatch,
    dragPanningDisabled,
    handleWheel,
    metrics.surfaceHeight,
    metrics.surfaceWidth,
    stageRef,
    stageSize.height,
    stageSize.width,
    scheduleZoomInteractionEnd,
    startPanDragging,
  ]);

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
    const handleWindowPointerMove = (event: PointerEvent) => {
      const dragState = panDragRef.current;
      const currentViewport = viewportRef.current;

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
          ...currentViewport,
          offsetX: currentViewport.offsetX + deltaX,
          offsetY: currentViewport.offsetY + deltaY,
        },
        stageSize,
        metrics,
      );
      const clampedDeltaX = clampedViewport.offsetX - currentViewport.offsetX;
      const clampedDeltaY = clampedViewport.offsetY - currentViewport.offsetY;

      if (clampedDeltaX === 0 && clampedDeltaY === 0) {
        return;
      }

      dispatch(createPanViewportCommand(clampedDeltaX, clampedDeltaY));
    };

    const handleWindowPointerUp = () => {
      if (!panDragRef.current) {
        return;
      }

      stopPanDragging();
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [dispatch, metrics, stageSize, stopPanDragging]);

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

  function handleStagePointerDownCapture(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
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
      return;
    }

    if (dragPanningDisabled || !panToolActive) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

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
    handleStagePointerDownCapture,
    isZoomInteracting,
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
