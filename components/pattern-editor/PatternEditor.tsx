"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import ExportPdfButton from "./cards/ExportPdfButton";
import { useCanvasEdits } from "./hooks/useCanvasEdits";
import { useColorEdits } from "./hooks/useColorEdits";
import { useHistoryStack } from "./hooks/useHistoryStack";
import { useWipDrafts } from "./hooks/useWipDrafts";
import type { TraceSnapshot } from "./utils/historyTypes";

const DEFAULT_PALETTE: Color[] = DMC_COLORS;
const TRACE_DEBUG_KEY = "wippa:debugTrace";

function debugTraceTransform(event: string, details?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(TRACE_DEBUG_KEY) !== "1") return;
  console.info("[wippa trace]", event, {
    ...details,
    at: new Date().toISOString(),
  });
}

export default function PatternEditor() {
  const [title, setTitle] = useState("Untitled Pattern");
  const [isNarrow, setIsNarrow] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isSignedIn: clerkSignedIn, isLoaded: authLoaded } = useAuth();
  const isSignedIn = Boolean(clerkSignedIn);

  const [gridW, setGridW] = useState(112);
  const [gridH, setGridH] = useState(140);
  const [grid, setGrid] = useState<Uint16Array>(() => makeGrid(gridW, gridH, 0));
  const { history, future, setHistoryState, setFutureState, pushHistory, pushFuture, popHistory, popFuture } =
    useHistoryStack();
  const canUndo = history.length > 0;
  const canRedo = future.length > 0;
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
  const [gridOpen, setGridOpen] = useState(true);
  const [wipOpen, setWipOpen] = useState(true);
  const [traceOpen, setTraceOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [usedColorsOpen, setUsedColorsOpen] = useState(true);
  const [imageToPatternOpen, setImageToPatternOpen] = useState(true);
  const [traceImageUrl, setTraceImageUrl] = useState<string | null>(null);
  const [traceFileName, setTraceFileName] = useState<string | null>(null);
  const [traceFileSize, setTraceFileSize] = useState<number | null>(null);
  const [traceImage, setTraceImage] = useState<HTMLImageElement | null>(null);
  const [traceOpacity, setTraceOpacity] = useState(0.6);
  const [traceScale, setTraceScale] = useState(1);
  const [traceOffsetX, setTraceOffsetX] = useState(0);
  const [traceOffsetY, setTraceOffsetY] = useState(0);
  const [traceLocked, setTraceLocked] = useState(false);
  const [tracePostUpload, setTracePostUpload] = useState(false);
  const [traceEditMode, setTraceEditMode] = useState(false);
  const [pendingTraceUnlock, setPendingTraceUnlock] = useState(false);
  const pendingTraceRestoreRef = useRef<TraceSnapshot | null>(null);
  const pendingTraceCellSizeBasisRef = useRef<number | null>(null);
  const traceTransformBasisRef = useRef(1);
  const traceTransformActiveRef = useRef(false);
  const prevTraceTransformRef = useRef<{ scale: number; x: number; y: number; basis: number } | null>(null);
  const [panMode, setPanMode] = useState(false);
  const prevToolRef = useRef<typeof tool>(tool);
  const prevPanModeRef = useRef<boolean>(panMode);
  const [traceUploadState, setTraceUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const tracePreviewObjectUrlRef = useRef<string | null>(null);
  const traceUploadSeqRef = useRef(0);
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
  const [favoriteColorIds, setFavoriteColorIds] = useState<number[]>([]);
  const [extractPaletteSize, setExtractPaletteSize] = useState(12);
  const [extractingPalette, setExtractingPalette] = useState(false);
  const [extractPaletteOpen, setExtractPaletteOpen] = useState(false);
  const [convertMaxColors, setConvertMaxColors] = useState(20);
  const [convertSmoothing, setConvertSmoothing] = useState(0.25);
  const [lastEditCell, setLastEditCell] = useState<{ x: number; y: number } | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmActionRef = useRef<(() => void) | null>(null);

  const buildTraceSnapshot = useCallback(
    (): TraceSnapshot => ({
      imageUrl: traceImageUrl,
      image: traceImage,
      scale: traceScale,
      offsetX: traceOffsetX,
      offsetY: traceOffsetY,
      cellSizeBasis: traceTransformBasisRef.current,
      locked: traceLocked,
      editMode: traceEditMode,
      postUpload: tracePostUpload,
      fileName: traceFileName,
      fileSize: traceFileSize,
    }),
    [
      traceEditMode,
      traceFileName,
      traceFileSize,
      traceImage,
      traceImageUrl,
      traceLocked,
      traceOffsetX,
      traceOffsetY,
      tracePostUpload,
      traceScale,
    ]
  );

  const applyTraceSnapshot = useCallback(
    (snapshot: TraceSnapshot | null | undefined) => {
      if (!snapshot) return;
      const shouldDefer = Boolean(snapshot.imageUrl && snapshot.imageUrl !== traceImageUrl);
      pendingTraceRestoreRef.current = shouldDefer ? snapshot : null;
      setTraceImage(snapshot.image ?? null);
      setTraceImageUrl(snapshot.imageUrl);
      setTraceFileName(snapshot.fileName ?? null);
      setTraceFileSize(snapshot.fileSize ?? null);
      traceTransformBasisRef.current =
        typeof snapshot.cellSizeBasis === "number" && Number.isFinite(snapshot.cellSizeBasis) && snapshot.cellSizeBasis > 0
          ? snapshot.cellSizeBasis
          : traceTransformBasisRef.current > 0
            ? traceTransformBasisRef.current
            : 1;
      setTraceScale(snapshot.scale);
      setTraceOffsetX(snapshot.offsetX);
      setTraceOffsetY(snapshot.offsetY);
      setTraceLocked(snapshot.locked);
    },
    [
      traceImageUrl,
      setTraceFileName,
      setTraceFileSize,
      setTraceImage,
      setTraceImageUrl,
      setTraceLocked,
      setTraceOffsetX,
      setTraceOffsetY,
      setTraceScale,
    ]
  );

  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const canvasPanOffsetRef = useRef({ x: 0, y: 0 });
  const [restoredCanvasPanOffset, setRestoredCanvasPanOffset] = useState<{ x: number; y: number } | null>(null);
  const [restoredCanvasViewToken, setRestoredCanvasViewToken] = useState(0);
  const [resetCanvasViewToken, setResetCanvasViewToken] = useState(0);
  const [canvasControlsHeight, setCanvasControlsHeight] = useState(0);
  const baseMinZoom = 0.25;
  const [minZoomOverride, setMinZoomOverride] = useState<number | null>(null);
  const minZoom = Math.max(0.05, Math.min(baseMinZoom, minZoomOverride ?? baseMinZoom));
  const maxZoom = isNarrow ? 12 : 8;
  const [showGridlines, setShowGridlines] = useState(true);
  const [showRuler, setShowRuler] = useState(true);
  const [fitAfterResize, setFitAfterResize] = useState<{ w: number; h: number } | null>(null);
  const [fitToken, setFitToken] = useState<number | undefined>(undefined);

  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const pendingCanvasFlipRectRef = useRef<DOMRect | null>(null);
  const canvasFlipAnimationRef = useRef<Animation | null>(null);
  const [canvasAreaWidth, setCanvasAreaWidth] = useState(0);
  const [headerActionsNode, setHeaderActionsNode] = useState<HTMLElement | null>(null);
  const [headerTitleNode, setHeaderTitleNode] = useState<HTMLElement | null>(null);
  const [headerFileNode, setHeaderFileNode] = useState<HTMLElement | null>(null);
  const [headerAutosaveNode, setHeaderAutosaveNode] = useState<HTMLElement | null>(null);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isNarrow) {
      setSidebarCollapsed(true);
      // setCanvasSettingsOpen(false);
      // setPaletteOpen(false);
    }
  }, [isNarrow]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const node = document.getElementById("app-header-actions");
    setHeaderActionsNode(node);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const node = document.getElementById("app-header-title");
    setHeaderTitleNode(node);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const node = document.getElementById("app-header-file");
    setHeaderFileNode(node);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const node = document.getElementById("app-header-autosave");
    setHeaderAutosaveNode(node);
  }, []);

  useEffect(() => {
    if (!fileMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!fileMenuRef.current || !target) return;
      if (fileMenuRef.current.contains(target)) return;
      setFileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [fileMenuOpen]);

  useEffect(() => {
    if (!isRenaming) return;
    setDraftTitle(title);
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [isRenaming]);

  function commitRename() {
    setTitle(draftTitle.trim() || "Untitled Pattern");
    setIsRenaming(false);
  }

  function getSafeTraceImageUrl(inputUrl: string) {
    if (inputUrl.startsWith("data:") || inputUrl.startsWith("blob:")) {
      return inputUrl;
    }
    if (typeof window === "undefined") return inputUrl;
    try {
      const parsed = new URL(inputUrl);
      if (parsed.origin === window.location.origin) {
        return inputUrl;
      }
      return `/api/image-proxy?url=${encodeURIComponent(inputUrl)}`;
    } catch {
      return inputUrl;
    }
  }
  useEffect(() => {
    return () => {
      if (tracePreviewObjectUrlRef.current) {
        URL.revokeObjectURL(tracePreviewObjectUrlRef.current);
        tracePreviewObjectUrlRef.current = null;
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

  useLayoutEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const nextWidth = el.getBoundingClientRect().width;
    if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;
    setCanvasAreaWidth((prev) => (Math.abs(prev - nextWidth) < 0.5 ? prev : nextWidth));
  }, [sidebarCollapsed, isNarrow]);

  useLayoutEffect(() => {
    const before = pendingCanvasFlipRectRef.current;
    if (!before) return;
    pendingCanvasFlipRectRef.current = null;
    if (isNarrow) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = canvasAreaRef.current;
    if (!el) return;
    const after = el.getBoundingClientRect();
    const dx = before.left - after.left;
    const dy = before.top - after.top;
    const sx = after.width > 0 ? before.width / after.width : 1;
    const sy = after.height > 0 ? before.height / after.height : 1;
    const hasMotion =
      Math.abs(dx) > 0.5 ||
      Math.abs(dy) > 0.5 ||
      Math.abs(sx - 1) > 0.002 ||
      Math.abs(sy - 1) > 0.002;
    if (!hasMotion) return;
    canvasFlipAnimationRef.current?.cancel();
    canvasFlipAnimationRef.current = el.animate(
      [
        { transformOrigin: "top left", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transformOrigin: "top left", transform: "translate(0px, 0px) scale(1, 1)" },
      ],
      {
        duration: 150,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "both",
      }
    );
    canvasFlipAnimationRef.current.onfinish = () => {
      if (canvasFlipAnimationRef.current) {
        canvasFlipAnimationRef.current = null;
      }
    };
    canvasFlipAnimationRef.current.oncancel = () => {
      if (canvasFlipAnimationRef.current) {
        canvasFlipAnimationRef.current = null;
      }
    };
  }, [sidebarCollapsed, isNarrow]);

  const setSidebarCollapsedWithFlip = useCallback(
    (next: React.SetStateAction<boolean>) => {
      if (!isNarrow) {
        const el = canvasAreaRef.current;
        if (el) {
          pendingCanvasFlipRectRef.current = el.getBoundingClientRect();
        }
      } else {
        pendingCanvasFlipRectRef.current = null;
      }
      setSidebarCollapsed(next);
    },
    [isNarrow]
  );

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

  const sidebarWidth = 260;
  const sidebarCollapsedWidth = 40;
  const sidebarCollapsedWidthMobile = 0;
  const menuWidth = 56;
  const sidebarExpandedWidth = isNarrow ? "min(80vw, 320px)" : `${sidebarWidth}px`;
  const sidebarCollapsedWidthValue = `${sidebarCollapsedWidth}px`;
  const sidebarCollapsedWidthMobileValue = `${sidebarCollapsedWidthMobile}px`;
  const canvasCardPadding = 0;
  const canvasInnerWidth = Math.max(1, canvasAreaWidth - canvasCardPadding * 2);
  const canvasSizingWidth = canvasInnerWidth;

  const fitCellSize = useMemo(() => {
    if (canvasSizingWidth <= 0) return 1;
    return Math.max(1, canvasSizingWidth / gridW);
  }, [canvasSizingWidth, gridW]);

  const prevFitCellSizeRef = useRef(fitCellSize);

  const displayCellSize = useMemo(() => {
    return Math.max(1, Number((fitCellSize * zoom).toFixed(2)));
  }, [fitCellSize, zoom]);
  const prevTraceRenderCellSizeRef = useRef(displayCellSize);
  const traceRenderRatio =
    traceTransformBasisRef.current > 0 && Number.isFinite(traceTransformBasisRef.current)
      ? fitCellSize / traceTransformBasisRef.current
      : 1;
  const renderedTraceScale = traceScale * traceRenderRatio;
  const renderedTraceOffsetX = traceOffsetX * traceRenderRatio;
  const renderedTraceOffsetY = traceOffsetY * traceRenderRatio;

  useEffect(() => {
    if (!traceImageUrl) {
      setTraceImage(null);
      setTraceFileName(null);
      setTraceFileSize(null);
      setTraceOpacity(0);
      return;
    }
    const img = new Image();
    if (traceImageUrl.startsWith("http://") || traceImageUrl.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      setTraceImage(img);
      const pending = pendingTraceRestoreRef.current;
      if (pending && pending.imageUrl === traceImageUrl) {
        traceTransformBasisRef.current =
          typeof pending.cellSizeBasis === "number" && Number.isFinite(pending.cellSizeBasis) && pending.cellSizeBasis > 0
            ? pending.cellSizeBasis
            : fitCellSize;
        setTraceScale(pending.scale);
        setTraceOffsetX(pending.offsetX);
        setTraceOffsetY(pending.offsetY);
        // Reset the fit-cell baseline so the restore transform is not re-scaled again on load.
        prevFitCellSizeRef.current = fitCellSize;
        prevTraceRenderCellSizeRef.current = displayCellSize;
        pendingTraceRestoreRef.current = null;
        return;
      }
      if (!tracePostUpload) {
        // Preserve saved transforms from draft loads/version restores.
        // If a cell-size basis conversion is pending, defer it until layout is real (not startup 1x1).
        const savedBasis = pendingTraceCellSizeBasisRef.current;
        if (!savedBasis) {
          prevFitCellSizeRef.current = fitCellSize;
          prevTraceRenderCellSizeRef.current = displayCellSize;
          traceTransformBasisRef.current = fitCellSize;
        }
        debugTraceTransform("trace-image-onload", {
          hasPendingBasis: Boolean(savedBasis),
          savedBasis: savedBasis ?? null,
          fitCellSize,
          imageUrl: traceImageUrl,
        });
        return;
      }
      fitTraceImageToGrid(img);
    };
    img.src = getSafeTraceImageUrl(traceImageUrl);
  }, [traceImageUrl, tracePostUpload]);

  useEffect(() => {
    if (pendingTraceUnlock && !traceLocked) {
      setTraceEditMode(true);
      setPendingTraceUnlock(false);
    }
  }, [pendingTraceUnlock, traceLocked]);

  const containerWidth = Math.max(1, canvasSizingWidth);
  const containerHeight = Math.max(1, Math.round((containerWidth * gridH) / gridW));
  const canvasW = gridW * displayCellSize;
  const canvasH = gridH * displayCellSize;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("wippa:debugCanvasLayout") !== "1") return;
    console.info("[wippa layout]", "sidebar/canvas", {
      sidebarCollapsed,
      isNarrow,
      canvasAreaWidth,
      canvasInnerWidth,
      canvasSizingWidth,
      fitCellSize,
      displayCellSize,
      containerWidth,
      containerHeight,
      at: new Date().toISOString(),
    });
  }, [
    sidebarCollapsed,
    isNarrow,
    canvasAreaWidth,
    canvasInnerWidth,
    canvasSizingWidth,
    fitCellSize,
    displayCellSize,
    containerWidth,
    containerHeight,
  ]);

  useEffect(() => {
    if (!traceImage) return;
    const savedBasis = pendingTraceCellSizeBasisRef.current;
    if (!(savedBasis && Number.isFinite(savedBasis) && savedBasis > 0)) return;

    const layoutReady = containerWidth > 1 && containerHeight > 1;
    if (!layoutReady || fitCellSize <= 0) {
      debugTraceTransform("trace-basis-convert-deferred", {
        imageUrl: traceImageUrl,
        savedBasis,
        fitCellSize,
        containerWidth,
        containerHeight,
      });
      return;
    }

    traceTransformBasisRef.current = savedBasis;
    debugTraceTransform("trace-basis-adopt", {
      imageUrl: traceImageUrl,
      savedBasis,
      fitCellSize,
      containerWidth,
      containerHeight,
    });

    pendingTraceCellSizeBasisRef.current = null;
    prevFitCellSizeRef.current = fitCellSize;
    prevTraceRenderCellSizeRef.current = displayCellSize;
  }, [
    containerHeight,
    containerWidth,
    fitCellSize,
    displayCellSize,
    setTraceOffsetX,
    setTraceOffsetY,
    setTraceScale,
    traceImage,
    traceImageUrl,
  ]);

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
    getTraceSnapshot: buildTraceSnapshot,
    applyTraceSnapshot,
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
    hasAnyPaintedCells,
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
    getTraceSnapshot: buildTraceSnapshot,
  });

  const usedColorCounts = useMemo(
    () =>
      usedColors.reduce<Record<number, number>>((acc, entry) => {
        acc[entry.color.id] = entry.count;
        return acc;
      }, {}),
    [usedColors],
  );

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
    forceSaveNow,
    startNewWip,
    formatDraftDate,
  } = useWipDrafts({
    authLoaded,
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
    fitCellSize,
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
    traceCellSizeBasis: traceTransformBasisRef.current,
    setPendingTraceCellSizeBasis: (value) => {
      pendingTraceCellSizeBasisRef.current = value;
    },
    traceLocked,
    setTraceLocked,
    setTraceImage,
    setTraceFileName,
    traceUploadState,
    setTraceUploadState,
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
    getSessionCanvasView: () => ({
      zoom: zoomRef.current,
      panX: canvasPanOffsetRef.current.x,
      panY: canvasPanOffsetRef.current.y,
    }),
    restoreSessionCanvasView,
    resetCanvasViewport,
  });

  useEffect(() => {
    if (!traceImage) {
      prevFitCellSizeRef.current = fitCellSize;
      prevTraceRenderCellSizeRef.current = displayCellSize;
      traceTransformBasisRef.current = fitCellSize;
      return;
    }
    if (pendingTraceCellSizeBasisRef.current) {
      debugTraceTransform("fitCellSize-rescale-skip-pending-basis", {
        imageUrl: traceImageUrl,
        pendingBasis: pendingTraceCellSizeBasisRef.current,
        fitCellSize,
        prevFitCellSize: prevFitCellSizeRef.current,
      });
      return;
    }
    const prev = prevFitCellSizeRef.current;
    if (prev > 0 && fitCellSize > 0 && prev !== fitCellSize) {
      debugTraceTransform("fitCellSize-render-ratio-update", {
        imageUrl: traceImageUrl,
        prevFitCellSize: prev,
        fitCellSize,
        traceBasis: traceTransformBasisRef.current,
        renderRatio: traceRenderRatio,
      });
    }
    prevFitCellSizeRef.current = fitCellSize;
    prevTraceRenderCellSizeRef.current = displayCellSize;
  }, [fitCellSize, displayCellSize, traceImage, traceImageUrl, traceRenderRatio]);

  function clampZoom(value: number) {
    return Math.min(maxZoom, Math.max(minZoom, Number(value.toFixed(2))));
  }

  function restoreSessionCanvasView(view: { zoom?: number; panX?: number; panY?: number } | null | undefined) {
    if (!view) return;
    const zoomValue = typeof view.zoom === "number" && Number.isFinite(view.zoom) ? view.zoom : null;
    const panXValue = typeof view.panX === "number" && Number.isFinite(view.panX) ? view.panX : null;
    const panYValue = typeof view.panY === "number" && Number.isFinite(view.panY) ? view.panY : null;
    if (zoomValue !== null) {
      const nextZoom = clampZoom(zoomValue);
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
    }
    if (panXValue !== null && panYValue !== null) {
      const nextPan = { x: panXValue, y: panYValue };
      canvasPanOffsetRef.current = nextPan;
      setRestoredCanvasPanOffset(nextPan);
      setRestoredCanvasViewToken((tick) => tick + 1);
    }
  }

  function resetCanvasViewport() {
    canvasPanOffsetRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    setZoom(1);
    setRestoredCanvasPanOffset(null);
    setResetCanvasViewToken((tick) => tick + 1);
    setFitToken((tick) => (typeof tick === "number" ? tick + 1 : 1));
  }

  function fitTraceToGrid() {
    if (!traceImage) return;
    const baseCanvasW = gridW * fitCellSize;
    const baseCanvasH = gridH * fitCellSize;
    const scale = Math.min(baseCanvasW / traceImage.width, baseCanvasH / traceImage.height);
    traceTransformBasisRef.current = fitCellSize;
    setTraceScale(scale);
    setTraceOffsetX((baseCanvasW - traceImage.width * scale) / 2);
    setTraceOffsetY((baseCanvasH - traceImage.height * scale) / 2);
  }

  function fitTraceImageToGrid(image: HTMLImageElement) {
    const baseCanvasW = gridW * fitCellSize;
    const baseCanvasH = gridH * fitCellSize;
    const scale = Math.min(baseCanvasW / image.width, baseCanvasH / image.height);
    traceTransformBasisRef.current = fitCellSize;
    setTraceScale(scale);
    setTraceOffsetX((baseCanvasW - image.width * scale) / 2);
    setTraceOffsetY((baseCanvasH - image.height * scale) / 2);
  }

  function convertImageToPattern() {
    if (!traceImage) return;

    const hasPaintedCells = (() => {
      for (let i = 0; i < grid.length; i += 1) {
        if (grid[i] !== 0) return true;
      }
      return false;
    })();

    const runConvert = () => {
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
    };

    if (hasPaintedCells) {
      confirmActionRef.current = runConvert;
      setConfirmDialog({
        title: "Overwrite current pattern?",
        message: "Converting this image will replace your current stitches. Do you want to continue?",
        confirmLabel: "Convert",
      });
      return;
    }

    runConvert();
  }

  async function handleTraceFileSelected(file: File) {
    const seq = ++traceUploadSeqRef.current;
    setTraceUploadState("uploading");

    if (tracePreviewObjectUrlRef.current) {
      URL.revokeObjectURL(tracePreviewObjectUrlRef.current);
      tracePreviewObjectUrlRef.current = null;
    }
    prevToolRef.current = tool;
    prevPanModeRef.current = panMode;

    const localPreview = URL.createObjectURL(file);
    tracePreviewObjectUrlRef.current = localPreview;
    setTraceImageUrl(localPreview);
    setTraceFileName(file.name);
    setTraceFileSize(file.size);
    setTraceLocked(false);
    setTracePostUpload(true);
    setTraceEditMode(false);
    setTraceOpacity(0.5);

    try {
      const { upload } = await import("@vercel/blob/client");
      const uploadName = `trace-${Date.now()}-${crypto.randomUUID()}-${file.name}`;
      const uploaded = await upload(uploadName, file, {
        access: "public",
        handleUploadUrl: "/api/upload-trace",
      });

      if (seq !== traceUploadSeqRef.current) return;
      if (tracePreviewObjectUrlRef.current === localPreview) {
        URL.revokeObjectURL(localPreview);
        tracePreviewObjectUrlRef.current = null;
      }
      setTraceImageUrl(uploaded.url);
      setTraceUploadState("idle");
    } catch {
      if (seq !== traceUploadSeqRef.current) return;
      setTraceUploadState("error");
    }
  }

  function clearTraceImage() {
    if (traceImage || traceImageUrl) {
      pushHistory({ gridW, gridH, grid, trace: buildTraceSnapshot() });
      setFutureState([]);
    }
    traceUploadSeqRef.current += 1;
    setTraceUploadState("idle");
    setTraceImageUrl(null);
    setTraceFileName(null);
    setTraceFileSize(null);
    setTraceImage(null);
    setTraceOpacity(0);
    setTraceLocked(false);
    setTracePostUpload(false);
    setTraceEditMode(false);
    if (tracePreviewObjectUrlRef.current) {
      URL.revokeObjectURL(tracePreviewObjectUrlRef.current);
      tracePreviewObjectUrlRef.current = null;
    }
  }

  const beginTraceTransform = useCallback(() => {
    if (traceTransformActiveRef.current) return;
    pushHistory({ gridW, gridH, grid, trace: buildTraceSnapshot() });
    setFutureState([]);
    traceTransformActiveRef.current = true;
  }, [buildTraceSnapshot, grid, gridH, gridW, pushHistory, setFutureState]);

  const endTraceTransform = useCallback(() => {
    traceTransformActiveRef.current = false;
  }, []);

  function confirmClearTraceImage() {
    confirmActionRef.current = () => {
      clearTraceImage();
    };
    setConfirmDialog({
      title: "Remove background image?",
      message: "This will remove the current background image from the canvas.",
      confirmLabel: "Remove",
    });
  }

  function handleToggleTraceLock() {
    if (traceLocked) {
      prevTraceTransformRef.current = {
        scale: traceScale,
        x: traceOffsetX,
        y: traceOffsetY,
        basis: traceTransformBasisRef.current,
      };
      setPendingTraceUnlock(true);
      setTracePostUpload(false);
    } else {
      setTraceEditMode(false);
      setTracePostUpload(false);
    }
    toggleTraceLock();
  }

  function handleSetTraceLockedState(nextLocked: boolean) {
    if (!nextLocked) {
      prevTraceTransformRef.current = {
        scale: traceScale,
        x: traceOffsetX,
        y: traceOffsetY,
        basis: traceTransformBasisRef.current,
      };
      setPendingTraceUnlock(true);
      setTracePostUpload(false);
    } else {
      setTraceEditMode(false);
      setTracePostUpload(false);
    }
    setTraceLockedState(nextLocked);
  }

  function handleTraceCancel() {
    if (traceEditMode) {
      const prevTransform = prevTraceTransformRef.current;
      if (prevTransform) {
        traceTransformBasisRef.current = prevTransform.basis;
        setTraceScale(prevTransform.scale);
        setTraceOffsetX(prevTransform.x);
        setTraceOffsetY(prevTransform.y);
      }
      setTraceEditMode(false);
      setTraceLockedState(true);
      return;
    }
    setTool(prevToolRef.current);
    setPanMode(prevPanModeRef.current);
    clearTraceImage();
  }

  function handleTraceSetImage() {
    setTracePostUpload(false);
    setTraceEditMode(false);
    setTraceLockedState(true);
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
      setFitToken((token) => (typeof token === "number" ? token + 1 : 1));
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
      return [...prev, { id: nextId, name, hex, family: "neutrals" }];
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

  const cardShadow = "var(--ui-shadow-md)";
  const cardShadowCollapsed = "var(--ui-shadow-sm)";
  const cardStyle = {
    background: "var(--card-bg)",
    border: "none",
    borderRadius: 12,
    padding: 12,
    boxShadow: cardShadow,
  } as const;
  const sidebarCardStyle = {
    ...cardStyle,
    background: "transparent",
    boxShadow: "none",
    border: "none",
    borderRadius: 0,
    padding: 0,
    fontSize: 12,
  } as const;
  const sidebarCardShadow = "none";
  const sidebarCardShadowCollapsed = "none";
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

  const menuPages = [
    { id: "main", label: "Main", icon: assetPath("/grid.svg") },
    { id: "background", label: "Background", icon: assetPath("/photo.svg") },
    { id: "colors", label: "Colors", icon: assetPath("/palette.svg") },
  ];
  const [activeMenuId, setActiveMenuId] = useState(menuPages[0].id);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const sidebarInnerRef = useRef<HTMLDivElement | null>(null);
  const sidebarContentRef = useRef<HTMLDivElement | null>(null);
  const [sidebarScrollable, setSidebarScrollable] = useState(false);

  useEffect(() => {
    const container = sidebarInnerRef.current;
    const content = sidebarContentRef.current;
    if (!container || !content) return;

    let raf = 0;
    const update = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const scrollable = container.scrollHeight - container.clientHeight > 1;
        setSidebarScrollable(scrollable);
      });
    };

    update();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(update);
      observer.observe(container);
      observer.observe(content);
      return () => {
        if (raf) cancelAnimationFrame(raf);
        observer.disconnect();
      };
    }

    window.addEventListener("resize", update);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="pattern-editor"
      style={{
        display: "grid",
        gap: 0,
        padding: 0,
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        height: "calc(100vh - var(--app-header-height, 0px))",
        overflow: "hidden",
      }}
    >
      <div
        className="pattern-main"
        style={{
          display: "grid",
          columnGap: 0,
          rowGap: 0,
          alignItems: "stretch",
          width: "100%",
          minWidth: 0,
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          gridTemplateColumns: isNarrow
            ? "1fr"
            : `${menuWidth}px ${sidebarCollapsed ? 0 : sidebarWidth}px minmax(0, 1fr)`,
          position: "relative",
          background: "var(--muted-bg)",
        }}
      >
        {headerActionsNode &&
          createPortal(
            <ExportPdfButton
              title={title}
              canvasRef={exportCanvasRef}
              usedColors={usedColors}
              grid={grid}
              paletteById={paletteById}
              symbolMap={symbolMap}
              width={gridW}
              height={gridH}
              cellSize={EXPORT_CELL_SIZE}
              threadView={threadView}
            />,
            headerActionsNode
          )}
        {headerFileNode &&
          createPortal(
            <div ref={fileMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setFileMenuOpen((open) => !open)}
                aria-expanded={fileMenuOpen}
                aria-haspopup="menu"
                style={{
                  padding: "4px 8px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--card-bg)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                File
              </button>
              {fileMenuOpen && (
                <div
                  role="menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    minWidth: 160,
                    background: "var(--card-bg)",
                    border: "1px solid var(--ui-border-subtle)",
                    borderRadius: 10,
                    boxShadow: "var(--ui-shadow-lg)",
                    padding: 6,
                    display: "grid",
                    gap: 4,
                    zIndex: 50,
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="menu-item"
                    onClick={() => {
                      setFileMenuOpen(false);
                      if (typeof window !== "undefined") {
                        const nextUrl = new URL(window.location.href);
                        nextUrl.searchParams.set("newWip", "1");
                        window.open(nextUrl.toString(), "_blank", "noopener,noreferrer");
                      } else {
                        startNewWip();
                      }
                    }}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    New WIP
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="menu-item"
                    onClick={() => {
                      setFileMenuOpen(false);
                      loadWip();
                    }}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Load WIP
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="menu-item"
                    onClick={() => {
                      setFileMenuOpen(false);
                      openVersionHistory();
                    }}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Version History
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="menu-item"
                    onClick={() => {
                      setFileMenuOpen(false);
                      setIsRenaming(true);
                    }}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Rename
                  </button>
                </div>
              )}
            </div>,
            headerFileNode
          )}
        {headerAutosaveNode &&
          createPortal(
            <button
              type="button"
              onClick={() => {
                void forceSaveNow();
              }}
              title="Save now"
              aria-label="Save now"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 8,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--card-bg)",
                color: "var(--foreground)",
                cursor: "pointer",
              }}
            >
              <img
                src={assetPath("/cloud_done.svg")}
                alt=""
                aria-hidden="true"
                width={16}
                height={16}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                Saved{" "}
                {lastAutosaveAt
                  ? `at ${lastAutosaveAt.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                    })}`
                  : ""}
              </span>
            </button>,
            headerAutosaveNode
          )}
        {headerTitleNode &&
          createPortal(
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, zIndex: 2 }}>
              {isRenaming ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    ref={renameInputRef}
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        commitRename();
                      }
                      if (e.key === "Escape") {
                        setIsRenaming(false);
                        setDraftTitle(title);
                      }
                    }}
                    aria-label="Pattern name"
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      textAlign: "center",
                      border: "1px solid var(--panel-border)",
                      borderRadius: 8,
                      background: "transparent",
                      color: "var(--foreground)",
                      outline: "none",
                      padding: "4px 8px",
                      minWidth: 120,
                    }}
                  />
                  <button
                    type="button"
                    onClick={commitRename}
                    aria-label="Confirm rename"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: "1px solid var(--panel-border)",
                      background: "var(--card-bg)",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <span
                  onDoubleClick={() => setIsRenaming(true)}
                  style={{ fontWeight: 700, fontSize: 14, color: "var(--foreground)", cursor: "text" }}
                >
                  {title}
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 24 }}>
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                  title="Undo"
                  style={{
                    padding: "4px 6px",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--card-bg)",
                    cursor: canUndo ? "pointer" : "not-allowed",
                    opacity: canUndo ? 1 : 0.5,
                  }}
                >
                  <img
                    src={assetPath("/undo.svg")}
                    alt=""
                    aria-hidden="true"
                    width={18}
                    height={18}
                    style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                  />
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo"
                  title="Redo"
                  style={{
                    padding: "4px 6px",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--card-bg)",
                    cursor: canRedo ? "pointer" : "not-allowed",
                    opacity: canRedo ? 1 : 0.5,
                  }}
                >
                  <img
                    src={assetPath("/redo.svg")}
                    alt=""
                    aria-hidden="true"
                    width={18}
                    height={18}
                    style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                  />
                </button>
                <button
                  type="button"
                  onClick={clearGrid}
                  aria-label="Clear"
                  title="Clear"
                  style={{
                    padding: "4px 6px",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--card-bg)",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={assetPath("/trash.svg")}
                    alt=""
                    aria-hidden="true"
                    width={18}
                    height={18}
                    style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                  />
                </button>
              </div>
            </div>,
            headerTitleNode
          )}
        {!isNarrow && !sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setSidebarCollapsedWithFlip((prev) => !prev)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              position: "absolute",
              top: "50%",
              left: menuWidth + (sidebarCollapsed ? sidebarCollapsedWidth : sidebarWidth),
              transform: "translate(-50%, -50%)",
              width: 22,
              height: 40,
              borderRadius: 999,
              border: "1px solid var(--ui-border)",
              background: "var(--card-bg)",
              boxShadow: "var(--ui-shadow-md)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              zIndex: 200,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1, opacity: 0.7 }}>
              {sidebarCollapsed ? "▸" : "◂"}
            </span>
          </button>
        )}
        {isNarrow && !sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setSidebarCollapsedWithFlip((prev) => !prev)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              position: "fixed",
              top: "50%",
              left: sidebarCollapsed ? 14 : "min(80vw, 320px)",
              transform: sidebarCollapsed ? "translateY(-50%)" : "translate(-50%, -50%)",
              width: 22,
              height: 40,
              borderRadius: 999,
              border: "1px solid var(--ui-border)",
              background: "var(--card-bg)",
              boxShadow: "var(--ui-shadow-md)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              zIndex: 200,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1, opacity: 0.7 }}>
              {sidebarCollapsed ? "▸" : "◂"}
            </span>
          </button>
        )}
        {!isNarrow && (
          <div
            className="pattern-menu"
            style={{
              display: "grid",
              gap: 10,
              alignContent: "start",
              padding: "16px 8px",
              height: "100%",
              background: "var(--card-bg)",
              borderRight: "1px solid var(--ui-divider)",
              position: "relative",
              zIndex: 100,
            }}
          >
            {menuPages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => {
                  if (activeMenuId === page.id) {
                    setSidebarCollapsedWithFlip((prev) => !prev);
                  } else {
                    setActiveMenuId(page.id);
                    setSidebarCollapsedWithFlip(false);
                  }
                }}
                title={page.label}
                aria-pressed={activeMenuId === page.id}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "none",
                  background: activeMenuId === page.id ? "var(--accent-wash)" : "var(--card-bg)",
                  color: activeMenuId === page.id ? "var(--accent-strong)" : "var(--foreground)",
                  fontSize: 16,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <img
                  src={page.icon}
                  alt=""
                  aria-hidden="true"
                  width={18}
                  height={18}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </button>
            ))}
          </div>
        )}
        <div
          className="pattern-sidebar"
          ref={sidebarRef}
          style={{
            display: isNarrow ? (sidebarCollapsed ? "none" : "grid") : "grid",
            gap: 16,
            alignContent: "start",
            minWidth: 0,
            minHeight: 0,
            height: "100%",
            maxHeight: "100%",
            overflowY: "hidden",
            overflowX: "visible",
            alignSelf: "stretch",
            position: isNarrow ? "fixed" : "relative",
            top: isNarrow ? "var(--app-header-height, 0px)" : undefined,
            left: isNarrow ? 0 : undefined,
            bottom: isNarrow ? 0 : undefined,
            width: isNarrow
              ? sidebarCollapsed
                ? sidebarCollapsedWidthMobileValue
                : sidebarExpandedWidth
              : sidebarCollapsed
                ? 0
                : sidebarExpandedWidth,
            zIndex: isNarrow ? 80 : 90,
          }}
        >
          <div
            className="pattern-sidebar-inner"
            ref={sidebarInnerRef}
            style={{
              display: "grid",
              gap: 0,
              alignContent: "start",
              padding: "12px 18px",
              height: "100%",
              minHeight: 0,
              maxHeight: "100%",
              overflowY: sidebarScrollable ? "auto" : "hidden",
              overflowX: "hidden",
              opacity: sidebarCollapsed ? 0 : 1,
              transform: sidebarCollapsed ? "translateX(-6px)" : "translateX(0)",
              pointerEvents: sidebarCollapsed ? "none" : "auto",
            }}
          >
            <div ref={sidebarContentRef} style={{ display: "grid", gap: 0, alignContent: "start" }}>
            {activeMenuId === "main" ? (
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--ui-divider)" }}>
                <GridSizeCard
                  cardStyle={sidebarCardStyle}
                  cardShadow={sidebarCardShadow}
                  cardShadowCollapsed={sidebarCardShadowCollapsed}
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
              </div>
            ) : activeMenuId === "colors" ? (
              <div style={{ display: "grid", gap: 0 }}>
                <div style={{ padding: "12px 0", borderBottom: "1px solid var(--ui-divider)" }}>
                  <PaletteSection
                    cardStyle={sidebarCardStyle}
                    cardShadow={sidebarCardShadow}
                    cardShadowCollapsed={sidebarCardShadowCollapsed}
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
                  usedColorCounts={usedColorCounts}
                  favoriteIds={favoriteColorIds}
                  setFavoriteIds={setFavoriteColorIds}
                  activeColorId={activeColorId}
                  remapTargetId={remapTargetId}
                  remapSourceId={remapSourceId}
                    onSelectActive={(id) => {
                      setActiveColorId(id);
                      setTool("paint");
                      setPanMode(false);
                    }}
                    onRemapSelect={previewRemap}
                    onAddColor={addColor}
                  />
                </div>
                <div style={{ padding: "12px 0" }}>
                  <UsedColorsSection
                    cardStyle={sidebarCardStyle}
                    cardShadow={sidebarCardShadow}
                    cardShadowCollapsed={sidebarCardShadowCollapsed}
                    usedColorsOpen={usedColorsOpen}
                    setUsedColorsOpen={setUsedColorsOpen}
                    collapseStyle={collapseStyle}
                    usedColors={usedColors}
                    usedColorIds={usedColorIds}
                    hasAnyPaintedCells={hasAnyPaintedCells}
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
              </div>
            ) : activeMenuId === "background" ? (
              <div style={{ display: "grid", gap: 0 }}>
                <div style={{ padding: "12px 0", borderBottom: "1px solid var(--ui-divider)" }}>
                <TraceImageCard
                  cardStyle={sidebarCardStyle}
                  cardShadow={sidebarCardShadow}
                  cardShadowCollapsed={sidebarCardShadowCollapsed}
                  traceOpen={traceOpen}
                  setTraceOpen={setTraceOpen}
                  collapseStyle={collapseStyle}
                  traceInputRef={traceInputRef}
                  traceFileName={traceFileName}
                  traceFileSize={traceFileSize}
                  traceImage={traceImage}
                  traceLocked={traceLocked}
                  onTraceFileSelected={handleTraceFileSelected}
                  onClearTrace={confirmClearTraceImage}
                  onSetTraceLockedState={handleSetTraceLockedState}
                />
                </div>
                <div style={{ padding: "12px 0" }}>
                  <ImageToPatternCard
                    cardStyle={sidebarCardStyle}
                    cardShadow={sidebarCardShadow}
                    cardShadowCollapsed={sidebarCardShadowCollapsed}
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
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: "1px dashed var(--ui-border-strong)",
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 13,
                  color: "var(--foreground)",
                }}
              >
                {menuPages.find((page) => page.id === activeMenuId)?.label} page (placeholder)
              </div>
            )}
            </div>
          </div>
        </div>

        <div
          className="pattern-canvas-shell"
          style={
            {
              minWidth: 0,
              paddingInline: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              "--canvas-card-radius": "0px",
              "--canvas-card-shadow": "none",
              "--canvas-card-bg": "var(--muted-bg)",
              background: "var(--muted-bg)",
              overflow: "visible",
              position: "relative",
              zIndex: 1,
            } as React.CSSProperties &
              Record<"--canvas-card-radius" | "--canvas-card-shadow" | "--canvas-card-bg", string>
          }
        >
          {/* Canvas area */}
          <div
            ref={canvasAreaRef}
            className="pattern-canvas-area"
            style={{
              minWidth: 0,
              flex: "1 1 0",
              minHeight: 0,
              height: "100%",
              background: "var(--muted-bg)",
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
              showRuler={showRuler}
              gridBackground="#ffffff"
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
              onTogglePanMode={() => setPanMode(true)}
              traceImage={traceImage}
              traceImageUrl={traceImageUrl}
              traceOpacity={traceOpacity}
              traceScale={renderedTraceScale}
              traceOffsetX={renderedTraceOffsetX}
              traceOffsetY={renderedTraceOffsetY}
              traceAdjustMode={traceImage ? traceEditMode || tracePostUpload : false}
              traceLocked={traceLocked}
              onToggleTraceLock={handleToggleTraceLock}
              onTraceTransformStart={beginTraceTransform}
              onTraceTransformEnd={endTraceTransform}
              onTraceOffsetChange={(x: React.SetStateAction<number>, y: React.SetStateAction<number>) => {
                traceTransformBasisRef.current = fitCellSize;
                setTraceOffsetX(x);
                setTraceOffsetY(y);
              }}
              onTraceScaleChange={(value: number) => {
                traceTransformBasisRef.current = fitCellSize;
                setTraceScale(value);
              }}
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
              onZoomChange={(next: number) => {
                const clamped = clampZoom(next);
                zoomRef.current = clamped;
                setZoom(clamped);
              }}
              onPanOffsetChange={(next: { x: number; y: number }) => {
                canvasPanOffsetRef.current = next;
              }}
              restoredPanOffset={restoredCanvasPanOffset}
              restoredViewToken={restoredCanvasViewToken}
              resetViewToken={resetCanvasViewToken}
              darkCanvas={darkCanvas}
              onControlsHeightChange={setCanvasControlsHeight}
              onMinZoomChange={setMinZoomOverride}
              fitToBoundsToken={fitToken}
              showSymbols={showSymbols}
              setShowSymbols={setShowSymbols}
              identifyColorId={identifyColorId}
              symbolMap={symbolMap}
              favoriteColorIds={favoriteColorIds}
              filterMode={filterMode}
              filterRect={activeFilterRect}
              filterSelecting={filterSelecting}
              onStartFilterSelection={startFilterSelection}
              onClearFilterSelection={clearFilterSelection}
              onFilterRectChange={(rect: FilterRect | null) => setFilterRect(rect)}
              onFilterSelectEnd={endFilterSelection}
              isNarrow={isNarrow}
              setShowGridlines={setShowGridlines}
              setShowRuler={setShowRuler}
              setThreadView={setThreadView}
              setTraceOpacity={setTraceOpacity}
              tracePostUpload={tracePostUpload}
              traceEditMode={traceEditMode}
              onTraceCancel={handleTraceCancel}
              onTraceSetImage={handleTraceSetImage}
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
        onClose={() => {
          setConfirmDialog(null);
          if (pendingTraceUnlock) {
            setPendingTraceUnlock(false);
            setTraceEditMode(false);
            setTracePostUpload(false);
          }
        }}
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
            border: "1px solid var(--ui-border-subtle)",
            boxShadow: "var(--ui-shadow-lg)",
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
