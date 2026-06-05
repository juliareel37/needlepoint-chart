"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { ColorLibraryDismissGesture } from "../shell/FloatingToolbar";
import type {
  GridPoint,
  GridCellValue,
  PaletteColor,
  SelectionPoint,
  TraceDocument,
  ViewportState,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import {
  configureDisplayCanvas,
  renderDisplayCanvas,
} from "./GridCanvasStage.display";
import type {
  CanvasSizing,
  LoadedTraceAsset,
  TraceDisplayOverride,
} from "./GridCanvasStage.shared";
import {
  configureSourceCanvas,
  drawChangedSourceCells,
  drawKnownChangedSourceCells,
  redrawSourceCanvas,
} from "./GridCanvasStage.source";

interface GridCanvasStageProps {
  cancelPaintStroke: () => void;
  cells: GridCellValue[];
  colorLibraryDismissGestureRef?: RefObject<ColorLibraryDismissGesture | null>;
  colorsById: Record<string, PaletteColor>;
  deferPaintUntilTraceReady?: boolean;
  displayHost: HTMLElement | null;
  highlightedCellIndexes?: number[] | null;
  highlightedColorId?: string | null;
  latestGridCellChange?: {
    indexes: readonly number[];
    revision: number;
  } | null;
  onDisplayRendered?: () => void;
  displayTraceAsset: LoadedTraceAsset | null;
  displayTraceOverride?: TraceDisplayOverride;
  paintOpacity?: number;
  previewMode?: boolean;
  displayTrace?: TraceDocument | null;
  frameOrigin: { x: number; y: number };
  getGridPointFromClient: (clientX: number, clientY: number) => GridPoint | null;
  getSelectionPointFromClient: (clientX: number, clientY: number) => SelectionPoint | null;
  gridWidth: number;
  handleHover: (selectionPoint: SelectionPoint | null) => void;
  handlePointerDown: (point: GridPoint, selectionPoint: SelectionPoint) => void;
  handlePointerEnter: (point: GridPoint) => void;
  interactionEnabled?: boolean;
  gridOverlayStep: number;
  showGridlines: boolean;
  showSymbols: boolean;
  metrics: GridWorldMetrics;
  stageSize: { width: number; height: number };
  symbolAssignments: Record<string, string>;
  threadView: boolean;
  viewport: ViewportState;
  isZoomInteractionActive: boolean;
}

export function GridCanvasStage({
  cancelPaintStroke,
  cells,
  colorLibraryDismissGestureRef,
  colorsById,
  deferPaintUntilTraceReady = false,
  displayHost,
  highlightedCellIndexes = null,
  highlightedColorId = null,
  latestGridCellChange = null,
  onDisplayRendered,
  displayTraceAsset,
  displayTraceOverride = null,
  paintOpacity = 1,
  previewMode = false,
  displayTrace = null,
  frameOrigin,
  getGridPointFromClient,
  getSelectionPointFromClient,
  gridWidth,
  handleHover,
  handlePointerDown,
  handlePointerEnter,
  interactionEnabled = true,
  gridOverlayStep,
  showGridlines,
  showSymbols,
  metrics,
  stageSize,
  symbolAssignments,
  threadView,
  viewport,
  isZoomInteractionActive,
}: GridCanvasStageProps) {
  const DISMISS_CLICK_HOLD_TO_PAINT_MS = 140;
  const DISMISS_CLICK_MOVE_TO_PAINT_PX = 6;
  const DISMISS_GESTURE_MATCH_WINDOW_MS = 48;
  const DISMISS_GESTURE_MATCH_DISTANCE_PX = 4;
  const TOUCH_PAINT_ACTIVATION_DISTANCE_PX = 8;
  const sourceThreadStyleVersion = previewMode && threadView ? 2 : 1;
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceCanvasSizingRef = useRef<CanvasSizing | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasSizingRef = useRef<CanvasSizing | null>(null);
  const previousCellsRef = useRef<GridCellValue[] | null>(null);
  const previousCellsInputRef = useRef<GridCellValue[] | null>(null);
  const previousColorsRef = useRef<Record<string, PaletteColor> | null>(null);
  const previousColorsInputRef = useRef<Record<string, PaletteColor> | null>(null);
  const previousThreadViewRef = useRef<boolean | null>(null);
  const previousThreadViewInputRef = useRef<boolean | null>(null);
  const previousZoomInteractionActiveRef = useRef<boolean>(false);
  const stitchCanvasCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const initializedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const activeTouchPointerIdsRef = useRef<Set<number>>(new Set());
  const touchGestureLockedRef = useRef(false);
  const pendingTouchPaintRef = useRef<{
    clientX: number;
    clientY: number;
    point: GridPoint;
    pointerId: number;
    selectionPoint: SelectionPoint;
  } | null>(null);
  const pendingDismissedMousePaintRef = useRef<{
    clientX: number;
    clientY: number;
    point: GridPoint;
    pointerId: number;
    selectionPoint: SelectionPoint;
    timeoutId: number;
  } | null>(null);
  const touchFallbackResetTimeoutRef = useRef<number | null>(null);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    let frameId: number | null = null;

    const syncBackgroundColor = () => {
      const nextColor = getComputedStyle(root)
        .getPropertyValue("--canvas-bg")
        .trim();
      setBackgroundColor(nextColor || "#ffffff");
    };

    const syncBackgroundColorDuringThemeTransition = () => {
      syncBackgroundColor();

      if (!root.hasAttribute("data-theme-transitioning")) {
        frameId = null;
        return;
      }

      frameId = window.requestAnimationFrame(syncBackgroundColorDuringThemeTransition);
    };

    syncBackgroundColor();

    const observer = new MutationObserver(() => {
      syncBackgroundColor();

      if (root.hasAttribute("data-theme-transitioning") && frameId === null) {
        frameId = window.requestAnimationFrame(syncBackgroundColorDuringThemeTransition);
      }
    });
    observer.observe(root, {
      attributeFilter: ["data-theme", "data-theme-transitioning"],
      attributes: true,
    });

    return () => {
      observer.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    let canvas = sourceCanvasRef.current;

    if (!canvas && typeof document !== "undefined") {
      canvas = document.createElement("canvas");
      sourceCanvasRef.current = canvas;
    }

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const justEnteredZoomInteraction =
      isZoomInteractionActive && !previousZoomInteractionActiveRef.current;

    previousZoomInteractionActiveRef.current = isZoomInteractionActive;

    const nextConfiguration = configureSourceCanvas(
      canvas,
      context,
      metrics,
      stageSize,
      { isZoomInteractionActive },
      sourceCanvasSizingRef.current,
    );
    sourceCanvasSizingRef.current = nextConfiguration.sizing;
    if (nextConfiguration.sizingChanged || justEnteredZoomInteraction) {
      initializedRef.current = false;
    }
  }, [
    isZoomInteractionActive,
    metrics.cellSize,
    metrics.surfaceHeight,
    metrics.surfaceWidth,
    stageSize.height,
    stageSize.width,
  ]);

  useEffect(() => {
    const canvas = sourceCanvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const previousCells = previousCellsRef.current;
    const previousColors = previousColorsRef.current;
    const previousThreadView = previousThreadViewRef.current;
    const inputsUnchangedSinceLastRender =
      previousCellsInputRef.current === cells &&
      previousColorsInputRef.current === colorsById &&
      previousThreadViewInputRef.current === threadView;

    if (isZoomInteractionActive && initializedRef.current && inputsUnchangedSinceLastRender) {
      return;
    }

    const shouldRedrawAll =
      !initializedRef.current ||
      !previousCells ||
      previousCells.length !== cells.length ||
      previousColors !== colorsById ||
      previousThreadView !== threadView;
    const canUseKnownChangedCells =
      !shouldRedrawAll &&
      latestGridCellChange !== null &&
      latestGridCellChange.indexes.length > 0;

    if (shouldRedrawAll) {
      redrawSourceCanvas({
        context,
        cells,
        colorsById,
        gridWidth,
        metrics,
        stitchStyleVersion: sourceThreadStyleVersion,
        threadView,
        stitchCanvasCache: stitchCanvasCacheRef.current,
      });

      initializedRef.current = true;
      previousCellsRef.current = cells.slice();
      previousCellsInputRef.current = cells;
      previousColorsRef.current = colorsById;
      previousColorsInputRef.current = colorsById;
      previousThreadViewRef.current = threadView;
      previousThreadViewInputRef.current = threadView;
      return;
    }

    if (canUseKnownChangedCells) {
      drawKnownChangedSourceCells({
        context,
        cells,
        changedIndices: latestGridCellChange.indexes,
        colorsById,
        gridWidth,
        cellSize: metrics.cellSize,
        stitchStyleVersion: sourceThreadStyleVersion,
        threadView,
        stitchCanvasCache: stitchCanvasCacheRef.current,
      });

      for (const index of latestGridCellChange.indexes) {
        if (index >= 0 && index < previousCells.length) {
          previousCells[index] = cells[index] ?? null;
        }
      }

      previousCellsRef.current = previousCells;
    } else {
      drawChangedSourceCells({
        context,
        cells,
        previousCells,
        colorsById,
        gridWidth,
        cellSize: metrics.cellSize,
        stitchStyleVersion: sourceThreadStyleVersion,
        threadView,
        stitchCanvasCache: stitchCanvasCacheRef.current,
      });

      previousCellsRef.current = cells.slice();
    }

    previousCellsInputRef.current = cells;
    previousColorsRef.current = colorsById;
    previousColorsInputRef.current = colorsById;
    previousThreadViewRef.current = threadView;
    previousThreadViewInputRef.current = threadView;
  }, [
    cells,
    colorsById,
    gridWidth,
    isZoomInteractionActive,
    latestGridCellChange,
    metrics.cellSize,
    metrics.surfaceHeight,
    metrics.surfaceWidth,
    sourceThreadStyleVersion,
    stageSize.height,
    stageSize.width,
    threadView,
    viewport.zoom,
  ]);

  useEffect(() => {
    const canvas = displayCanvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;

    if (!canvas || !sourceCanvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    displayCanvasSizingRef.current = configureDisplayCanvas(
      canvas,
      context,
      stageSize,
      displayCanvasSizingRef.current,
    );
    renderDisplayCanvas({
      backgroundColor,
      context,
      sourceCanvas,
      cells,
      colorsById,
      deferPaintUntilTraceReady,
      displayTrace,
        displayTraceAsset,
        displayTraceOverride,
        frameOrigin,
      gridOverlayStep,
      gridWidth,
      highlightedCellIndexes,
      highlightedColorId,
      metrics,
      paintOpacity,
      previewMode,
      isZoomInteractionActive,
      showGridlines,
      showSymbols,
      stageSize,
      symbolAssignments,
      threadView,
      viewport,
    });

    let frameId = window.requestAnimationFrame(() => {
      onDisplayRendered?.();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    backgroundColor,
    cells,
    colorsById,
    deferPaintUntilTraceReady,
    onDisplayRendered,
    frameOrigin.x,
    frameOrigin.y,
    gridOverlayStep,
    gridWidth,
    highlightedCellIndexes,
    highlightedColorId,
    metrics.surfaceHeight,
    metrics.surfaceWidth,
    metrics.cellSize,
    metrics.height,
    showGridlines,
    showSymbols,
    stageSize.height,
    stageSize.width,
    symbolAssignments,
    displayTrace?.offsetX,
    displayTrace?.offsetY,
    displayTrace?.rotation,
    displayTrace?.opacity,
    displayTrace?.scale,
    displayTrace?.cropX,
    displayTrace?.cropY,
    displayTrace?.cropWidth,
    displayTrace?.cropHeight,
    displayTrace?.imageWidth,
    displayTrace?.imageHeight,
    displayTrace?.previewUrl,
    displayTraceAsset,
    displayTraceOverride,
    paintOpacity,
    previewMode,
    isZoomInteractionActive,
    threadView,
    viewport.offsetX,
    viewport.offsetY,
    viewport.zoom,
  ]);

  const clearPendingTouchPaint = useCallback(() => {
    pendingTouchPaintRef.current = null;
  }, []);

  const clearPendingDismissedMousePaint = useCallback(() => {
    const pendingDismissedMousePaint = pendingDismissedMousePaintRef.current;

    if (!pendingDismissedMousePaint) {
      return;
    }

    window.clearTimeout(pendingDismissedMousePaint.timeoutId);
    pendingDismissedMousePaintRef.current = null;
  }, []);

  const clearTouchFallbackResetTimeout = useCallback(() => {
    if (touchFallbackResetTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(touchFallbackResetTimeoutRef.current);
    touchFallbackResetTimeoutRef.current = null;
  }, []);

  const clearTouchInteractionState = useCallback(() => {
    clearTouchFallbackResetTimeout();
    activeTouchPointerIdsRef.current.clear();
    touchGestureLockedRef.current = false;
    activePointerIdRef.current = null;
    clearPendingTouchPaint();
    clearPendingDismissedMousePaint();
    cancelPaintStroke();
  }, [
    cancelPaintStroke,
    clearPendingDismissedMousePaint,
    clearPendingTouchPaint,
    clearTouchFallbackResetTimeout,
  ]);

  const activatePendingTouchPaint = useCallback(() => {
    const pendingTouchPaint = pendingTouchPaintRef.current;

    if (!pendingTouchPaint) {
      return false;
    }

    handlePointerDown(pendingTouchPaint.point, pendingTouchPaint.selectionPoint);
    pendingTouchPaintRef.current = null;
    return true;
  }, [handlePointerDown]);

  const activatePendingDismissedMousePaint = useCallback(() => {
    const pendingDismissedMousePaint = pendingDismissedMousePaintRef.current;

    if (!pendingDismissedMousePaint) {
      return false;
    }

    window.clearTimeout(pendingDismissedMousePaint.timeoutId);
    pendingDismissedMousePaintRef.current = null;
    handlePointerDown(
      pendingDismissedMousePaint.point,
      pendingDismissedMousePaint.selectionPoint,
    );
    return true;
  }, [handlePointerDown]);

  const shouldDeferPaintForDismissClick = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const dismissGesture = colorLibraryDismissGestureRef?.current;

      if (!dismissGesture) {
        return false;
      }

      const matchesPointerType = dismissGesture.pointerType === event.pointerType;
      const matchesTime =
        Math.abs(dismissGesture.timeStamp - event.timeStamp) <=
        DISMISS_GESTURE_MATCH_WINDOW_MS;
      const matchesDistance =
        Math.hypot(
          dismissGesture.clientX - event.clientX,
          dismissGesture.clientY - event.clientY,
        ) <= DISMISS_GESTURE_MATCH_DISTANCE_PX;

      colorLibraryDismissGestureRef.current = null;
      return matchesPointerType && matchesTime && matchesDistance;
    },
    [colorLibraryDismissGestureRef],
  );

  useEffect(() => {
    function handleWindowPointerEnd(event: PointerEvent) {
      if (pendingDismissedMousePaintRef.current?.pointerId === event.pointerId) {
        clearPendingDismissedMousePaint();
      }

      if (event.pointerType !== "touch") {
        return;
      }

      clearTouchFallbackResetTimeout();
      activeTouchPointerIdsRef.current.delete(event.pointerId);

      if (pendingTouchPaintRef.current?.pointerId === event.pointerId) {
        if (!touchGestureLockedRef.current) {
          activatePendingTouchPaint();
        } else {
          clearPendingTouchPaint();
        }
      }

      if (activePointerIdRef.current === event.pointerId) {
        activePointerIdRef.current = null;
        cancelPaintStroke();
      }

      if (activeTouchPointerIdsRef.current.size === 0) {
        touchGestureLockedRef.current = false;
      }
    }

    function handleWindowTouchEnd(event: TouchEvent) {
      if (event.touches.length > 0) {
        return;
      }

      clearTouchFallbackResetTimeout();
      touchFallbackResetTimeoutRef.current = window.setTimeout(() => {
        clearTouchInteractionState();
      }, 0);
    }

    function handleWindowBlur() {
      clearTouchInteractionState();
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        clearTouchInteractionState();
      }
    }

    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);
    window.addEventListener("touchend", handleWindowTouchEnd);
    window.addEventListener("touchcancel", handleWindowTouchEnd);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
      window.removeEventListener("touchend", handleWindowTouchEnd);
      window.removeEventListener("touchcancel", handleWindowTouchEnd);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTouchFallbackResetTimeout();
    };
  }, [
    activatePendingTouchPaint,
    cancelPaintStroke,
    clearPendingDismissedMousePaint,
    clearPendingTouchPaint,
    clearTouchFallbackResetTimeout,
    clearTouchInteractionState,
  ]);

  useEffect(() => {
    return () => {
      clearPendingDismissedMousePaint();
    };
  }, [clearPendingDismissedMousePaint]);

  return (
    <>
      {displayHost
        ? createPortal(
            <canvas
              ref={displayCanvasRef}
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                pointerEvents: "none",
                imageRendering: "pixelated",
              }}
            />,
            displayHost,
          )
        : null}

      <div
        aria-label="Grid canvas"
        onPointerDown={(event) => {
          if (!interactionEnabled) {
            return;
          }

          if (event.pointerType === "touch") {
            activeTouchPointerIdsRef.current.add(event.pointerId);

            if (activeTouchPointerIdsRef.current.size > 1) {
              touchGestureLockedRef.current = true;
              clearPendingTouchPaint();
              cancelPaintStroke();

              const activePointerId = activePointerIdRef.current;
              if (
                activePointerId !== null &&
                event.currentTarget.hasPointerCapture(activePointerId)
              ) {
                event.currentTarget.releasePointerCapture(activePointerId);
              }

              activePointerIdRef.current = null;
              return;
            }

            if (touchGestureLockedRef.current) {
              return;
            }
          }

          if (event.pointerType === "mouse" && event.button !== 0) {
            return;
          }

          const point = getGridPointFromClient(event.clientX, event.clientY);
          const selectionPoint = getSelectionPointFromClient(
            event.clientX,
            event.clientY,
          );

          if (!point || !selectionPoint) {
            return;
          }

          activePointerIdRef.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.preventDefault();

          if (event.pointerType === "touch") {
            pendingTouchPaintRef.current = {
              clientX: event.clientX,
              clientY: event.clientY,
              point,
              pointerId: event.pointerId,
              selectionPoint,
            };
            return;
          }

          if (shouldDeferPaintForDismissClick(event)) {
            clearPendingDismissedMousePaint();
            pendingDismissedMousePaintRef.current = {
              clientX: event.clientX,
              clientY: event.clientY,
              point,
              pointerId: event.pointerId,
              selectionPoint,
              timeoutId: window.setTimeout(() => {
                activatePendingDismissedMousePaint();
              }, DISMISS_CLICK_HOLD_TO_PAINT_MS),
            };
            return;
          }

          handlePointerDown(point, selectionPoint);
        }}
        onPointerMove={(event) => {
          if (!interactionEnabled) {
            return;
          }

          handleHover(
            event.pointerType === "touch"
              ? null
              : getSelectionPointFromClient(event.clientX, event.clientY),
          );

          if (
            event.pointerType === "touch" &&
            (touchGestureLockedRef.current || activeTouchPointerIdsRef.current.size > 1)
          ) {
            clearPendingTouchPaint();
            return;
          }

          const isActivePointer = activePointerIdRef.current === event.pointerId;
          const isPressed =
            event.pointerType === "mouse" ? (event.buttons & 1) !== 0 : isActivePointer;

          if (!isPressed) {
            return;
          }

          const pendingDismissedMousePaint = pendingDismissedMousePaintRef.current;
          if (pendingDismissedMousePaint?.pointerId === event.pointerId) {
            const distance = Math.hypot(
              event.clientX - pendingDismissedMousePaint.clientX,
              event.clientY - pendingDismissedMousePaint.clientY,
            );

            if (distance < DISMISS_CLICK_MOVE_TO_PAINT_PX) {
              return;
            }

            activatePendingDismissedMousePaint();
          }

          const point = getGridPointFromClient(event.clientX, event.clientY);

          if (!point) {
            return;
          }

          if (isActivePointer) {
            event.preventDefault();
          }

          if (event.pointerType === "touch") {
            const pendingTouchPaint = pendingTouchPaintRef.current;

            if (pendingTouchPaint?.pointerId === event.pointerId) {
              const distance = Math.hypot(
                event.clientX - pendingTouchPaint.clientX,
                event.clientY - pendingTouchPaint.clientY,
              );

              if (distance < TOUCH_PAINT_ACTIVATION_DISTANCE_PX) {
                return;
              }

              activatePendingTouchPaint();
            }
          }

          handlePointerEnter(point);
        }}
        onPointerUp={(event) => {
          if (!interactionEnabled) {
            return;
          }

          if (event.pointerType === "touch") {
            activeTouchPointerIdsRef.current.delete(event.pointerId);

            if (activeTouchPointerIdsRef.current.size === 0) {
              touchGestureLockedRef.current = false;
            }
          }

          if (
            event.pointerType === "touch" &&
            pendingTouchPaintRef.current?.pointerId === event.pointerId &&
            !touchGestureLockedRef.current
          ) {
            activatePendingTouchPaint();
          }

          if (pendingDismissedMousePaintRef.current?.pointerId === event.pointerId) {
            clearPendingDismissedMousePaint();
          }

          if (activePointerIdRef.current !== event.pointerId) {
            return;
          }

          activePointerIdRef.current = null;
          clearPendingTouchPaint();
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          if (!interactionEnabled) {
            return;
          }

          if (event.pointerType === "touch") {
            activeTouchPointerIdsRef.current.delete(event.pointerId);

            if (activeTouchPointerIdsRef.current.size === 0) {
              touchGestureLockedRef.current = false;
            }
          }

          if (pendingTouchPaintRef.current?.pointerId === event.pointerId) {
            clearPendingTouchPaint();
          }

          if (pendingDismissedMousePaintRef.current?.pointerId === event.pointerId) {
            clearPendingDismissedMousePaint();
          }

          if (activePointerIdRef.current !== event.pointerId) {
            return;
          }

          activePointerIdRef.current = null;
          clearPendingTouchPaint();
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerLeave={() => {
          if (!interactionEnabled) {
            return;
          }

          handleHover(null);
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background: "transparent",
          cursor: "inherit",
          pointerEvents: interactionEnabled ? "auto" : "none",
          touchAction: "none",
        }}
      />
    </>
  );
}
