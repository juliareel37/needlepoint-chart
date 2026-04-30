"use client";

import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import {
  useCallback,
  useEffect,
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
  positioningCursorActive?: boolean;
  metrics: GridWorldMetrics;
  stageRef: RefObject<HTMLDivElement | null>;
  stageSize: StageSize;
  viewport: ViewportState;
  viewportInteractionDisabled?: boolean;
  zoomAnchor: { x: number; y: number } | null;
}

function createToolCursor(svg: string, hotspotX: number, hotspotY: number): string {
  const borderedSvg = svg.replace(
    ">",
    '><defs><filter id="cursor-outline" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="dilate" radius="0.9" result="expanded"/><feFlood flood-color="#fff" result="outlineColor"/><feComposite in="outlineColor" in2="expanded" operator="in" result="outline"/><feComposite in="SourceGraphic" in2="outline" operator="over"/></filter></defs><g filter="url(#cursor-outline)">',
  ).replace("</svg>", "</g></svg>");

  return `url("data:image/svg+xml,${encodeURIComponent(borderedSvg)}") ${hotspotX} ${hotspotY}, crosshair`;
}

const PAINT_CURSOR = createToolCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path d="m14.622 17.897-10.68-2.913" fill="none" stroke="#000" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z" fill="#000" stroke="#000" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15" fill="none" stroke="#000" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  3,
  14,
);
const FILL_CURSOR = createToolCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#000" d="m10.87 1.94-.95.95 8.3 8.3 1.41-1.41a.65.65 0 0 0 0-.92L12.8 2.03a.65.65 0 0 0-.92 0Z"/><path fill="#000" d="M5.18 6.62 1.99 9.8a3.02 3.02 0 0 0 0 4.27l3.89 3.89a3.02 3.02 0 0 0 4.27 0l6.66-6.67-8.3-8.3Z"/><path fill="#000" d="M18.7 15.84c-.2.7-.58 1.33-1.1 1.9-.26.28-.31.7-.12 1.03.2.35.3.74.3 1.18A2.23 2.23 0 0 0 20 22.2a2.23 2.23 0 0 0 2.23-2.25c0-.8-.38-1.5-1.01-2-.57-.46-.94-1.05-1.1-1.75l-.2-.84-.82.48c-.13.08-.26.14-.4.2Z"/><path fill="#fff" d="M2.5 11.25h15.2v1.4H2.5z"/></svg>`,
  5,
  15,
);
const ERASER_CURSOR = createToolCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#000" d="M13.01 3.1a2.58 2.58 0 0 1 3.65 0l5.99 6a2.58 2.58 0 0 1 0 3.65L13.8 21.6H8.04c-.8 0-1.56-.31-2.12-.88l-3.99-4a2.58 2.58 0 0 1 0-3.64Z"/><path fill="#fff" d="m4.34 11.08 7.58 7.59-1 1-7.58-7.6z"/><path fill="#fff" d="M12.55 20.2H21v1.4h-9.85z"/></svg>`,
  5,
  14,
);
const EYEDROPPER_CURSOR = createToolCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#000" d="m18.42 1.88-3.4 3.4-.14-.14a1.57 1.57 0 0 0-2.22 0l-.7.7a1.57 1.57 0 0 0 0 2.22l.15.15-8.95 8.95A2.58 2.58 0 0 0 2.4 18.83v1.34c0 .35-.14.69-.39.94l-.32.31a.6.6 0 0 0 .43 1.03h1.7c.52 0 1.01-.2 1.37-.56L14.14 13l.15.15a1.57 1.57 0 0 0 2.22 0l.7-.7a1.57 1.57 0 0 0 0-2.22l-.14-.14 3.4-3.4a1.57 1.57 0 0 0 0-2.22l-.83-.83a1.57 1.57 0 0 0-2.22 0Z"/><path fill="#fff" d="m13.18 6.24 4.58 4.58-.99.99-4.58-4.58z"/><path fill="#fff" d="m2.95 21.05.83-.82.99.99-.83.82z"/></svg>`,
  3,
  15,
);

export function useStagePanInteractions({
  activeTool,
  dispatch,
  dragPanningDisabled = false,
  positioningCursorActive = false,
  metrics,
  stageRef,
  stageSize,
  viewport,
  viewportInteractionDisabled = false,
  zoomAnchor,
}: UseStagePanInteractionsOptions) {
  const ZOOM_INTERACTION_SETTLE_DELAY_MS = 120;
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanDragging, setIsPanDragging] = useState(false);
  const [isZoomInteracting, setIsZoomInteracting] = useState(false);
  const isSpacePressedRef = useRef(false);
  const panDragRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const touchPanPointerIdRef = useRef<number | null>(null);
  const touchGestureRef = useRef<{
    centerX: number;
    centerY: number;
    distance: number;
    zoom: number;
  } | null>(null);
  const zoomInteractionTimeoutRef = useRef<number | null>(null);
  const viewportRef = useRef(viewport);
  const zoomAnchorRef = useRef(zoomAnchor);
  const panToolActive =
    activeTool === "pan" && !dragPanningDisabled && !viewportInteractionDisabled;
  const cursor = isPanDragging
    ? "grabbing"
    : positioningCursorActive
      ? "grab"
    : activeTool === "paint"
      ? PAINT_CURSOR
    : activeTool === "lasso"
      ? "crosshair"
    : activeTool === "fill"
      ? FILL_CURSOR
    : activeTool === "erase"
      ? ERASER_CURSOR
    : activeTool === "eyedropper"
      ? EYEDROPPER_CURSOR
    : (spacePressed && !dragPanningDisabled) || panToolActive
      ? "grab"
      : "default";

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    zoomAnchorRef.current = zoomAnchor;
  }, [zoomAnchor]);

  const beginZoomInteraction = useCallback(() => {
    if (zoomInteractionTimeoutRef.current !== null) {
      window.clearTimeout(zoomInteractionTimeoutRef.current);
      zoomInteractionTimeoutRef.current = null;
    }

    setIsZoomInteracting(true);
  }, []);

  const scheduleZoomInteractionEnd = useCallback(() => {
    if (zoomInteractionTimeoutRef.current !== null) {
      window.clearTimeout(zoomInteractionTimeoutRef.current);
    }

    zoomInteractionTimeoutRef.current = window.setTimeout(() => {
      zoomInteractionTimeoutRef.current = null;
      setIsZoomInteracting(false);
    }, ZOOM_INTERACTION_SETTLE_DELAY_MS);
  }, []);

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

  const stopPanDragging = useCallback(() => {
    panDragRef.current = null;
    touchPanPointerIdRef.current = null;
    touchGestureRef.current = null;
    setIsPanDragging(false);
  }, []);
  const startPanDragging = useCallback((clientX: number, clientY: number) => {
    panDragRef.current = {
      lastX: clientX,
      lastY: clientY,
    };
    setIsPanDragging(true);
  }, []);

  useEffect(() => {
    if (!dragPanningDisabled) {
      return;
    }

    panDragRef.current = null;
    touchPanPointerIdRef.current = null;
    touchGestureRef.current = null;

    const timeoutId = window.setTimeout(() => {
      setIsPanDragging(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [dragPanningDisabled, stopPanDragging]);

  useEffect(() => {
    if (viewportInteractionDisabled) {
      return;
    }

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
    const touchStartsInInteractiveElement = (touches: TouchList) => {
      if (typeof document.elementFromPoint !== "function") {
        return false;
      }

      for (let index = 0; index < touches.length; index += 1) {
        const touch = touches[index];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (target?.closest("[data-touch-gesture-scope='element']")) {
          return true;
        }
      }

      return false;
    };
    const startTouchGesture = (event: TouchEvent) => {
      if (event.touches.length !== 2) {
        return;
      }

      if (touchStartsInInteractiveElement(event.touches)) {
        return;
      }

      const geometry = getTouchGeometry(event.touches);

      if (!geometry) {
        return;
      }

      if (touchPanPointerIdRef.current !== null) {
        try {
          if (stageElement.hasPointerCapture(touchPanPointerIdRef.current)) {
            stageElement.releasePointerCapture(touchPanPointerIdRef.current);
          }
        } catch {
          // Ignore release errors while transitioning from touch pan to pinch.
        }
        panDragRef.current = null;
        touchPanPointerIdRef.current = null;
        setIsPanDragging(false);
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
    window.addEventListener("touchmove", updateTouchGesture, {
      passive: false,
    });
    window.addEventListener("touchend", endTouchGesture);
    window.addEventListener("touchcancel", endTouchGesture);

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
      window.removeEventListener("touchmove", updateTouchGesture);
      window.removeEventListener("touchend", endTouchGesture);
      window.removeEventListener("touchcancel", endTouchGesture);
    };
  }, [
    beginZoomInteraction,
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
    viewportInteractionDisabled,
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

      if (
        event.pointerType === "touch" &&
        touchPanPointerIdRef.current !== null &&
        event.pointerId !== touchPanPointerIdRef.current
      ) {
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
      event.button === 0 &&
      isSpacePressedRef.current &&
      !dragPanningDisabled &&
      !viewportInteractionDisabled;
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
        event.button === 0 &&
        isSpacePressedRef.current &&
        !dragPanningDisabled &&
        !viewportInteractionDisabled;
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

    if (dragPanningDisabled || viewportInteractionDisabled || !panToolActive) {
      return;
    }

    if (touchGestureRef.current) {
      return;
    }

    if (
      event.pointerType === "touch" &&
      touchPanPointerIdRef.current !== null &&
      touchPanPointerIdRef.current !== event.pointerId
    ) {
      try {
        if (event.currentTarget.hasPointerCapture(touchPanPointerIdRef.current)) {
          event.currentTarget.releasePointerCapture(touchPanPointerIdRef.current);
        }
      } catch {
        // Ignore release errors while upgrading to a gesture interaction.
      }

      panDragRef.current = null;
      touchPanPointerIdRef.current = null;
      setIsPanDragging(false);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    touchPanPointerIdRef.current = event.pointerId;

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
