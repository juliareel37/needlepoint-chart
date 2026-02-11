"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { Color } from "../../lib/grid";
import { makeGrid } from "../../lib/grid";
import { DMC_COLORS } from "../../lib/dmcColors";
import { assetPath } from "../../lib/assetPath";
import { CanvasWithExportRef } from "./canvas/CanvasWithExportRef";
import { EXPORT_CELL_SIZE } from "./utils/constants";
import { extractPaletteFromImage, rgbToOklab } from "./utils/colorUtils";
import { convertImageToPattern as buildImageToPattern } from "./utils/imageToPattern";
import { type FilterRect } from "./utils/geometry";
import { PaletteSection } from "./sections/PaletteSection";
import { UsedColorsSection } from "./sections/UsedColorsSection";
import { DraftPickerDialog } from "./dialogs/DraftPickerDialog";
import { VersionHistoryDialog } from "./dialogs/VersionHistoryDialog";
import { VersionPreviewToast } from "./dialogs/VersionPreviewToast";
import { ConfirmDialog } from "./dialogs/ConfirmDialog";
import { WipCard } from "./cards/WipCard";
import { GridSizeCard } from "./cards/GridSizeCard";
import { TraceImageCard } from "./cards/TraceImageCard";
import { ImageToPatternCard } from "./cards/ImageToPatternCard";
import { useCanvasEdits } from "./hooks/useCanvasEdits";
import { useColorEdits } from "./hooks/useColorEdits";
import { useHistoryStack } from "./hooks/useHistoryStack";
import { useWipDrafts } from "./hooks/useWipDrafts";

const DEFAULT_PALETTE: Color[] = DMC_COLORS;

export default function PatternEditor() {
  const [title, setTitle] = useState("Untitled Pattern");
  const [isNarrow, setIsNarrow] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const { isSignedIn: clerkSignedIn } = useAuth();
  const isSignedIn = Boolean(clerkSignedIn);

  const [gridW, setGridW] = useState(112);
  const [gridH, setGridH] = useState(140);
  const [grid, setGrid] = useState<Uint16Array>(() => makeGrid(gridW, gridH, 0));
  const { history, future, setHistoryState, setFutureState, pushHistory, pushFuture, popHistory, popFuture } =
    useHistoryStack();
  const [tool, setTool] = useState<"none" | "paint" | "eraser" | "fill" | "eyedropper" | "lasso">("none");
  const [brushSize, setBrushSize] = useState(1);
  const [gridMode, setGridMode] = useState<"stitches" | "inches">("stitches");
  const [meshCount, setMeshCount] = useState(10);
  const [widthIn, setWidthIn] = useState(11.2);
  const [heightIn, setHeightIn] = useState(14);
  const [draftGridMode, setDraftGridMode] = useState<"stitches" | "inches">(gridMode);
  const [draftGridW, setDraftGridW] = useState(gridW);
  const [draftGridH, setDraftGridH] = useState(gridH);
  const [draftMeshCount, setDraftMeshCount] = useState(meshCount);
  const [draftWidthIn, setDraftWidthIn] = useState(widthIn);
  const [draftHeightIn, setDraftHeightIn] = useState(heightIn);
  const [threadView, setThreadView] = useState(false);
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    position?: { top: number; left: number } | null;
  } | null>(null);
  const [gridOpen, setGridOpen] = useState(false);
  const [wipOpen, setWipOpen] = useState(true);
  const [traceOpen, setTraceOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [usedColorsOpen, setUsedColorsOpen] = useState(false);
  const [imageToPatternOpen, setImageToPatternOpen] = useState(false);
  const [traceImageUrl, setTraceImageUrl] = useState<string | null>(null);
  const [traceFileName, setTraceFileName] = useState<string | null>(null);
  const [traceImage, setTraceImage] = useState<HTMLImageElement | null>(null);
  const [traceOpacity, setTraceOpacity] = useState(0.6);
  const [traceScale, setTraceScale] = useState(1);
  const [traceOffsetX, setTraceOffsetX] = useState(0);
  const [traceOffsetY, setTraceOffsetY] = useState(0);
  const [traceLocked, setTraceLocked] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const traceUrlRef = useRef<string | null>(null);
  const traceInputRef = useRef<HTMLInputElement | null>(null);
  const traceSampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [palette, setPalette] = useState<Color[]>(DEFAULT_PALETTE);
  const [extractedPaletteIds, setExtractedPaletteIds] = useState<number[]>([]);
  const paletteById = useMemo(() => new Map(palette.map((c) => [c.id, c])), [palette]);
  const extractedIds = useMemo(
    () => extractedPaletteIds.filter((id) => paletteById.has(id)),
    [extractedPaletteIds, paletteById]
  );

  const [activeColorId, setActiveColorId] = useState<number>(DEFAULT_PALETTE[3].id);
  const [extractPaletteSize, setExtractPaletteSize] = useState(12);
  const [extractingPalette, setExtractingPalette] = useState(false);
  const [extractPaletteOpen, setExtractPaletteOpen] = useState(false);
  const [convertMaxColors, setConvertMaxColors] = useState(20);
  const [convertSmoothing, setConvertSmoothing] = useState(0.25);
  const [lastEditCell, setLastEditCell] = useState<{ x: number; y: number } | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmActionRef = useRef<(() => void) | null>(null);

  const [zoom, setZoom] = useState(1);
  const [canvasControlsHeight, setCanvasControlsHeight] = useState(0);
  const baseMinZoom = 0.25;
  const [minZoomOverride, setMinZoomOverride] = useState<number | null>(null);
  const minZoom = Math.max(0.05, Math.min(baseMinZoom, minZoomOverride ?? baseMinZoom));
  const maxZoom = isNarrow ? 12 : 8;
  const [showGridlines, setShowGridlines] = useState(true);
  const [fitAfterResize, setFitAfterResize] = useState<{ w: number; h: number } | null>(null);
  const [fitToken, setFitToken] = useState(0);

  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const [canvasAreaWidth, setCanvasAreaWidth] = useState(0);

  useEffect(() => {
    if (isNarrow) {
      // setCanvasSettingsOpen(false);
      // setPaletteOpen(false);
    }
  }, [isNarrow]);

  useEffect(() => {
    if (!traceImageUrl) {
      setTraceImage(null);
      setTraceFileName(null);
      setTraceOpacity(0);
      return;
    }
    const img = new Image();
    img.onload = () => setTraceImage(img);
    img.src = traceImageUrl;
    return () => {
      setTraceImage(null);
    };
  }, [traceImageUrl]);



  useEffect(() => {
    return () => {
      if (traceUrlRef.current) {
        URL.revokeObjectURL(traceUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasAreaWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const narrowQuery = window.matchMedia("(max-width: 900px)");
    const compactQuery = window.matchMedia("(max-width: 640px)");

    const handleChange = () => {
      setIsNarrow(narrowQuery.matches);
      setIsCompact(compactQuery.matches);
    };

    handleChange();
    narrowQuery.addEventListener("change", handleChange);
    compactQuery.addEventListener("change", handleChange);
    return () => {
      narrowQuery.removeEventListener("change", handleChange);
      compactQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const sidebarWidth = 240;
  const canvasCardPadding = 12;
  const canvasInnerWidth = Math.max(1, canvasAreaWidth - canvasCardPadding * 2);

  const fitCellSize = useMemo(() => {
    if (canvasInnerWidth <= 0) return 1;
    return Math.max(1, canvasInnerWidth / gridW);
  }, [canvasInnerWidth, gridW]);

  const prevFitCellSizeRef = useRef(fitCellSize);

  const displayCellSize = useMemo(() => {
    return Math.max(1, Number((fitCellSize * zoom).toFixed(2)));
  }, [fitCellSize, zoom]);

  const containerWidth = Math.max(1, canvasInnerWidth);
  const containerHeight = Math.max(1, Math.round((containerWidth * gridH) / gridW));
  const canvasW = gridW * displayCellSize;
  const canvasH = gridH * displayCellSize;

  const {
    lassoPoints,
    lassoClosed,
    filterMode,
    filterSelecting,
    activeFilterRect,
    isIndexInFilter,
    setFilterRect,
    startFilterSelection,
    clearFilterSelection,
    endFilterSelection,
    addLassoPoint,
    resetLasso,
    closeLasso,
    fillLasso,
    onPaintCell,
    onFillCells,
    onFillGrid,
    beginStroke,
    endStroke,
    undo,
    redo,
    clearGrid,
    confirmAndApplyGrid,
    toggleTraceLock,
    setTraceLockedState,
    bumpStrokeVersion,
    updateGrid,
  } = useCanvasEdits({
    tool,
    grid,
    gridW,
    gridH,
    setGrid,
    setGridW,
    setGridH,
    gridMode,
    setGridMode,
    meshCount,
    setMeshCount,
    widthIn,
    setWidthIn,
    heightIn,
    setHeightIn,
    draftGridMode,
    draftGridW,
    draftGridH,
    draftMeshCount,
    draftWidthIn,
    draftHeightIn,
    activeColorId,
    displayCellSize,
    pushHistory,
    pushFuture,
    popHistory,
    popFuture,
    setFutureState,
    setLastEditCell,
    confirmActionRef,
    setConfirmDialog,
    clearButtonRef,
    traceImage,
    traceLocked,
    setTraceLocked,
  });

  const {
    remapMode,
    remapSourceId,
    remapTargetId,
    identifyColorId,
    mergeMode,
    mergeSelectedIds,
    mergeTargetId,
    deleteMode,
    deleteSelectedIds,
    symbolMap,
    usedColors,
    usedColorIds,
    setRemapMode,
    setRemapSourceId,
    setRemapTargetId,
    setIdentifyColorId,
    setMergeMode,
    setMergeSelectedIds,
    setMergeTargetId,
    setDeleteMode,
    setDeleteSelectedIds,
    beginRemap,
    previewRemap,
    cancelRemap,
    cancelMerge,
    cancelDelete,
    toggleRemapMode,
    toggleMergeMode,
    toggleDeleteMode,
    confirmRemap,
    confirmMerge,
    confirmDeleteColors,
  } = useColorEdits({
    grid,
    gridW,
    gridH,
    paletteById,
    activeColorId,
    setActiveColorId,
    activeFilterRect,
    isIndexInFilter,
    setGrid,
    bumpStrokeVersion,
    pushHistory,
    setFutureState,
    setLastEditCell,
  });

  const {
    wipStatus,
    lastAutosaveAt,
    currentDraftId,
    draftPickerOpen,
    draftPickerLoading,
    draftPickerItems,
    draftPreviewUrls,
    versionHistoryOpen,
    versionHistoryLoading,
    versionHistoryItems,
    versionPreview,
    draftInputRef,
    capturePendingDraft,
    loadDraftFile,
    loadWip,
    openVersionHistory,
    selectDraft,
    requestDeleteDraft,
    closeDraftPicker,
    closeVersionHistory,
    viewVersion,
    restoreVersion,
    cancelVersionPreview,
    startNewWip,
    formatDraftDate,
  } = useWipDrafts({
    isSignedIn,
    title,
    setTitle,
    gridW,
    setGridW,
    gridH,
    setGridH,
    grid,
    setGrid,
    gridMode,
    setGridMode,
    meshCount,
    setMeshCount,
    widthIn,
    setWidthIn,
    heightIn,
    setHeightIn,
    traceImageUrl,
    setTraceImageUrl,
    traceOpacity,
    setTraceOpacity,
    traceScale,
    setTraceScale,
    traceOffsetX,
    setTraceOffsetX,
    traceOffsetY,
    setTraceOffsetY,
    traceLocked,
    setTraceLocked,
    traceImage,
    setTraceImage,
    traceFileName,
    setTraceFileName,
    traceUrlRef,
    setDraftGridMode,
    setDraftGridW,
    setDraftGridH,
    setDraftMeshCount,
    setDraftWidthIn,
    setDraftHeightIn,
    setHistoryState,
    setFutureState,
    setRemapSourceId,
    setRemapTargetId,
    paletteById,
    confirmActionRef,
    setConfirmDialog,
  });

  useEffect(() => {
    if (!traceImage) {
      prevFitCellSizeRef.current = fitCellSize;
      return;
    }
    const prev = prevFitCellSizeRef.current;
    if (prev > 0 && fitCellSize > 0 && prev !== fitCellSize) {
      const ratio = fitCellSize / prev;
      setTraceScale((value) => value * ratio);
      setTraceOffsetX((value) => value * ratio);
      setTraceOffsetY((value) => value * ratio);
    }
    prevFitCellSizeRef.current = fitCellSize;
  }, [fitCellSize, traceImage]);

  function clampZoom(value: number) {
    return Math.min(maxZoom, Math.max(minZoom, Number(value.toFixed(2))));
  }

  function fitTraceToGrid() {
    if (!traceImage) return;
    const baseCanvasW = gridW * fitCellSize;
    const baseCanvasH = gridH * fitCellSize;
    const scale = Math.min(baseCanvasW / traceImage.width, baseCanvasH / traceImage.height);
    setTraceScale(scale);
    setTraceOffsetX((baseCanvasW - traceImage.width * scale) / 2);
    setTraceOffsetY((baseCanvasH - traceImage.height * scale) / 2);
  }

  function convertImageToPattern() {
    if (!traceImage) return;
    const result = buildImageToPattern({
      traceImage,
      fitCellSize,
      traceScale,
      traceOffsetX,
      traceOffsetY,
      palette,
      maxColors: convertMaxColors,
      smoothing: convertSmoothing,
      gridW,
      gridH,
      sampleCanvas: traceSampleCanvasRef.current,
    });
    if (!result) return;
    traceSampleCanvasRef.current = result.sampleCanvas;
    updateGrid(() => result.grid);
  }

  function handleTraceFileSelected(file: File) {
    if (traceUrlRef.current) {
      URL.revokeObjectURL(traceUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    traceUrlRef.current = url;
    setTraceImageUrl(url);
    setTraceFileName(file.name);
    setTraceLocked(false);
    setTraceOpacity(0.5);
  }

  function clearTraceImage() {
    setTraceImageUrl(null);
    setTraceFileName(null);
    setTraceImage(null);
    setTraceOpacity(0);
    setTraceLocked(false);
    if (traceUrlRef.current) {
      URL.revokeObjectURL(traceUrlRef.current);
      traceUrlRef.current = null;
    }
  }

  useEffect(() => {
    if (meshCount <= 0) return;
    if (gridMode !== "stitches") return;
    setWidthIn(Number((gridW / meshCount).toFixed(2)));
    setHeightIn(Number((gridH / meshCount).toFixed(2)));
  }, [gridW, gridH, meshCount, gridMode]);

  useEffect(() => {
    setDraftGridMode(gridMode);
    setDraftGridW(gridW);
    setDraftGridH(gridH);
    setDraftMeshCount(meshCount);
    setDraftWidthIn(widthIn);
    setDraftHeightIn(heightIn);
  }, [gridMode, gridW, gridH, meshCount, widthIn, heightIn]);
  useEffect(() => {
    if (!fitAfterResize) return;
    if (gridW !== fitAfterResize.w || gridH !== fitAfterResize.h) {
      setFitToken((token) => token + 1);
      setFitAfterResize(null);
    }
  }, [fitAfterResize, gridW, gridH]);
  useEffect(() => {
    if (!fitAfterResize) return;
    if (confirmDialog === null && gridW === fitAfterResize.w && gridH === fitAfterResize.h) {
      setFitAfterResize(null);
    }
  }, [confirmDialog, fitAfterResize, gridW, gridH]);

  function addColor(name: string, hex: string) {
    setPalette((prev) => {
      const nextId = prev.reduce((m, c) => Math.max(m, c.id), 0) + 1;
      return [...prev, { id: nextId, name, hex, family: "Custom" }];
    });
  }

  async function extractPaletteFromTrace() {
    if (!traceImage || extractingPalette) return;
    const targetSize = Math.max(2, Math.min(32, Math.floor(extractPaletteSize)));
    setExtractingPalette(true);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const hexes = extractPaletteFromImage(traceImage, targetSize);
    setExtractingPalette(false);
    if (hexes.length === 0) return;
    const toRgb = (hex: string) => {
      const clean = hex.replace("#", "");
      if (clean.length !== 6) return null;
      const r = parseInt(clean.slice(0, 2), 16) / 255;
      const g = parseInt(clean.slice(2, 4), 16) / 255;
      const b = parseInt(clean.slice(4, 6), 16) / 255;
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
      return { r, g, b };
    };

    const paletteLabs = palette
      .map((c) => {
        const rgb = toRgb(c.hex);
        if (!rgb) return null;
        const lab = rgbToOklab(rgb.r, rgb.g, rgb.b);
        return { id: c.id, L: lab.L, A: lab.A, B: lab.B };
      })
      .filter((entry): entry is { id: number; L: number; A: number; B: number } => Boolean(entry));

    const picked: number[] = [];
    const seen = new Set<number>();
    for (const hex of hexes) {
      const rgb = toRgb(hex);
      if (!rgb) continue;
      const lab = rgbToOklab(rgb.r, rgb.g, rgb.b);
      let bestId: number | null = null;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const candidate of paletteLabs) {
        if (seen.has(candidate.id)) continue;
        const dx = lab.L - candidate.L;
        const dy = lab.A - candidate.A;
        const dz = lab.B - candidate.B;
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < bestDist) {
          bestDist = dist;
          bestId = candidate.id;
        }
      }
      if (bestId == null) continue;
      seen.add(bestId);
      picked.push(bestId);
    }

    if (picked.length === 0) return;
    setExtractedPaletteIds(picked);
    setActiveColorId(picked[0]);
  }

  const cardShadow = "0 6px 16px rgba(15, 23, 42, 0.12)";
  const cardShadowCollapsed = "0 3px 10px rgba(15, 23, 42, 0.08)";
  const cardStyle = {
    background: "var(--card-bg)",
    border: "none",
    borderRadius: 12,
    padding: 12,
    boxShadow: cardShadow,
  } as const;
  const canvasSettingsOffset = 56;

  const collapseStyle = (open: boolean, maxHeight = 1200) =>
    ({
      minHeight: 0,
      maxHeight: open ? maxHeight : 0,
      opacity: open ? 1 : 0,
      transform: open ? "translateY(0)" : "translateY(-4px)",
      overflow: open ? "visible" : "hidden",
      transition: "max-height 220ms ease, opacity 180ms ease, transform 180ms ease",
      pointerEvents: open ? "auto" : "none",
    }) as const;

  return (
      <div
        className="pattern-editor"
        style={{ display: "grid", gap: 12, padding: 0, width: "100%", maxWidth: "100%", margin: "0 auto" }}
      >
      <div
        className="pattern-main"
        style={{
          display: "grid",
          columnGap: 12,
          rowGap: 16,
          alignItems: "start",
          width: "100%",
          minWidth: 0,
          gridTemplateColumns: isNarrow ? "1fr" : `${sidebarWidth}px minmax(0, 1fr)`,
        }}
      >
        <div
          className="pattern-sidebar"
          style={{
            display: "grid",
            gap: 16,
            alignContent: "start",
            width: "100%",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              src={assetPath("/wippa_logo.png")}
              alt="Wippa"
              style={{ height: 92, width: "auto", display: "block" }}
            />
          </div>
          <WipCard
            cardStyle={cardStyle}
            cardShadow={cardShadow}
            cardShadowCollapsed={cardShadowCollapsed}
            wipOpen={wipOpen}
            setWipOpen={setWipOpen}
            collapseStyle={collapseStyle}
            title={title}
            onTitleChange={(value) => setTitle(value)}
            isSignedIn={isSignedIn}
            onCapturePendingDraft={() => {
              void capturePendingDraft();
            }}
            onStartNewWip={startNewWip}
            onLoadWip={loadWip}
            onOpenVersionHistory={openVersionHistory}
            draftInputRef={draftInputRef}
            onDraftFileSelected={loadDraftFile}
            lastAutosaveAt={lastAutosaveAt}
            exportCanvasRef={exportCanvasRef}
            usedColors={usedColors}
            grid={grid}
            paletteById={paletteById}
            symbolMap={symbolMap}
            gridW={gridW}
            gridH={gridH}
            exportCellSize={EXPORT_CELL_SIZE}
          />
          <GridSizeCard
            cardStyle={cardStyle}
            cardShadow={cardShadow}
            cardShadowCollapsed={cardShadowCollapsed}
            gridOpen={gridOpen}
            setGridOpen={setGridOpen}
            collapseStyle={collapseStyle}
            draftGridMode={draftGridMode}
            setDraftGridMode={setDraftGridMode}
            draftGridW={draftGridW}
            setDraftGridW={setDraftGridW}
            draftGridH={draftGridH}
            setDraftGridH={setDraftGridH}
            draftWidthIn={draftWidthIn}
            setDraftWidthIn={setDraftWidthIn}
            draftHeightIn={draftHeightIn}
            setDraftHeightIn={setDraftHeightIn}
            draftMeshCount={draftMeshCount}
            setDraftMeshCount={setDraftMeshCount}
            onApply={() => {
              setFitAfterResize({ w: gridW, h: gridH });
              confirmAndApplyGrid();
            }}
          />

          <TraceImageCard
            cardStyle={cardStyle}
            cardShadow={cardShadow}
            cardShadowCollapsed={cardShadowCollapsed}
            traceOpen={traceOpen}
            setTraceOpen={setTraceOpen}
            collapseStyle={collapseStyle}
            traceInputRef={traceInputRef}
            traceFileName={traceFileName}
            traceImage={traceImage}
            traceLocked={traceLocked}
            onTraceFileSelected={handleTraceFileSelected}
            onFitToGrid={fitTraceToGrid}
            onClearTrace={clearTraceImage}
            onSetTraceLockedState={setTraceLockedState}
          />

          <ImageToPatternCard
            cardStyle={cardStyle}
            cardShadow={cardShadow}
            cardShadowCollapsed={cardShadowCollapsed}
            imageToPatternOpen={imageToPatternOpen}
            setImageToPatternOpen={setImageToPatternOpen}
            collapseStyle={collapseStyle}
            traceImage={traceImage}
            convertMaxColors={convertMaxColors}
            setConvertMaxColors={setConvertMaxColors}
            convertSmoothing={convertSmoothing}
            setConvertSmoothing={setConvertSmoothing}
            onConvert={convertImageToPattern}
          />
          <PaletteSection
            cardStyle={cardStyle}
            cardShadow={cardShadow}
            cardShadowCollapsed={cardShadowCollapsed}
            paletteOpen={paletteOpen}
            setPaletteOpen={setPaletteOpen}
            collapseStyle={collapseStyle}
            traceImage={traceImage}
            extractPaletteOpen={extractPaletteOpen}
            setExtractPaletteOpen={setExtractPaletteOpen}
            extractPaletteSize={extractPaletteSize}
            setExtractPaletteSize={setExtractPaletteSize}
            extractPaletteFromTrace={extractPaletteFromTrace}
            extractingPalette={extractingPalette}
            palette={palette}
            extractedIds={extractedIds}
            usedColorIds={usedColorIds}
            activeColorId={activeColorId}
            remapTargetId={remapTargetId}
            remapSourceId={remapSourceId}
            onSelectActive={setActiveColorId}
            onRemapSelect={previewRemap}
            onAddColor={addColor}
          />
          <UsedColorsSection
            cardStyle={cardStyle}
            cardShadow={cardShadow}
            cardShadowCollapsed={cardShadowCollapsed}
            usedColorsOpen={usedColorsOpen}
            setUsedColorsOpen={setUsedColorsOpen}
            collapseStyle={collapseStyle}
            usedColors={usedColors}
            usedColorIds={usedColorIds}
            remapMode={remapMode}
            mergeMode={mergeMode}
            deleteMode={deleteMode}
            toggleRemapMode={toggleRemapMode}
            toggleMergeMode={toggleMergeMode}
            toggleDeleteMode={toggleDeleteMode}
            filterMode={filterMode}
            filterSelecting={filterSelecting}
            startFilterSelection={startFilterSelection}
            clearFilterSelection={clearFilterSelection}
            deleteSelectedIds={deleteSelectedIds}
            mergeSelectedIds={mergeSelectedIds}
            mergeTargetId={mergeTargetId}
            remapSourceId={remapSourceId}
            remapTargetId={remapTargetId}
            identifyColorId={identifyColorId}
            showSymbols={showSymbols}
            symbolMap={symbolMap}
            setIdentifyColorId={setIdentifyColorId}
            setActiveColorId={setActiveColorId}
            setDeleteSelectedIds={setDeleteSelectedIds}
            setMergeSelectedIds={setMergeSelectedIds}
            setMergeTargetId={setMergeTargetId}
            beginRemap={beginRemap}
            previewRemap={previewRemap}
            confirmRemap={confirmRemap}
            confirmMerge={confirmMerge}
            confirmDeleteColors={confirmDeleteColors}
            cancelRemap={cancelRemap}
            cancelMerge={cancelMerge}
            cancelDelete={cancelDelete}
            setRemapMode={setRemapMode}
            setMergeMode={setMergeMode}
            setDeleteMode={setDeleteMode}
          />

        </div>

        <div
          className="pattern-canvas-shell"
          style={{ minWidth: 0, paddingInline: "var(--canvas-shell-padding, 12px)" }}
        >
          {isNarrow && <div style={{ marginTop: canvasSettingsOffset, marginBottom: 16 }} />}
          {/* Canvas area */}
          <div
            ref={canvasAreaRef}
            className="pattern-canvas-area"
            style={{
              minWidth: 0,
              flex: "1 1 0",
              paddingBottom: isNarrow ? 0 : undefined,
            }}
          >
            <CanvasWithExportRef
              exportCanvasRef={exportCanvasRef}
              title={title}
              usedColors={usedColors}
              width={gridW}
              height={gridH}
              grid={grid}
              paletteById={paletteById}
              activeColorId={activeColorId}
              cellSize={displayCellSize}
              containerWidth={containerWidth}
              containerHeight={containerHeight}
              showGridlines={showGridlines}
              tool={tool}
              onToolChange={(nextTool: "paint" | "eraser" | "fill" | "eyedropper" | "lasso") => {
                setTool(nextTool);
                setPanMode(false);
              }}
              brushSize={brushSize}
              onBrushSizeChange={(value: number) => setBrushSize(value)}
              lassoPoints={lassoPoints}
              lassoClosed={lassoClosed}
              onPickColor={setActiveColorId}
              onPickColorComplete={() => {
                setTool("paint");
                setPanMode(false);
              }}
              onLassoReset={resetLasso}
              onLassoPoint={addLassoPoint}
              onLassoClose={closeLasso}
              onLassoFill={fillLasso}
              onStrokeStart={beginStroke}
              onStrokeEnd={endStroke}
              onPaintCell={onPaintCell}
              onFillCells={onFillCells}
              onFillGrid={onFillGrid}
              threadView={threadView}
              onTogglePanMode={() => setPanMode((value) => !value)}
              traceImage={traceImage}
              traceImageUrl={traceImageUrl}
              traceOpacity={traceOpacity}
              traceScale={traceScale}
              traceOffsetX={traceOffsetX}
              traceOffsetY={traceOffsetY}
              traceAdjustMode={!traceLocked}
              onTraceOffsetChange={(x: React.SetStateAction<number>, y: React.SetStateAction<number>) => {
                setTraceOffsetX(x);
                setTraceOffsetY(y);
              }}
              onTraceScaleChange={(value: number) => setTraceScale(value)}
              panMode={panMode}
              onUndo={undo}
              onRedo={redo}
              onClear={clearGrid}
              clearButtonRef={clearButtonRef}
              canUndo={history.length > 0}
              canRedo={future.length > 0}
              lastEditCell={lastEditCell}
              zoom={zoom}
              minZoom={minZoom}
              maxZoom={maxZoom}
              pinchEnabled={isNarrow}
              onZoomChange={(next: number) => setZoom(clampZoom(next))}
              darkCanvas={darkCanvas}
              onControlsHeightChange={setCanvasControlsHeight}
              onMinZoomChange={setMinZoomOverride}
              fitToBoundsToken={fitToken}
              showSymbols={showSymbols}
              setShowSymbols={setShowSymbols}
              identifyColorId={identifyColorId}
              symbolMap={symbolMap}
              filterMode={filterMode}
              filterRect={activeFilterRect}
              filterSelecting={filterSelecting}
              onStartFilterSelection={startFilterSelection}
              onClearFilterSelection={clearFilterSelection}
              onFilterRectChange={(rect: FilterRect | null) => setFilterRect(rect)}
              onFilterSelectEnd={endFilterSelection}
              isNarrow={isNarrow}
              showGridlines={showGridlines}
              setShowGridlines={setShowGridlines}
              threadView={threadView}
              setThreadView={setThreadView}
              traceImage={traceImage}
              traceOpacity={traceOpacity}
              setTraceOpacity={setTraceOpacity}
            />
          </div>
        </div>
      </div>
      <DraftPickerDialog
        open={draftPickerOpen}
        loading={draftPickerLoading}
        items={draftPickerItems}
        previewUrls={draftPreviewUrls}
        onClose={closeDraftPicker}
        onSelect={selectDraft}
        onDelete={requestDeleteDraft}
        formatDraftDate={formatDraftDate}
      />
      <VersionHistoryDialog
        open={versionHistoryOpen}
        loading={versionHistoryLoading}
        items={versionHistoryItems}
        currentDraftId={currentDraftId}
        onClose={closeVersionHistory}
        onViewVersion={viewVersion}
        formatDraftDate={formatDraftDate}
      />
      <VersionPreviewToast
        preview={versionPreview}
        onRestore={restoreVersion}
        onCancel={cancelVersionPreview}
        formatDraftDate={formatDraftDate}
      />
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => {
          setConfirmDialog(null);
          confirmActionRef.current?.();
        }}
      />
      {wipStatus && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 80,
            padding: "8px 14px",
            borderRadius: 999,
            background: "var(--card-bg)",
            border: "1px solid rgba(15,23,42,0.12)",
            boxShadow: "0 10px 24px rgba(15,23,42,0.18)",
            color:
              wipStatus.tone === "error"
                ? "#b91c1c"
                : wipStatus.tone === "success"
                  ? "var(--accent-strong)"
                  : "var(--foreground)",
            fontSize: 12,
            fontWeight: 600,
          }}
          role="status"
          aria-live="polite"
        >
          {wipStatus.message}
        </div>
      )}
    </div>
  );
}
