"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { ColorLibraryDismissGesture } from "../shell/FloatingToolbar";
import { clampGridBrushSize } from "@/lib/editor-v2/editor/brushSize";
import type {
  ActiveTool,
  EditorStore,
  EditorStoreState,
  GridPoint,
  PaletteColor,
  ViewportState,
} from "@/lib/editor-v2/editor/store";
import type { TraceCropRect } from "@/lib/editor-v2/editor/trace/crop";
import {
  clampWorldPointToSurface,
  clampViewportOffsets,
  createGridWorldMetrics,
  clientToWorldPoint,
  getViewportTransform,
} from "@/lib/editor-v2/editor/viewport";
import { GridCanvasStage } from "./GridCanvasStage";
import { GridRulerOverlay } from "./overlays/GridRulerOverlay";
import { SelectionOverlay } from "./overlays/SelectionOverlay";
import { TextPlacementLayer } from "./TextPlacementLayer";
import { IconPlacementLayer } from "./IconPlacementLayer";
import { TraceImageLayer } from "./TraceImageLayer";
import { DuplicatePlacementLayer } from "./DuplicatePlacementLayer";
import { useStagePanInteractions } from "./useStagePanInteractions";
import { useGridInteractions } from "../interactions/useGridInteractions";
import { createPanViewportCommand } from "../workspaceCommands";
import type { LoadedTraceAsset } from "./GridCanvasStage.shared";
import { clearTraceSampler } from "../trace/traceSampler";
import type { EraserEditMode, EraserMode } from "@/lib/editor-v2/editor/magicWand";

function traceEraserDebugEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const debugWindow = window as typeof window & { __TRACE_ERASER_DEBUG__?: boolean };
  if (debugWindow.__TRACE_ERASER_DEBUG__) {
    return true;
  }

  return new URLSearchParams(window.location.search).get("traceEraserDebug") === "1";
}

function traceEraserDebugLog(event: string, payload: Record<string, unknown>): void {
  if (!traceEraserDebugEnabled()) {
    return;
  }

  console.debug(`[trace-eraser:surface:${event}]`, payload);
}

interface GridWorldSurfaceProps {
  activeColorId: string | null;
  activeTool: ActiveTool;
  brushSize: number;
  brushPreviewVisible?: boolean;
  colorLibraryDismissGestureRef?: RefObject<ColorLibraryDismissGesture | null>;
  colorsById: Record<string, PaletteColor>;
  dispatch: EditorStore["dispatch"];
  highlightedColorId: string | null;
  interactionLocked?: boolean;
  onSurfaceReady?: () => void;
  previewMode: boolean;
  showGridlines: boolean;
  showRuler: boolean;
  showSymbols: boolean;
  touchSnappingEnabled: boolean;
  state: EditorStoreState;
  traceCropAspectRatio?: number | null;
  traceCropEditing?: boolean;
  traceCropBase?: TraceCropRect | null;
  iconEraserBrushSize?: number;
  iconEraserBrushPreviewVisible?: boolean;
  iconEraserDraftRevision?: number;
  iconEraserEditing?: boolean;
  iconEraserMaskUrl?: string | null;
  iconEraserEditMode?: EraserEditMode;
  iconEraserMode?: EraserMode;
  traceEraserBrushSize?: number;
  traceEraserBrushPreviewVisible?: boolean;
  traceEraserEditing?: boolean;
  traceEraserMaskUrl?: string | null;
  traceEraserDraftRevision?: number;
  traceEraserEditMode?: EraserEditMode;
  traceEraserMode?: EraserMode;
  traceDisplayOverride?: TraceCropRect | null;
  onIconEraserDraftChange?: (nextMaskUrl: string | null, isFullyVisible: boolean) => void;
  onTraceCropPreviewChange?: (crop: TraceCropRect | null) => void;
  onTraceEraserDraftChange?: (nextMaskUrl: string | null, isFullyVisible: boolean) => void;
  zoomAnchor: { x: number; y: number } | null;
}

export function GridWorldSurface({
  activeColorId,
  activeTool,
  brushSize,
  brushPreviewVisible = false,
  colorLibraryDismissGestureRef,
  colorsById,
  dispatch,
  highlightedColorId,
  interactionLocked = false,
  onSurfaceReady,
  previewMode,
  showGridlines,
  showRuler,
  showSymbols,
  touchSnappingEnabled,
  state,
  traceCropAspectRatio = null,
  traceCropEditing = false,
  traceCropBase = null,
  iconEraserBrushSize = 1,
  iconEraserBrushPreviewVisible = false,
  iconEraserDraftRevision = 0,
  iconEraserEditing = false,
  iconEraserMaskUrl = null,
  iconEraserEditMode = "brush",
  iconEraserMode = "erase",
  traceEraserBrushSize = 1,
  traceEraserBrushPreviewVisible = false,
  traceEraserEditing = false,
  traceEraserMaskUrl = null,
  traceEraserDraftRevision = 0,
  traceEraserEditMode = "brush",
  traceEraserMode = "erase",
  traceDisplayOverride = null,
  onIconEraserDraftChange,
  onTraceCropPreviewChange,
  onTraceEraserDraftChange,
  zoomAnchor,
}: GridWorldSurfaceProps) {
  const grid = state.document.grid;
  const trace = state.document.trace;
  const textPlacement = state.session.textInteraction.placement;
  const iconPlacement = state.session.iconInteraction.placement;
  const duplicatePlacement = state.session.duplicatePlacement;
  const viewport = state.session.viewport;
  const selection = state.session.selection;
  const mirrorInteraction = state.session.mirrorInteraction;
  const [coarsePointer, setCoarsePointer] = useState(false);
  const metrics = createGridWorldMetrics(grid.width, grid.height, 28, 0);
  const renderedCellSize = metrics.cellSize * viewport.zoom;
  const gridOverlayStep = getGridOverlayStep(renderedCellSize);
  const traceVisible = Boolean(trace?.visible) && !previewMode;
  const tracePositioningEnabled = Boolean(trace && traceVisible && !trace.locked);
  const traceCropActive = Boolean(trace && traceVisible && traceCropEditing);
  const traceEraserActive = Boolean(trace && traceVisible && traceEraserEditing);
  const effectiveTrace =
    trace && traceEraserActive
      ? {
          ...trace,
          blendMode: "crossfade" as const,
          opacity: 1,
        }
      : trace;
  const traceBlendMode = traceVisible ? effectiveTrace?.blendMode ?? "image" : "image";
  const showTraceOverlay = Boolean(
    trace && traceVisible && (tracePositioningEnabled || traceCropActive || traceEraserActive),
  );
  const showDisplayTrace = Boolean(
    trace &&
      traceVisible &&
      !tracePositioningEnabled &&
      !traceCropActive &&
      !traceEraserActive,
  );
  const traceImageOpacity =
    effectiveTrace && traceVisible && traceBlendMode === "crossfade"
      ? effectiveTrace.opacity
      : effectiveTrace?.opacity ?? 0;
  const gridOpacity =
    effectiveTrace && traceVisible && traceBlendMode === "crossfade"
      ? 1 - effectiveTrace.opacity
      : 1;
  const effectiveShowGridlines = showGridlines && !previewMode;
  const effectiveShowSymbols = showSymbols && !previewMode;
  const effectiveShowRuler = showRuler;
  const threadView = previewMode || state.ui.preferences.threadView;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [displayHost, setDisplayHost] = useState<HTMLElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [stageBounds, setStageBounds] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const [worldBounds, setWorldBounds] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const [duplicatePlacementOffset, setDuplicatePlacementOffset] = useState({
    x: 0,
    y: 0,
  });
  const [brushCursorPoint, setBrushCursorPoint] = useState<{ x: number; y: number } | null>(null);
  const [loadedTraceAsset, setLoadedTraceAsset] = useState<LoadedTraceAsset | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const frameOrigin = {
    x: (stageSize.width - metrics.surfaceWidth) / 2,
    y: (stageSize.height - metrics.surfaceHeight) / 2,
  };
  const textPlacementActive = Boolean(textPlacement);
  const iconPlacementActive = Boolean(iconPlacement);
  const duplicatePlacementActive = Boolean(duplicatePlacement);
  const positioningCursorActive =
    tracePositioningEnabled || traceEraserActive || textPlacementActive || iconPlacementActive;
  const paintDisabled =
    interactionLocked ||
    positioningCursorActive ||
    traceCropActive ||
    traceEraserActive ||
    duplicatePlacementActive;
  const mainBrushToolActive = activeTool === "paint" || activeTool === "erase";
  const normalizedBrushSize = clampGridBrushSize(brushSize, grid.width, grid.height);
  const brushCursorSize = normalizedBrushSize * metrics.cellSize * viewport.zoom;
  const brushCursorVisible =
    !coarsePointer &&
    !interactionLocked &&
    !paintDisabled &&
    mainBrushToolActive &&
    brushCursorPoint !== null;
  const centeredBrushPreviewVisible =
    !coarsePointer &&
    !interactionLocked &&
    !paintDisabled &&
    mainBrushToolActive &&
    brushPreviewVisible;
  const textPreviewColor =
    (activeColorId ? colorsById[activeColorId]?.hex : null) ?? "#111827";

  const syncSurfaceMeasurements = useCallback(() => {
    const stageElement = stageRef.current;
    const worldElement = worldRef.current;

    if (stageElement) {
      const rect = stageElement.getBoundingClientRect();

      setStageSize((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : {
              width: rect.width,
              height: rect.height,
            },
      );
      setStageBounds((current) =>
        current.left === rect.left &&
        current.top === rect.top &&
        current.width === rect.width &&
        current.height === rect.height
          ? current
          : {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            },
      );
    }

    if (worldElement) {
      const rect = worldElement.getBoundingClientRect();

      setWorldBounds((current) =>
        current.left === rect.left &&
        current.top === rect.top &&
        current.width === rect.width &&
        current.height === rect.height
          ? current
          : {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            },
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(mediaQuery.matches);

    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  useEffect(() => {
    if (!duplicatePlacement) {
      setDuplicatePlacementOffset({ x: 0, y: 0 });
      return;
    }

    setDuplicatePlacementOffset(
      duplicatePlacement.operation === "cut"
        ? { x: 0, y: 0 }
        : getDefaultDuplicatePlacementOffset(
            duplicatePlacement.sourceRect,
            grid.width,
            grid.height,
          ),
    );
  }, [duplicatePlacement, grid.height, grid.width]);

  useEffect(() => {
    if (mainBrushToolActive && !interactionLocked && !paintDisabled) {
      return;
    }

    setBrushCursorPoint(null);
  }, [interactionLocked, mainBrushToolActive, paintDisabled]);
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
  const getClampedWorldPointFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const worldPoint = getWorldPointFromClient(clientX, clientY);

      if (!worldPoint) {
        return null;
      }

      return clampWorldPointToSurface(worldPoint, metrics);
    },
    [getWorldPointFromClient, metrics],
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
  const { cancelPaintStroke, cursor: selectionCursor, handleHover, handlePointerDown, handlePointerEnter } = useGridInteractions({
    activeColorId,
    activeTool,
    brushSize,
    coarsePointer,
    dispatch,
    getClampedSelectionPointFromClient,
    getSelectionPointFromClient,
    metrics,
    paintDisabled,
    previewMode,
    state,
    trace,
  });
  const {
    cursor,
    handleStageAuxClick,
    handleStageMouseDownCapture,
    handleStagePointerDownCapture,
    isZoomInteracting,
  } = useStagePanInteractions({
    activeTool,
    dispatch,
    dragPanningDisabled:
      interactionLocked || paintDisabled,
    metrics,
    positioningCursorActive,
    stageRef,
    stageSize,
    viewport,
    viewportInteractionDisabled: interactionLocked,
    zoomAnchor,
  });

  useLayoutEffect(() => {
    syncSurfaceMeasurements();
  });

  useEffect(() => {
    const stageElement = stageRef.current;

    if (!stageElement) {
      return;
    }

    syncSurfaceMeasurements();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncSurfaceMeasurements);
      return () => window.removeEventListener("resize", syncSurfaceMeasurements);
    }

    const observer = new ResizeObserver(syncSurfaceMeasurements);
    observer.observe(stageElement);
    if (worldRef.current) {
      observer.observe(worldRef.current);
    }

    return () => observer.disconnect();
  }, [syncSurfaceMeasurements]);

  useEffect(() => {
    if (stageSize.width <= 0 || stageSize.height <= 0) {
      return;
    }

    const clampedViewport = clampViewportOffsets(viewport, stageSize, metrics);
    const deltaX = clampedViewport.offsetX - viewport.offsetX;
    const deltaY = clampedViewport.offsetY - viewport.offsetY;

    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    dispatch(createPanViewportCommand(deltaX, deltaY));
  }, [
    dispatch,
    metrics,
    stageSize.height,
    stageSize.width,
    viewport,
  ]);

  useEffect(() => {
    if (trace?.previewUrl && tracePositioningEnabled) {
      clearTraceSampler(trace.previewUrl);
    }
  }, [trace?.previewUrl, tracePositioningEnabled]);

  useEffect(() => {
    if (coarsePointer && tracePositioningEnabled) {
      setLoadedTraceAsset(null);
      return;
    }

    if (!trace?.previewUrl) {
      setLoadedTraceAsset(null);
      return;
    }

    let cancelled = false;
    const previewUrl = trace.previewUrl;
    const maskUrl = trace.maskUrl;

    traceEraserDebugLog("load-start", {
      previewUrl,
      maskUrl,
      traceEraserEditing,
      traceEraserMaskUrl,
    });

    loadTraceAssetBundle(previewUrl, maskUrl).then((bundle) => {
      if (cancelled) {
        return;
      }

      traceEraserDebugLog("load-complete", {
        previewUrl,
        requestedMaskUrl: maskUrl,
        loadedMaskUrl: bundle.mask?.url ?? null,
        ready: bundle.ready,
        width: bundle.width,
        height: bundle.height,
      });
      setLoadedTraceAsset(bundle);
    });

    return () => {
      cancelled = true;
    };
  }, [
    coarsePointer,
    trace?.maskUrl,
    trace?.previewUrl,
    traceEraserEditing,
    traceEraserMaskUrl,
    tracePositioningEnabled,
  ]);

  const traceAssetLoaded =
    Boolean(
      trace?.previewUrl &&
        loadedTraceAsset?.previewUrl === trace.previewUrl &&
        loadedTraceAsset.ready &&
        !!loadedTraceAsset.image &&
        loadedTraceAsset.width > 0 &&
        loadedTraceAsset.height > 0,
    );
  const traceAssetFailed =
    Boolean(
      trace?.previewUrl &&
        loadedTraceAsset?.previewUrl === trace.previewUrl &&
        !loadedTraceAsset.ready,
    );
  const traceAssetReady = !trace?.previewUrl || traceAssetLoaded;
  const deferPaintUntilTraceReady =
    Boolean(onSurfaceReady) &&
    Boolean(trace?.previewUrl) &&
    !traceAssetReady &&
    !traceAssetFailed;
  const handleDisplayRendered = useCallback(() => {
    if (!traceAssetReady && !traceAssetFailed) {
      return;
    }

    onSurfaceReady?.();
  }, [onSurfaceReady, traceAssetFailed, traceAssetReady]);



  return (
    <div
      ref={stageRef}
      onMouseDownCapture={handleStageMouseDownCapture}
      onPointerDownCapture={handleStagePointerDownCapture}
      onAuxClick={handleStageAuxClick}
      onPointerMove={(event) => {
        if (!mainBrushToolActive || coarsePointer || interactionLocked || paintDisabled) {
          return;
        }

        const point = getGridPointFromClient(event.clientX, event.clientY);
        if (!point) {
          setBrushCursorPoint(null);
          return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        setBrushCursorPoint({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }}
      onPointerDown={(event) => {
        if (!mainBrushToolActive || coarsePointer || interactionLocked || paintDisabled) {
          return;
        }

        const point = getGridPointFromClient(event.clientX, event.clientY);
        if (!point) {
          setBrushCursorPoint(null);
          return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        setBrushCursorPoint({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }}
      onPointerLeave={() => {
        setBrushCursorPoint(null);
      }}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor:
          interactionLocked
            ? "default"
            : brushCursorVisible
              ? "none"
              : selectionCursor ?? cursor,
        touchAction: interactionLocked ? "auto" : "none",
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

        <SelectionOverlay
          activeTool={activeTool}
          duplicatePlacement={
            duplicatePlacement
              ? {
                  session: duplicatePlacement,
                  offsetCells: duplicatePlacementOffset,
                }
              : null
          }
          metrics={metrics}
          mirrorInteraction={mirrorInteraction}
          selection={selection}
          viewport={viewport}
        />

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
              dispatch={dispatch}
              getWorldPointFromClient={getWorldPointFromClient}
              imageOpacity={traceImageOpacity}
              metrics={metrics}
              positioningEnabled={tracePositioningEnabled}
              portalHost={stageRef.current}
              stageBounds={stageBounds}
              trace={effectiveTrace ?? trace}
              traceAsset={
                loadedTraceAsset?.previewUrl === trace.previewUrl
                  ? loadedTraceAsset
                  : null
              }
              cropEditing={traceCropActive}
              cropAspectRatio={traceCropAspectRatio}
              cropBase={traceCropBase}
              onCropPreviewChange={onTraceCropPreviewChange}
              eraserBrushSize={traceEraserBrushSize}
              eraserBrushPreviewVisible={traceEraserBrushPreviewVisible}
              eraserEditing={traceEraserActive}
              eraserMaskUrl={traceEraserMaskUrl}
              eraserDraftRevision={traceEraserDraftRevision}
              eraserEditMode={traceEraserEditMode}
              eraserMode={traceEraserMode}
              onEraserDraftChange={onTraceEraserDraftChange}
              traceDisplayOverride={traceDisplayOverride}
              touchSnappingEnabled={touchSnappingEnabled}
              viewport={viewport as ViewportState}
              worldBounds={worldBounds}
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
              colorLibraryDismissGestureRef={colorLibraryDismissGestureRef}
              colorsById={colorsById}
              deferPaintUntilTraceReady={deferPaintUntilTraceReady}
              displayHost={displayHost}
              highlightedColorId={highlightedColorId}
              onDisplayRendered={handleDisplayRendered}
              displayTraceAsset={
                trace && loadedTraceAsset?.previewUrl === trace.previewUrl
                  ? loadedTraceAsset
                  : null
              }
              displayTraceOverride={traceDisplayOverride}
              paintOpacity={gridOpacity}
              previewMode={previewMode}
              displayTrace={showDisplayTrace ? effectiveTrace : null}
              frameOrigin={frameOrigin}
              getGridPointFromClient={getGridPointFromClient}
              getSelectionPointFromClient={getSelectionPointFromClient}
              gridWidth={grid.width}
              handleHover={handleHover}
              handlePointerDown={handlePointerDown}
              handlePointerEnter={handlePointerEnter}
              interactionEnabled={!interactionLocked && !paintDisabled}
              cancelPaintStroke={cancelPaintStroke}
              gridOverlayStep={gridOverlayStep}
              metrics={metrics}
              showGridlines={effectiveShowGridlines}
              showSymbols={effectiveShowSymbols}
              stageSize={stageSize}
              symbolAssignments={state.document.palette.symbolAssignments}
              threadView={threadView}
              viewport={viewport}
              isZoomInteractionActive={isZoomInteracting}
            />
          </div>

          {textPlacement ? (
            <TextPlacementLayer
              dispatch={dispatch}
              getWorldPointFromClient={getWorldPointFromClient}
              metrics={metrics}
              placement={textPlacement}
              portalHost={stageRef.current}
              previewColor={textPreviewColor}
              stageBounds={stageBounds}
              touchSnappingEnabled={touchSnappingEnabled}
              viewport={viewport}
              worldBounds={worldBounds}
              zoom={viewport.zoom}
            />
          ) : null}

          {iconPlacement ? (
            <IconPlacementLayer
              dispatch={dispatch}
              eraserBrushPreviewVisible={iconEraserBrushPreviewVisible}
              eraserBrushSize={iconEraserBrushSize}
              eraserDraftRevision={iconEraserDraftRevision}
              eraserEditing={iconEraserEditing}
              eraserMaskUrl={iconEraserMaskUrl}
              eraserEditMode={iconEraserEditMode}
              eraserMode={iconEraserMode}
              getWorldPointFromClient={getWorldPointFromClient}
              metrics={metrics}
              onEraserDraftChange={onIconEraserDraftChange}
              paletteById={colorsById}
              placement={iconPlacement}
              portalHost={stageRef.current}
              previewColor={textPreviewColor}
              stageBounds={stageBounds}
              touchSnappingEnabled={touchSnappingEnabled}
              viewport={viewport}
              worldBounds={worldBounds}
              zoom={viewport.zoom}
            />
          ) : null}

          {duplicatePlacement ? (
            <DuplicatePlacementLayer
              colorsById={colorsById}
              dispatch={dispatch}
              getWorldPointFromClient={getWorldPointFromClient}
              metrics={metrics}
              offsetCells={duplicatePlacementOffset}
              onOffsetCellsChange={setDuplicatePlacementOffset}
              portalHost={stageRef.current}
              session={duplicatePlacement}
              stageBounds={stageBounds}
              viewport={viewport}
              worldBounds={worldBounds}
            />
          ) : null}
        </div>
      </div>
      {brushCursorVisible ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${brushCursorPoint.x}px`,
            top: `${brushCursorPoint.y}px`,
            width: `${brushCursorSize}px`,
            height: `${brushCursorSize}px`,
            transform: "translate(-50%, -50%)",
            border: "1.5px solid rgba(255, 255, 255, 0.96)",
            boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.42)",
            background: "rgba(255, 255, 255, 0.08)",
            pointerEvents: "none",
            zIndex: 6,
          }}
        />
      ) : null}
      {centeredBrushPreviewVisible ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${brushCursorSize}px`,
            height: `${brushCursorSize}px`,
            transform: "translate(-50%, -50%)",
            border: "2px solid rgba(255, 255, 255, 0.98)",
            boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.52)",
            background: "rgba(255, 255, 255, 0.12)",
            pointerEvents: "none",
            zIndex: 7,
          }}
        />
      ) : null}
    </div>
  );
}

async function loadTraceAssetBundle(
  previewUrl: string,
  maskUrl: string | null,
): Promise<LoadedTraceAsset> {
  try {
    const image = await loadCanvasImage(previewUrl);
    const mask = maskUrl
      ? await loadCanvasImage(maskUrl).catch(() => null)
      : null;

    return {
      previewUrl,
      height: image.naturalHeight,
      image,
      mask: mask
        ? {
            url: maskUrl!,
            width: mask.naturalWidth,
            height: mask.naturalHeight,
            image: mask,
          }
        : null,
      ready: image.naturalWidth > 0 && image.naturalHeight > 0,
      width: image.naturalWidth,
    };
  } catch {
    return {
      previewUrl,
      height: 0,
      image: null,
      mask: null,
      ready: false,
      width: 0,
    };
  }
}

async function loadCanvasImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";

  if (/^https?:\/\//i.test(url)) {
    image.crossOrigin = "anonymous";
  }

  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${url}`));
    image.src = url;

    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      resolve(image);
    }
  });
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

function getDefaultDuplicatePlacementOffset(
  rect: { x: number; y: number; width: number; height: number },
  gridWidth: number,
  gridHeight: number,
): { x: number; y: number } {
  void gridHeight;
  const gapCells = 1;
  const roomRight = Math.max(0, gridWidth - (rect.x + rect.width));
  const roomLeft = Math.max(0, rect.x);

  const candidates = [
    {
      direction: "right",
      room: roomRight,
      fits: roomRight >= rect.width + gapCells,
      offset: {
        x: Math.min(rect.width + gapCells, roomRight),
        y: 0,
      },
    },
    {
      direction: "left",
      room: roomLeft,
      fits: roomLeft >= rect.width + gapCells,
      offset: {
        x: -Math.min(rect.width + gapCells, roomLeft),
        y: 0,
      },
    },
  ];

  candidates.sort((a, b) => {
    if (a.fits !== b.fits) {
      return a.fits ? -1 : 1;
    }

    if (a.room !== b.room) {
      return b.room - a.room;
    }

    return 0;
  });

  return candidates[0]?.offset ?? { x: 0, y: 0 };
}
