"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ActiveTool,
  EditorStore,
  EditorStoreState,
  PaletteColor,
} from "@/lib/editor-v2/editor/store";
import {
  createGridWorldMetrics,
  clientToWorldPoint,
  getTraceTransform,
  getViewportTransform,
} from "@/lib/editor-v2/editor/viewport";
import {
  createPanViewportCommand,
  createSetViewportZoomCommand,
} from "../workspaceCommands";
import { GridCanvasStage } from "./GridCanvasStage";
import { GridRulerOverlay } from "./GridRulerOverlay";
import { useGridInteractions } from "../interactions/useGridInteractions";

interface GridWorldSurfaceProps {
  activeColorId: string | null;
  activeTool: ActiveTool;
  colorsById: Record<string, PaletteColor>;
  dispatch: EditorStore["dispatch"];
  showGridlines: boolean;
  showRuler: boolean;
  state: EditorStoreState;
  zoomAnchor: { x: number; y: number } | null;
}

export function GridWorldSurface({
  activeColorId,
  activeTool,
  colorsById,
  dispatch,
  showGridlines,
  showRuler,
  state,
  zoomAnchor,
}: GridWorldSurfaceProps) {
  const grid = state.document.grid;
  const trace = state.document.trace;
  const viewport = state.session.viewport;
  const selection = state.session.selection;
  const metrics = createGridWorldMetrics(grid.width, grid.height, 28, 0);
  const renderedCellSize = metrics.cellSize * viewport.zoom;
  const gridOverlayStep = getGridOverlayStep(renderedCellSize);
  const lassoPoints = selection.lassoPoints
    .map((point) => `${point.x * metrics.cellSize},${point.y * metrics.cellSize}`)
    .join(" ");
  const shouldDimCanvas = activeTool === "lasso";
  const hasCommittedLassoSelection =
    selection.mode === "lasso" &&
    !selection.preview &&
    selection.lassoPoints.length >= 3;
  const traceBlendMode = trace?.blendMode ?? "image";
  const traceImageOpacity =
    trace && trace.visible && traceBlendMode === "crossfade"
      ? trace.opacity
      : trace?.opacity ?? 0;
  const gridOpacity =
    trace && trace.visible && traceBlendMode === "crossfade"
      ? 1 - trace.opacity
      : 1;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const displayLayerRef = useRef<HTMLDivElement | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanDragging, setIsPanDragging] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const isSpacePressedRef = useRef(false);
  const panDragRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const frameOrigin = {
    x: (stageSize.width - metrics.surfaceWidth) / 2,
    y: (stageSize.height - metrics.surfaceHeight) / 2,
  };
  const getSelectionPointFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const worldElement = worldRef.current;

      if (!worldElement) {
        return null;
      }

      const rect = worldElement.getBoundingClientRect();
      const worldPoint = clientToWorldPoint(
        { x: clientX, y: clientY },
        { left: rect.left, top: rect.top },
        viewport,
      );

      if (
        worldPoint.x < 0 ||
        worldPoint.y < 0 ||
        worldPoint.x >= metrics.surfaceWidth ||
        worldPoint.y >= metrics.surfaceHeight
      ) {
        return null;
      }

      return {
        x: worldPoint.x / metrics.cellSize,
        y: worldPoint.y / metrics.cellSize,
      };
    },
    [metrics.cellSize, metrics.surfaceHeight, metrics.surfaceWidth, viewport],
  );
  const getClampedSelectionPointFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const worldElement = worldRef.current;

      if (!worldElement) {
        return null;
      }

      const rect = worldElement.getBoundingClientRect();
      const worldPoint = clientToWorldPoint(
        { x: clientX, y: clientY },
        { left: rect.left, top: rect.top },
        viewport,
      );
      const maxX = Math.max(metrics.surfaceWidth - 0.001, 0);
      const maxY = Math.max(metrics.surfaceHeight - 0.001, 0);

      return {
        x: Math.min(Math.max(worldPoint.x, 0), maxX) / metrics.cellSize,
        y: Math.min(Math.max(worldPoint.y, 0), maxY) / metrics.cellSize,
      };
    },
    [metrics.cellSize, metrics.surfaceHeight, metrics.surfaceWidth, viewport],
  );
  const getGridPointFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const selectionPoint = getSelectionPointFromClient(clientX, clientY);

      if (!selectionPoint) {
        return null;
      }

      return {
        x: Math.floor(selectionPoint.x),
        y: Math.floor(selectionPoint.y),
      };
    },
    [getSelectionPointFromClient],
  );
  const { handlePointerDown, handlePointerEnter } = useGridInteractions({
    activeColorId,
    activeTool,
    dispatch,
    getClampedSelectionPointFromClient,
    getSelectionPointFromClient,
    state,
  });
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        const isTrackpadPinch = event.ctrlKey && !event.metaKey;
        const zoomSensitivity = isTrackpadPinch ? 0.006 : 0.0009;
        const zoomFactor = Math.exp(-event.deltaY * zoomSensitivity);
        dispatch(
          createSetViewportZoomCommand(
            viewport.zoom * zoomFactor,
            zoomAnchor ?? undefined,
          ),
        );
        return;
      }

      dispatch(createPanViewportCommand(-event.deltaX, -event.deltaY));
    },
    [dispatch, viewport.zoom],
  );

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
  }, [handleWheel]);

  useEffect(() => {
    const stageElement = stageRef.current;

    if (!stageElement) {
      return;
    }

    const update = () => {
      const rect = stageElement.getBoundingClientRect();

      setStageSize({
        width: rect.width,
        height: rect.height,
      });
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(stageElement);

    return () => observer.disconnect();
  }, []);

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
      panDragRef.current = null;
      setIsPanDragging(false);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [dispatch]);

  const handleStageMouseDownCapture = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const isMiddleMouseButton = event.button === 1;
      const isSpaceDrag = event.button === 0 && isSpacePressedRef.current;

      if (!isMiddleMouseButton && !isSpaceDrag) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      panDragRef.current = {
        lastX: event.clientX,
        lastY: event.clientY,
      };
      setIsPanDragging(true);
    },
    [],
  );

  const handleStageAuxClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.button !== 1) {
        return;
      }

      event.preventDefault();
    },
    [],
  );

  return (
    <div
      ref={stageRef}
      onMouseDownCapture={handleStageMouseDownCapture}
      onAuxClick={handleStageAuxClick}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: isPanDragging ? "grabbing" : spacePressed ? "grab" : "default",
      }}
    >
      <div
        ref={displayLayerRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: `${metrics.surfaceWidth}px`,
          height: `${metrics.surfaceHeight}px`,
          transform: "translate(-50%, -50%)",
          transformOrigin: "center center",
          overflow: "visible",
        }}
      >
        {showRuler ? (
          <GridRulerOverlay
            axisStep={gridOverlayStep}
            metrics={metrics}
            viewport={viewport}
          />
        ) : null}

        <div
          ref={worldRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${metrics.surfaceWidth}px`,
            height: `${metrics.surfaceHeight}px`,
            transform: getViewportTransform(viewport),
            transformOrigin: "top left",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${metrics.surfaceWidth}px`,
              height: `${metrics.surfaceHeight}px`,
              background: "#ffffff",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
            }}
          />

          {trace && trace.visible ? (
            <img
              src={trace.assetUrl}
              alt="Trace reference"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${metrics.surfaceWidth}px`,
                height: `${metrics.surfaceHeight}px`,
                objectFit: "cover",
                opacity: traceImageOpacity,
                pointerEvents: "none",
                transform: getTraceTransform(trace),
                transformOrigin: "top left",
                willChange: "opacity, transform",
                backfaceVisibility: "hidden",
              }}
            />
          ) : null}

          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: `${metrics.surfaceWidth}px`,
              height: `${metrics.surfaceHeight}px`,
              opacity: gridOpacity,
            }}
          >
            <GridCanvasStage
              cells={grid.cells}
              colorsById={colorsById}
              displayHost={displayLayerRef.current}
              frameOrigin={frameOrigin}
              getGridPointFromClient={getGridPointFromClient}
              getSelectionPointFromClient={getSelectionPointFromClient}
              gridWidth={grid.width}
              handlePointerDown={handlePointerDown}
              handlePointerEnter={handlePointerEnter}
              gridOverlayStep={gridOverlayStep}
              metrics={metrics}
              showGridlines={showGridlines}
              stageSize={stageSize}
              viewport={viewport}
            />
          </div>

          {shouldDimCanvas ? (
            hasCommittedLassoSelection ? (
              <svg
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  pointerEvents: "none",
                  overflow: "visible",
                }}
                width={metrics.surfaceWidth}
                height={metrics.surfaceHeight}
                viewBox={`0 0 ${metrics.surfaceWidth} ${metrics.surfaceHeight}`}
              >
                <path
                  fill="rgba(15, 23, 42, 0.24)"
                  fillRule="evenodd"
                  d={`M 0 0 H ${metrics.surfaceWidth} V ${metrics.surfaceHeight} H 0 Z M ${lassoPoints} Z`}
                />
              </svg>
            ) : (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  pointerEvents: "none",
                  backgroundColor: "rgba(15, 23, 42, 0.24)",
                }}
              />
            )
          ) : null}

          {selection.mode === "lasso" && selection.lassoPoints.length > 0 ? (
            <svg
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 4,
                pointerEvents: "none",
                overflow: "visible",
              }}
              width={metrics.surfaceWidth}
              height={metrics.surfaceHeight}
              viewBox={`0 0 ${metrics.surfaceWidth} ${metrics.surfaceHeight}`}
            >
              {selection.preview ? (
                <polyline
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={lassoPoints}
                />
              ) : (
                <polygon
                  fill="rgba(37, 99, 235, 0.08)"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={lassoPoints}
                />
              )}
            </svg>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getGridOverlayStep(renderedCellSize: number): number {
  if (renderedCellSize <= 0) {
    return 1;
  }

  // Use a stricter shared spacing target so both gridlines and ruler labels
  // step out sooner and avoid overcrowding at dense zoom levels.
  const targetScreenSpacing = 36;
  const rawStep = targetScreenSpacing / renderedCellSize;
  const friendlySteps = [1, 5, 10, 15, 20, 25, 50, 100];

  for (const step of friendlySteps) {
    if (step >= rawStep) {
      return step;
    }
  }

  return Math.max(100, Math.ceil(rawStep / 100) * 100);
}
