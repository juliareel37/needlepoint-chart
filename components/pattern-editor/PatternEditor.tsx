"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

const DEFAULT_PALETTE: Color[] = DMC_COLORS;

export default function PatternEditor() {
  const [title, setTitle] = useState("Untitled Pattern");
  const [isNarrow, setIsNarrow] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  const [gridOpen, setGridOpen] = useState(true);
  const [wipOpen, setWipOpen] = useState(true);
  const [traceOpen, setTraceOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [usedColorsOpen, setUsedColorsOpen] = useState(true);
  const [imageToPatternOpen, setImageToPatternOpen] = useState(true);
  const [traceImageUrl, setTraceImageUrl] = useState<string | null>(null);
  const [traceFileName, setTraceFileName] = useState<string | null>(null);
  const [traceImage, setTraceImage] = useState<HTMLImageElement | null>(null);
  const [traceOpacity, setTraceOpacity] = useState(0.6);
  const [traceScale, setTraceScale] = useState(1);
  const [traceOffsetX, setTraceOffsetX] = useState(0);
  const [traceOffsetY, setTraceOffsetY] = useState(0);
  const [traceLocked, setTraceLocked] = useState(false);
  const [tracePostUpload, setTracePostUpload] = useState(false);
  const [traceEditMode, setTraceEditMode] = useState(false);
  const [pendingTraceUnlock, setPendingTraceUnlock] = useState(false);
  const prevTraceTransformRef = useRef<{ scale: number; x: number; y: number } | null>(null);
  const [panMode, setPanMode] = useState(false);
  const prevToolRef = useRef<typeof tool>(tool);
  const prevPanModeRef = useRef<boolean>(panMode);
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
  const sidebarCollapsedWidth = 40;
  const sidebarCollapsedWidthMobile = 0;
  const menuWidth = 56;
  const sidebarExpandedWidth = isNarrow ? "min(80vw, 320px)" : `${sidebarWidth}px`;
  const sidebarCollapsedWidthValue = `${sidebarCollapsedWidth}px`;
  const sidebarCollapsedWidthMobileValue = `${sidebarCollapsedWidthMobile}px`;
  const canvasCardPadding = 0;
  const canvasInnerWidth = Math.max(1, canvasAreaWidth - canvasCardPadding * 2);

  const fitCellSize = useMemo(() => {
    if (canvasInnerWidth <= 0) return 1;
    return Math.max(1, canvasInnerWidth / gridW);
  }, [canvasInnerWidth, gridW]);

  const prevFitCellSizeRef = useRef(fitCellSize);

  const displayCellSize = useMemo(() => {
    return Math.max(1, Number((fitCellSize * zoom).toFixed(2)));
  }, [fitCellSize, zoom]);

  useEffect(() => {
    if (!traceImageUrl) {
      setTraceImage(null);
      setTraceFileName(null);
      setTraceOpacity(0);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setTraceImage(img);
      fitTraceImageToGrid(img);
    };
    img.src = traceImageUrl;
    return () => {
      setTraceImage(null);
    };
  }, [traceImageUrl, fitCellSize]);

  useEffect(() => {
    if (pendingTraceUnlock && !traceLocked) {
      setTraceEditMode(true);
      setPendingTraceUnlock(false);
    }
  }, [pendingTraceUnlock, traceLocked]);

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

  function fitTraceImageToGrid(image: HTMLImageElement) {
    const baseCanvasW = gridW * fitCellSize;
    const baseCanvasH = gridH * fitCellSize;
    const scale = Math.min(baseCanvasW / image.width, baseCanvasH / image.height);
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

  function handleTraceFileSelected(file: File) {
    if (traceUrlRef.current) {
      URL.revokeObjectURL(traceUrlRef.current);
    }
    prevToolRef.current = tool;
    prevPanModeRef.current = panMode;
    const url = URL.createObjectURL(file);
    traceUrlRef.current = url;
    setTraceImageUrl(url);
    setTraceFileName(file.name);
    setTraceLocked(false);
    setTracePostUpload(true);
    setTraceEditMode(false);
    setTraceOpacity(0.5);
  }

  function clearTraceImage() {
    setTraceImageUrl(null);
    setTraceFileName(null);
    setTraceImage(null);
    setTraceOpacity(0);
    setTraceLocked(false);
    setTracePostUpload(false);
    setTraceEditMode(false);
    if (traceUrlRef.current) {
      URL.revokeObjectURL(traceUrlRef.current);
      traceUrlRef.current = null;
    }
  }

  function handleToggleTraceLock() {
    if (traceLocked) {
      prevTraceTransformRef.current = {
        scale: traceScale,
        x: traceOffsetX,
        y: traceOffsetY,
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

  const menuPages = [
    { id: "main", label: "Main", icon: assetPath("/grid.svg") },
    { id: "colors", label: "Colors", icon: assetPath("/palette.svg") },
    { id: "background", label: "Background", icon: assetPath("/photo.svg") },
  ];
  const [activeMenuId, setActiveMenuId] = useState(menuPages[0].id);

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
          overflow: "visible",
          gridTemplateColumns: isNarrow
            ? "1fr"
            : sidebarCollapsed
              ? `${menuWidth}px minmax(0, 1fr)`
              : `${menuWidth}px ${sidebarWidth}px minmax(0, 1fr)`,
          transition: "grid-template-columns 220ms ease",
          position: "relative",
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
                    border: "1px solid rgba(15, 23, 42, 0.12)",
                    borderRadius: 10,
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.16)",
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
                        window.open(window.location.href, "_blank", "noopener,noreferrer");
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
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img
                src={assetPath("/cloud_done.svg")}
                alt=""
                aria-hidden="true"
                width={16}
                height={16}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                Autosaved{" "}
                {lastAutosaveAt
                  ? `at ${lastAutosaveAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                  : ""}
              </span>
            </div>,
            headerAutosaveNode
          )}
        {headerTitleNode &&
          createPortal(
            isRenaming ? (
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
            ),
            headerTitleNode
          )}
        {!isNarrow && !sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              position: "absolute",
              top: "50%",
              left: menuWidth + (sidebarCollapsed ? sidebarCollapsedWidth : sidebarWidth),
              transform: "translate(-50%, -50%)",
              width: 22,
              height: 40,
              borderRadius: 999,
              border: "1px solid rgba(15,23,42,0.18)",
              background: "var(--card-bg)",
              boxShadow: "0 6px 14px rgba(15,23,42,0.12)",
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
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              position: "fixed",
              top: "50%",
              left: sidebarCollapsed ? 14 : "min(80vw, 320px)",
              transform: sidebarCollapsed ? "translateY(-50%)" : "translate(-50%, -50%)",
              width: 22,
              height: 40,
              borderRadius: 999,
              border: "1px solid rgba(15,23,42,0.18)",
              background: "var(--card-bg)",
              boxShadow: "0 6px 14px rgba(15,23,42,0.12)",
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
              borderRight: "1px solid rgba(15,23,42,0.08)",
            }}
          >
            {menuPages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => {
                  if (activeMenuId === page.id) {
                    setSidebarCollapsed((prev) => !prev);
                  } else {
                    setActiveMenuId(page.id);
                    setSidebarCollapsed(false);
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
          style={{
            display: sidebarCollapsed ? "none" : "grid",
            gap: 16,
            alignContent: "start",
            width: "100%",
            minWidth: 0,
            minHeight: 0,
            height: "100%",
            maxHeight: "100%",
            overflowY: sidebarCollapsed ? "hidden" : "auto",
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
            transition: "width 220ms ease",
          }}
        >
          <div
            className="pattern-sidebar-inner"
            style={{
              display: "grid",
              gap: 16,
              alignContent: "start",
              padding: "24px 18px",
              height: "auto",
              minHeight: 0,
              overflowY: "visible",
              overflowX: "hidden",
              opacity: sidebarCollapsed ? 0 : 1,
              transform: sidebarCollapsed ? "translateX(-6px)" : "translateX(0)",
              transition: "opacity 180ms ease, transform 200ms ease",
              pointerEvents: sidebarCollapsed ? "none" : "auto",
            }}
          >
            {activeMenuId === "main" ? (
              <>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <img
                    src={assetPath("/wippa_logo.png")}
                    alt="Wippa"
                    style={{ height: 92, width: "auto", display: "block" }}
                  />
                </div>
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

              </>
            ) : activeMenuId === "colors" ? (
              <>
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
              </>
            ) : activeMenuId === "background" ? (
              <>
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
                  onClearTrace={clearTraceImage}
                  onSetTraceLockedState={handleSetTraceLockedState}
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
              </>
            ) : (
              <div
                style={{
                  border: "1px dashed rgba(15,23,42,0.2)",
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

        <div
          className="pattern-canvas-shell"
          style={{
            minWidth: 0,
            paddingInline: 0,
            marginLeft: isNarrow && sidebarCollapsed ? 0 : 0,
            transition: "margin-left 220ms ease",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            "--canvas-card-radius": "0px",
            "--canvas-card-shadow": "none",
            background: "var(--muted-bg)",
            overflow: "visible",
            position: "relative",
            zIndex: 1,
          }}
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
              traceScale={traceScale}
              traceOffsetX={traceOffsetX}
              traceOffsetY={traceOffsetY}
              traceAdjustMode={traceImage ? traceEditMode || tracePostUpload : false}
              traceLocked={traceLocked}
              onToggleTraceLock={handleToggleTraceLock}
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
