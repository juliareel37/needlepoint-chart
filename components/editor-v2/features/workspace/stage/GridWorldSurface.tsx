"use client";

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
  getViewportTransform,
} from "@/lib/editor-v2/editor/viewport";
import { GridCanvasStage } from "./GridCanvasStage";
import { GridRulerOverlay } from "./overlays/GridRulerOverlay";
import { SelectionOverlay } from "./overlays/SelectionOverlay";
import { TextPlacementLayer } from "./TextPlacementLayer";
import { TraceImageLayer } from "./TraceImageLayer";
import { useStagePanInteractions } from "./useStagePanInteractions";
import { useGridInteractions } from "../interactions/useGridInteractions";

interface LoadedTraceAsset {
  assetUrl: string;
  height: number;
  image: HTMLImageElement | null;
  ready: boolean;
  width: number;
}

interface GridWorldSurfaceProps {
  activeColorId: string | null;
  activeTool: ActiveTool;
  brushSize: number;
  colorsById: Record<string, PaletteColor>;
  dispatch: EditorStore["dispatch"];
  previewMode: boolean;
  showGridlines: boolean;
  showRuler: boolean;
  showSymbols: boolean;
  state: EditorStoreState;
  zoomAnchor: { x: number; y: number } | null;
}

export function GridWorldSurface({
  activeColorId,
  activeTool,
  brushSize,
  colorsById,
  dispatch,
  previewMode,
  showGridlines,
  showRuler,
  showSymbols,
  state,
  zoomAnchor,
}: GridWorldSurfaceProps) {
  const grid = state.document.grid;
  const trace = state.document.trace;
  const textPlacement = state.session.textInteraction.placement;
  const viewport = state.session.viewport;
  const selection = state.session.selection;
  const mirrorInteraction = state.session.mirrorInteraction;
  const metrics = createGridWorldMetrics(grid.width, grid.height, 28, 0);
  const renderedCellSize = metrics.cellSize * viewport.zoom;
  const gridOverlayStep = getGridOverlayStep(renderedCellSize);
  const traceVisible = Boolean(trace?.visible) && !previewMode;
  const traceBlendMode = traceVisible ? trace?.blendMode ?? "image" : "image";
  const tracePositioningEnabled = Boolean(trace && traceVisible && !trace.locked);
  const showTraceOverlay = Boolean(trace && traceVisible && tracePositioningEnabled);
  const showDisplayTrace = Boolean(trace && traceVisible && !tracePositioningEnabled);
  const traceImageOpacity =
    trace && traceVisible && traceBlendMode === "crossfade"
      ? trace.opacity
      : trace?.opacity ?? 0;
  const gridOpacity =
    trace && traceVisible && traceBlendMode === "crossfade"
      ? 1 - trace.opacity
      : 1;
  const effectiveShowGridlines = showGridlines && !previewMode;
  const effectiveShowSymbols = showSymbols && !previewMode;
  const effectiveShowRuler = showRuler;
  const threadView = previewMode || state.ui.preferences.threadView;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [displayHost, setDisplayHost] = useState<HTMLElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [loadedTraceAsset, setLoadedTraceAsset] = useState<LoadedTraceAsset | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const frameOrigin = {
    x: (stageSize.width - metrics.surfaceWidth) / 2,
    y: (stageSize.height - metrics.surfaceHeight) / 2,
  };
  const textPlacementActive = Boolean(textPlacement);
  const textPreviewColor =
    (activeColorId ? colorsById[activeColorId]?.hex : null) ?? "#111827";
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
  const getWorldPointFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const worldElement = worldRef.current;

      if (!worldElement) {
        return null;
      }

      const rect = worldElement.getBoundingClientRect();
      return clientToWorldPoint(
        { x: clientX, y: clientY },
        { left: rect.left, top: rect.top },
        viewport,
      );
    },
    [viewport],
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
    brushSize,
    dispatch,
    getClampedSelectionPointFromClient,
    getSelectionPointFromClient,
    metrics,
    state,
    trace,
  });
  const {
    cursor,
    handleStageAuxClick,
    handleStageMouseDownCapture,
  } = useStagePanInteractions({
    activeTool,
    dispatch,
    panningDisabled: tracePositioningEnabled || textPlacementActive,
    stageRef,
    viewportZoom: viewport.zoom,
    zoomAnchor,
  });

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
    if (!trace?.assetUrl) {
      setLoadedTraceAsset(null);
      return;
    }

    let cancelled = false;
    const assetUrl = trace.assetUrl;
    const image = new Image();
    image.decoding = "async";

    const commitLoadedState = (ready: boolean) => {
      if (cancelled) {
        return;
      }

      setLoadedTraceAsset({
        assetUrl,
        height: ready ? image.naturalHeight : 0,
        image: ready ? image : null,
        ready,
        width: ready ? image.naturalWidth : 0,
      });
    };

    image.onload = () => commitLoadedState(true);
    image.onerror = () => commitLoadedState(false);
    image.src = assetUrl;

    if (image.complete) {
      commitLoadedState(image.naturalWidth > 0 && image.naturalHeight > 0);
    }

    return () => {
      cancelled = true;
    };
  }, [trace?.assetUrl]);



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
        cursor,
      }}
    >
      <div
        ref={setDisplayHost}
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
        {effectiveShowRuler ? (
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
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
          }}
        >
          {showTraceOverlay && trace ? (
            <TraceImageLayer
              assetHeight={loadedTraceAsset?.assetUrl === trace.assetUrl ? loadedTraceAsset.height : null}
              assetWidth={loadedTraceAsset?.assetUrl === trace.assetUrl ? loadedTraceAsset.width : null}
              dispatch={dispatch}
              getWorldPointFromClient={getWorldPointFromClient}
              imageOpacity={traceImageOpacity}
              metrics={metrics}
              positioningEnabled={tracePositioningEnabled}
              trace={trace}
              zIndex={3}
              zoom={viewport.zoom}
            />
          ) : null}

          <div
            style={{
              position: "relative",
              zIndex: 2,
              width: `${metrics.surfaceWidth}px`,
              height: `${metrics.surfaceHeight}px`,
            }}
          >
            <GridCanvasStage
              cells={grid.cells}
              colorsById={colorsById}
              displayHost={displayHost}
              displayTraceAsset={
                trace && loadedTraceAsset?.assetUrl === trace.assetUrl
                  ? loadedTraceAsset
                  : null
              }
              paintOpacity={gridOpacity}
              displayTrace={showDisplayTrace ? trace : null}
              frameOrigin={frameOrigin}
              getGridPointFromClient={getGridPointFromClient}
              getSelectionPointFromClient={getSelectionPointFromClient}
              gridWidth={grid.width}
              handlePointerDown={handlePointerDown}
              handlePointerEnter={handlePointerEnter}
              gridOverlayStep={gridOverlayStep}
              metrics={metrics}
              showGridlines={effectiveShowGridlines}
              showSymbols={effectiveShowSymbols}
              stageSize={stageSize}
              symbolAssignments={state.document.palette.symbolAssignments}
              threadView={threadView}
              viewport={viewport}
            />
          </div>

          <SelectionOverlay
            activeTool={activeTool}
            metrics={metrics}
            mirrorInteraction={mirrorInteraction}
            selection={selection}
          />

          {textPlacement ? (
            <TextPlacementLayer
              dispatch={dispatch}
              getWorldPointFromClient={getWorldPointFromClient}
              metrics={metrics}
              placement={textPlacement}
              previewColor={textPreviewColor}
              zoom={viewport.zoom}
            />
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
