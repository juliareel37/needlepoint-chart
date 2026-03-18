"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { Color } from "../../lib/grid";
import { makeGrid } from "../../lib/grid";
import { DMC_COLORS } from "../../lib/dmcColors";
import { assetPath } from "../../lib/assetPath";
import { CanvasWithExportRef } from "./canvas/CanvasWithExportRef";
import { convertImageToPattern as buildImageToPattern } from "./utils/imageToPattern";
import { type FilterRect } from "./utils/geometry";
import { TEXT_FONT_OPTIONS } from "./utils/textFontOptions";
import { CustomPalettesSection } from "./sections/CustomPalettesSection";
import { UsedColorsSection } from "./sections/UsedColorsSection";
import { DraftPickerDialog } from "./dialogs/DraftPickerDialog";
import { VersionHistoryDialog } from "./dialogs/VersionHistoryDialog";
import { VersionPreviewToast } from "./dialogs/VersionPreviewToast";
import { ConfirmDialog } from "./dialogs/ConfirmDialog";
import { WipCard } from "./cards/WipCard";
import { GridSizeCard } from "./cards/GridSizeCard";
import { TraceImageCard } from "./cards/TraceImageCard";
import { ImageToPatternCard } from "./cards/ImageToPatternCard";
import { TextToolCard } from "./cards/TextToolCard";
import ExportPdfButton from "./cards/ExportPdfButton";
import { useCanvasEdits } from "./hooks/useCanvasEdits";
import { useColorEdits } from "./hooks/useColorEdits";
import { useHistoryStack } from "./hooks/useHistoryStack";
import { useWipDrafts } from "./hooks/useWipDrafts";
import type { TraceSnapshot } from "./utils/historyTypes";

const DEFAULT_PALETTE: Color[] = DMC_COLORS;
const TRACE_DEBUG_KEY = "wippa:debugTrace";
type PendingTextPlacement = {
  text: string;
  font: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  colorId: number;
  x: number;
  y: number;
};

function debugTraceTransform(event: string, details?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(TRACE_DEBUG_KEY) !== "1") return;
  console.info("[wippa trace]", event, {
    ...details,
    at: new Date().toISOString(),
  });
}

export default function PatternEditor() {
  const router = useRouter();
  const clerk = useClerk();
  const [title, setTitle] = useState("Untitled Pattern");
  const [isNarrow, setIsNarrow] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isVerySmall, setIsVerySmall] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("wippa:theme") === "dark";
  });
  const { isSignedIn: clerkSignedIn, isLoaded: authLoaded } = useAuth();
  const isSignedIn = Boolean(clerkSignedIn);

  const [gridW, setGridW] = useState(112);
  const [gridH, setGridH] = useState(140);
  const [grid, setGrid] = useState<Uint16Array>(() => makeGrid(gridW, gridH, 0));
  const { history, future, setHistoryState, setFutureState, pushHistory, pushFuture, popHistory, popFuture } =
    useHistoryStack();
  const canUndo = history.length > 0;
  const canRedo = future.length > 0;
  const [tool, setTool] = useState<"none" | "paint" | "eraser" | "fill" | "eyedropper" | "lasso" | "mirror">("none");
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
  const [usedColorsOpen, setUsedColorsOpen] = useState(true);
  const [imageToPatternOpen, setImageToPatternOpen] = useState(true);
  const [textOpen, setTextOpen] = useState(true);
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
  const mirrorPrevToolRef = useRef<"none" | "paint" | "eraser" | "fill" | "eyedropper" | "lasso">("paint");
  const prevPanModeRef = useRef<boolean>(panMode);
  const [traceUploadState, setTraceUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const tracePreviewObjectUrlRef = useRef<string | null>(null);
  const traceUploadSeqRef = useRef(0);
  const traceInputRef = useRef<HTMLInputElement | null>(null);
  const traceSampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [palette, setPalette] = useState<Color[]>(DEFAULT_PALETTE);
  const [extractedPaletteIds, setExtractedPaletteIds] = useState<number[]>([]);
  const paletteById = useMemo(() => new Map(palette.map((c) => [c.id, c])), [palette]);
  const extractedIds = useMemo(
    () => extractedPaletteIds.filter((id) => paletteById.has(id)),
    [extractedPaletteIds, paletteById]
  );
  const textFontOptions = TEXT_FONT_OPTIONS;

  const [activeColorId, setActiveColorId] = useState<number>(DEFAULT_PALETTE[3].id);
  const [favoriteColorIds, setFavoriteColorIds] = useState<number[]>([]);
  const [textContent, setTextContent] = useState("");
  const [textFont, setTextFont] = useState(TEXT_FONT_OPTIONS[0]?.value ?? "Inter");
  const [textFontSize, setTextFontSize] = useState(24);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textColorId, setTextColorId] = useState<number>(DEFAULT_PALETTE[3].id);
  const [pendingTextPlacement, setPendingTextPlacement] = useState<PendingTextPlacement | null>(null);
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
  const effectiveFitZoom = minZoomOverride ?? baseMinZoom;
  const minZoom = isNarrow
    ? Math.max(0.05, effectiveFitZoom * 0.6)
    : Math.max(0.05, Math.min(baseMinZoom, effectiveFitZoom));
  const maxZoom = isNarrow ? 12 : 8;
  const [showGridlines, setShowGridlines] = useState(true);
  const [showRuler, setShowRuler] = useState(true);
  const [hasEditedSinceLoad, setHasEditedSinceLoad] = useState(false);
  const prevSignedInRef = useRef(isSignedIn);
  const [fitAfterResize, setFitAfterResize] = useState<{ w: number; h: number } | null>(null);
  const [fitToken, setFitToken] = useState<number | undefined>(undefined);

  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const pendingCanvasFlipRectRef = useRef<DOMRect | null>(null);
  const canvasFlipAnimationRef = useRef<Animation | null>(null);
  const [canvasAreaWidth, setCanvasAreaWidth] = useState(0);
  const [headerActionsNode, setHeaderActionsNode] = useState<HTMLElement | null>(null);
  const [headerHistoryNode, setHeaderHistoryNode] = useState<HTMLElement | null>(null);
  const [headerTitleNode, setHeaderTitleNode] = useState<HTMLElement | null>(null);
  const [headerFileLeftNode, setHeaderFileLeftNode] = useState<HTMLElement | null>(null);
  const [headerFileRightNode, setHeaderFileRightNode] = useState<HTMLElement | null>(null);
  const [headerAutosaveNode, setHeaderAutosaveNode] = useState<HTMLElement | null>(null);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isNarrow) {
      setSidebarCollapsed(true);
    }
  }, [isNarrow]);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute("data-theme", "dark");
      window.localStorage.setItem("wippa:theme", "dark");
      return;
    }
    root.removeAttribute("data-theme");
    window.localStorage.setItem("wippa:theme", "light");
  }, [darkMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const node = document.getElementById("app-header-actions");
    setHeaderActionsNode(node);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const node = document.getElementById("app-header-history");
    setHeaderHistoryNode(node);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const node = document.getElementById("app-header-title");
    setHeaderTitleNode(node);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setHeaderFileLeftNode(document.getElementById("app-header-file-left"));
    setHeaderFileRightNode(document.getElementById("app-header-file-right"));
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const node = document.getElementById("app-header-autosave");
    setHeaderAutosaveNode(node);
  }, []);

  useEffect(() => {
    if (!fileMenuOpen) return;
    const handleOutside = (event: Event) => {
      const target = event.target as Node;
      if (!fileMenuRef.current || !target) return;
      if (fileMenuRef.current.contains(target)) return;
      setFileMenuOpen(false);
    };
    if (typeof window !== "undefined" && "PointerEvent" in window) {
      document.addEventListener("pointerdown", handleOutside);
      return () => document.removeEventListener("pointerdown", handleOutside);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [fileMenuOpen]);

  useEffect(() => {
    if (fileMenuOpen) return;
    setMobileSettingsOpen(false);
  }, [fileMenuOpen]);

  useEffect(() => {
    if (history.length === 0) return;
    setHasEditedSinceLoad(true);
  }, [history.length]);

  useEffect(() => {
    if (!authLoaded) return;
    const wasSignedIn = prevSignedInRef.current;
    if (wasSignedIn && !isSignedIn) {
      setHasEditedSinceLoad(false);
    }
    prevSignedInRef.current = isSignedIn;
  }, [authLoaded, isSignedIn]);

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

  function requestRename() {
    const isUntitled = title.trim() === "Untitled Pattern";
    if (!isSignedIn && isUntitled) {
      confirmActionRef.current = () => {
        router.push("/sign-in");
      };
      setConfirmDialog({
        title: "Sign in to rename",
        message: "Sign in to rename this untitled pattern and keep your changes saved.",
        confirmLabel: "Sign in",
      });
      return;
    }
    setIsRenaming(true);
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
    if (!isNarrow) return;
    const needsCanvasInteraction = tracePostUpload || traceEditMode || Boolean(pendingTextPlacement);
    if (!needsCanvasInteraction || sidebarCollapsed) return;
    setSidebarCollapsedWithFlip(true);
  }, [isNarrow, pendingTextPlacement, setSidebarCollapsedWithFlip, sidebarCollapsed, traceEditMode, tracePostUpload]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const narrowQuery = window.matchMedia("(max-width: 600px)");
    const compactQuery = window.matchMedia("(max-width: 640px)");
    const verySmallQuery = window.matchMedia("(max-width: 399px)");

    const handleChange = () => {
      setIsNarrow(narrowQuery.matches);
      setIsCompact(compactQuery.matches);
      setIsVerySmall(verySmallQuery.matches);
    };

    handleChange();
    narrowQuery.addEventListener("change", handleChange);
    compactQuery.addEventListener("change", handleChange);
    verySmallQuery.addEventListener("change", handleChange);
    return () => {
      narrowQuery.removeEventListener("change", handleChange);
      compactQuery.removeEventListener("change", handleChange);
      verySmallQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const sidebarWidth = 300;
  const sidebarCollapsedWidth = 40;
  const sidebarCollapsedWidthMobile = 0;
  const sidebarBottomSheetHeight = "min(70vh, 520px)";
  const bottomMenuBarHeight = 64;
  const menuWidth = isNarrow ? 56 : 72;
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
  const prevGridSizeRef = useRef({ w: gridW, h: gridH });

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
    mirrorRect,
    mirrorSelecting,
    activeFilterRect,
    isIndexInFilter,
    setFilterRect,
    startFilterSelection,
    clearFilterSelection,
    endFilterSelection,
    startMirrorSelection,
    clearMirrorSelection,
    endMirrorSelection,
    setMirrorRect,
    applyMirror,
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
    remapPreviewEnabled,
    identifyColorId,
    mergeMode,
    mergeSelectedIds,
    mergeTargetId,
    mergePreviewEnabled,
    deleteMode,
    deleteSelectedIds,
    deletePreviewEnabled,
    symbolMap,
    usedColors,
    hasAnyPaintedCells,
    usedColorIds,
    setRemapMode,
    setRemapSourceId,
    setRemapTargetId,
    setRemapPreviewEnabled,
    setIdentifyColorId,
    setMergeMode,
    setMergeSelectedIds,
    setMergeTargetId,
    setMergePreviewEnabled,
    setDeleteMode,
    setDeleteSelectedIds,
    setDeletePreviewEnabled,
    beginRemap,
    setRemapPreviewTarget,
    clearRemapSource,
    clearRemapTarget,
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
    traceFileName,
    traceFileSize,
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
    setTraceFileSize,
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
    const prev = prevGridSizeRef.current;
    const gridSizeChanged = prev.w !== gridW || prev.h !== gridH;
    prevGridSizeRef.current = { w: gridW, h: gridH };
    if (!gridSizeChanged) return;
    if (!traceImage) return;
    if (pendingTraceCellSizeBasisRef.current) return;
    const currentBasis = traceTransformBasisRef.current;
    if (!(Number.isFinite(currentBasis) && currentBasis > 0 && Number.isFinite(fitCellSize) && fitCellSize > 0)) return;
    if (currentBasis === fitCellSize) return;
    const ratio = fitCellSize / currentBasis;
    traceTransformBasisRef.current = fitCellSize;
    setTraceScale((prevScale) => prevScale * ratio);
    setTraceOffsetX((prevX) => prevX * ratio);
    setTraceOffsetY((prevY) => prevY * ratio);
    prevFitCellSizeRef.current = fitCellSize;
    prevTraceRenderCellSizeRef.current = displayCellSize;
    debugTraceTransform("grid-resize-normalize-trace-basis", {
      imageUrl: traceImageUrl,
      prevBasis: currentBasis,
      nextBasis: fitCellSize,
      ratio,
      gridW,
      gridH,
    });
  }, [
    displayCellSize,
    fitCellSize,
    gridH,
    gridW,
    setTraceOffsetX,
    setTraceOffsetY,
    setTraceScale,
    traceImage,
    traceImageUrl,
  ]);

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

  function rebaseTraceTransformToCurrentFit() {
    const currentBasis = traceTransformBasisRef.current;
    if (!(Number.isFinite(fitCellSize) && fitCellSize > 0)) return;
    if (!(Number.isFinite(currentBasis) && currentBasis > 0)) {
      traceTransformBasisRef.current = fitCellSize;
      return;
    }
    if (Math.abs(currentBasis - fitCellSize) < 0.0001) {
      traceTransformBasisRef.current = fitCellSize;
      return;
    }
    const ratio = fitCellSize / currentBasis;
    setTraceScale((prev) => prev * ratio);
    setTraceOffsetX((prev) => prev * ratio);
    setTraceOffsetY((prev) => prev * ratio);
    traceTransformBasisRef.current = fitCellSize;
    prevFitCellSizeRef.current = fitCellSize;
    prevTraceRenderCellSizeRef.current = displayCellSize;
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
    rebaseTraceTransformToCurrentFit();
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

  function commitTextPlacement(placement: PendingTextPlacement) {
    if (!placement.text.trim()) return;
    if (!paletteById.has(placement.colorId)) return;
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = gridW;
    maskCanvas.height = gridH;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    maskCtx.clearRect(0, 0, gridW, gridH);
    maskCtx.fillStyle = "#ffffff";
    maskCtx.textAlign = "center";
    maskCtx.textBaseline = "middle";
    maskCtx.font = `${placement.italic ? "italic " : ""}${placement.bold ? "700 " : ""}${Math.max(
      6,
      placement.fontSize
    )}px ${placement.font}`;

    const lines = placement.text.split(/\r?\n/);
    const lineHeight = Math.max(6, Math.round(placement.fontSize * 1.2));
    const totalHeight = Math.max(lineHeight, lines.length * lineHeight);
    const startY = Math.round(placement.y - totalHeight / 2 + lineHeight / 2);
    const centerX = Math.round(placement.x);

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      const lineY = startY + index * lineHeight;
      maskCtx.fillText(line, centerX, lineY);
      if (placement.underline) {
        const w = maskCtx.measureText(line).width;
        const underlineY = lineY + Math.max(1, Math.round(placement.fontSize * 0.15));
        maskCtx.fillRect(centerX - w / 2, underlineY, w, Math.max(1, Math.round(placement.fontSize * 0.08)));
      }
    });

    const pixels = maskCtx.getImageData(0, 0, gridW, gridH).data;
    let wroteAny = false;
    const nextGrid = new Uint16Array(grid);
    for (let y = 0; y < gridH; y += 1) {
      const row = y * gridW;
      for (let x = 0; x < gridW; x += 1) {
        const pixelIdx = (row + x) * 4;
        if (pixels[pixelIdx + 3] < 120) continue;
        nextGrid[row + x] = placement.colorId;
        wroteAny = true;
      }
    }
    if (!wroteAny) return;

    pushHistory({ gridW, gridH, grid, trace: buildTraceSnapshot() });
    setFutureState([]);
    setGrid(nextGrid);
    setLastEditCell({
      x: Math.max(0, Math.min(gridW - 1, Math.round(placement.x))),
      y: Math.max(0, Math.min(gridH - 1, Math.round(placement.y))),
    });
  }

  function addTextBoxToCanvas() {
    const text = textContent.trim();
    if (!text) return;
    if (!paletteById.has(textColorId)) return;
    setPendingTextPlacement({
      text,
      font: textFont,
      fontSize: textFontSize,
      bold: textBold,
      italic: textItalic,
      underline: textUnderline,
      colorId: textColorId,
      x: gridW / 2,
      y: gridH / 2,
    });
  }

  function confirmTextPlacement() {
    if (!pendingTextPlacement) return;
    commitTextPlacement(pendingTextPlacement);
    setPendingTextPlacement(null);
  }

  function cancelTextPlacement() {
    setPendingTextPlacement(null);
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
    { id: "main", label: "Size", icon: assetPath("/icons/grid.svg") },
    { id: "background", label: "Image", icon: assetPath("/icons/photo.svg") },
    { id: "colors", label: "Colors", icon: assetPath("/icons/palette.svg") },
    { id: "text", label: "Text", icon: assetPath("/icons/text_icon.svg") },
  ];
  const mobileMenuPages = [{ id: "tools", label: "Tools", icon: assetPath("/icons/tools.svg") }, ...menuPages];
  const [activeMenuId, setActiveMenuId] = useState(menuPages[0].id);
  const [mobileToolbarVisible, setMobileToolbarVisible] = useState(true);
  const [mobileToolbarCollapsed, setMobileToolbarCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const sidebarInnerRef = useRef<HTMLDivElement | null>(null);
  const sidebarContentRef = useRef<HTMLDivElement | null>(null);
  const [sidebarScrollable, setSidebarScrollable] = useState(false);
  const [sidebarContentVisible, setSidebarContentVisible] = useState(!sidebarCollapsed);
  const sidebarInnerVisible = !sidebarCollapsed && sidebarContentVisible;
  const sidebarContentRevealTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const clearRevealTimeout = () => {
      if (sidebarContentRevealTimeoutRef.current !== null) {
        window.clearTimeout(sidebarContentRevealTimeoutRef.current);
        sidebarContentRevealTimeoutRef.current = null;
      }
    };

    clearRevealTimeout();
    if (sidebarCollapsed) {
      setSidebarContentVisible(false);
      return;
    }

    const sidebarNode = sidebarRef.current;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!sidebarNode || prefersReducedMotion) {
      setSidebarContentVisible(true);
      return;
    }

    setSidebarContentVisible(false);
    const transitionProperty = isNarrow ? "transform" : "width";
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== sidebarNode) return;
      if (event.propertyName !== transitionProperty) return;
      setSidebarContentVisible(true);
      clearRevealTimeout();
      sidebarNode.removeEventListener("transitionend", handleTransitionEnd);
    };
    sidebarNode.addEventListener("transitionend", handleTransitionEnd);

    const fallbackDelayMs = isNarrow ? 260 : 240;
    sidebarContentRevealTimeoutRef.current = window.setTimeout(() => {
      setSidebarContentVisible(true);
      sidebarContentRevealTimeoutRef.current = null;
      sidebarNode.removeEventListener("transitionend", handleTransitionEnd);
    }, fallbackDelayMs);

    return () => {
      sidebarNode.removeEventListener("transitionend", handleTransitionEnd);
      clearRevealTimeout();
    };
  }, [isNarrow, sidebarCollapsed]);

  useEffect(() => {
    return () => {
      if (sidebarContentRevealTimeoutRef.current !== null) {
        window.clearTimeout(sidebarContentRevealTimeoutRef.current);
        sidebarContentRevealTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!paletteById.has(textColorId)) {
      setTextColorId(activeColorId);
    }
  }, [activeColorId, paletteById, textColorId]);

  useEffect(() => {
    setPendingTextPlacement((prev) => {
      if (!prev) return prev;
      const nextText = textContent.trim();
      if (!nextText) return prev;
      return {
        ...prev,
        text: nextText,
        font: textFont,
        fontSize: textFontSize,
        bold: textBold,
        italic: textItalic,
        underline: textUnderline,
        colorId: textColorId,
      };
    });
  }, [textContent, textFont, textFontSize, textBold, textItalic, textUnderline, textColorId]);

  useEffect(() => {
    setPendingTextPlacement((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        x: Math.max(0, Math.min(gridW - 1, prev.x)),
        y: Math.max(0, Math.min(gridH - 1, prev.y)),
      };
    });
  }, [gridW, gridH]);

  useEffect(() => {
    if (sidebarCollapsed || !sidebarContentVisible) {
      setSidebarScrollable(false);
      return;
    }
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
  }, [sidebarCollapsed, sidebarContentVisible]);

  return (
    <div
      className="pattern-editor"
      style={{
        display: "grid",
        gridTemplateRows: !isSignedIn && hasEditedSinceLoad ? "auto minmax(0, 1fr)" : "minmax(0, 1fr)",
        gap: 0,
        padding: 0,
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        height: "calc(100vh - var(--app-header-height, 0px))",
        overflow: "hidden",
      }}
    >
      {!isSignedIn && hasEditedSinceLoad && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 210,
            display: "flex",
            alignItems: "center",
            flexWrap: "nowrap",
            gap: 8,
            height: 36,
            padding: "4px 10px",
            background: "var(--accent-wash)",
            borderBottom: "1px solid var(--ui-border-subtle)",
            color: "var(--foreground)",
            fontSize: 12,
            fontWeight: 600,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              flex: "1 1 auto",
              minWidth: 0,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            You're signed out! Sign in or create an account to save your edits and access your WIPs later.
          </span>
          <button
            type="button"
            onClick={() => router.push("/sign-in")}
            style={{
              padding: "3px 8px",
              borderRadius: 8,
              border: "1px solid var(--panel-border)",
              background: "var(--card-bg)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Sign in
          </button>
        </div>
      )}
      <div
        className="pattern-main"
        style={{
          display: "grid",
          columnGap: 0,
          rowGap: 0,
          alignItems: "stretch",
          width: "100%",
          minWidth: 0,
          height: "auto",
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
              usedColors={usedColors}
              grid={grid}
              paletteById={paletteById}
              symbolMap={symbolMap}
              width={gridW}
              height={gridH}
              cellSize={24}
              threadView={threadView}
              compact={isCompact}
            />,
            headerActionsNode
          )}
        {((isCompact ? headerFileRightNode : headerFileLeftNode) != null) &&
          createPortal(
            <div ref={fileMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setFileMenuOpen((open) => !open)}
                aria-expanded={fileMenuOpen}
                aria-haspopup="menu"
                aria-label={isCompact ? "More options" : "File"}
                style={{
                  padding: isCompact ? "2px 8px" : "4px 8px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--card-bg)",
                  fontSize: isCompact ? 16 : 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                {isCompact ? "⋯" : "File"}
              </button>
              {fileMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close file menu"
                    onClick={() => setFileMenuOpen(false)}
                    style={{
                      position: "fixed",
                      inset: 0,
                      border: "none",
                      margin: 0,
                      padding: 0,
                      background: "transparent",
                      zIndex: 49,
                      cursor: "default",
                    }}
                  />
                  <div
                    role="menu"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: isCompact ? "auto" : 0,
                      right: isCompact ? 0 : "auto",
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
                  {isCompact && (
                    <>
                      <div
                        style={{
                          padding: "8px 10px 6px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {isRenaming ? (
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
                              flex: "1 1 auto",
                              minWidth: 0,
                              fontSize: 13,
                              fontWeight: 700,
                              border: "1px solid var(--panel-border)",
                              borderRadius: 8,
                              background: "transparent",
                              color: "var(--foreground)",
                              outline: "none",
                              padding: "4px 8px",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              flex: "1 1 auto",
                              minWidth: 0,
                              fontSize: 13,
                              fontWeight: 800,
                              color: "var(--foreground)",
                              lineHeight: 1.2,
                              wordBreak: "break-word",
                            }}
                          >
                            {title.trim() || "Untitled Pattern"}
                          </div>
                        )}
                        <button
                          type="button"
                          aria-label={isRenaming ? "Confirm rename" : "Rename pattern"}
                          onClick={() => {
                            if (isRenaming) {
                              commitRename();
                              return;
                            }
                            requestRename();
                          }}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            border: "1px solid var(--panel-border)",
                            background: "var(--card-bg)",
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 13,
                            fontWeight: 700,
                            lineHeight: 1,
                            flexShrink: 0,
                          }}
                        >
                          {isRenaming ? "✓" : "✎"}
                        </button>
                      </div>
                      <div
                        aria-hidden="true"
                        style={{
                          height: 1,
                          margin: "0 6px 2px",
                          background: "var(--ui-divider)",
                        }}
                      />
                    </>
                  )}
                  {isCompact && isSignedIn && (
                    <button
                      type="button"
                      role="menuitem"
                      className="menu-item"
                      onClick={() => {
                        setFileMenuOpen(false);
                        void forceSaveNow();
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
                      Saved{" "}
                      {lastAutosaveAt
                        ? `at ${lastAutosaveAt.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                            second: "2-digit",
                          })}`
                        : ""}
                    </button>
                  )}
                  {isCompact && (
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
                      View version history
                    </button>
                  )}
                  {isCompact && (
                    <button
                      type="button"
                      role="menuitem"
                      className="menu-item"
                      disabled={!authLoaded}
                      onClick={() => {
                        setFileMenuOpen(false);
                        if (isSignedIn) {
                          void clerk.signOut();
                          return;
                        }
                        router.push("/sign-in");
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: authLoaded ? "pointer" : "not-allowed",
                        fontSize: 12,
                        fontWeight: 600,
                        opacity: authLoaded ? 1 : 0.6,
                      }}
                    >
                      {isSignedIn ? "Sign out" : "Sign in"}
                    </button>
                  )}
                  {isCompact && (
                    <>
                      <div
                        aria-hidden="true"
                        style={{
                          height: 1,
                          margin: "2px 6px",
                          background: "var(--ui-divider)",
                        }}
                      />
                      <button
                        type="button"
                        role="menuitem"
                        aria-expanded={mobileSettingsOpen}
                        className="menu-item"
                        onClick={() => setMobileSettingsOpen((open) => !open)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <span>Settings</span>
                        <span aria-hidden="true" style={{ opacity: 0.75 }}>
                          {mobileSettingsOpen ? "▾" : "▸"}
                        </span>
                      </button>
                      {mobileSettingsOpen && (
                        <>
                          <button
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={showGridlines}
                            className="menu-item"
                            onClick={() => setShowGridlines((value) => !value)}
                            style={{
                              padding: "6px 10px 6px 18px",
                              borderRadius: 8,
                              border: "none",
                              background: "transparent",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <img
                                src={assetPath("/icons/grid3.svg")}
                                alt=""
                                aria-hidden="true"
                                width={12}
                                height={12}
                                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                              />
                              Gridlines
                            </span>
                            <span style={{ opacity: 0.75 }}>{showGridlines ? "On" : "Off"}</span>
                          </button>
                          <button
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={showRuler}
                            className="menu-item"
                            onClick={() => setShowRuler((value) => !value)}
                            style={{
                              padding: "6px 10px 6px 18px",
                              borderRadius: 8,
                              border: "none",
                              background: "transparent",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <img
                                src={assetPath("/icons/sqfoot.svg")}
                                alt=""
                                aria-hidden="true"
                                width={12}
                                height={12}
                                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                              />
                              Ruler
                            </span>
                            <span style={{ opacity: 0.75 }}>{showRuler ? "On" : "Off"}</span>
                          </button>
                          <button
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={threadView}
                            className="menu-item"
                            onClick={() => setThreadView((value) => !value)}
                            style={{
                              padding: "6px 10px 6px 18px",
                              borderRadius: 8,
                              border: "none",
                              background: "transparent",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <img
                                src={assetPath("/icons/thread.svg")}
                                alt=""
                                aria-hidden="true"
                                width={12}
                                height={12}
                                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                              />
                              Thread view
                            </span>
                            <span style={{ opacity: 0.75 }}>{threadView ? "On" : "Off"}</span>
                          </button>
                          <button
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={showSymbols}
                            className="menu-item"
                            onClick={() => setShowSymbols((value) => !value)}
                            style={{
                              padding: "6px 10px 6px 18px",
                              borderRadius: 8,
                              border: "none",
                              background: "transparent",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <img
                                src={assetPath("/icons/glyphs.svg")}
                                alt=""
                                aria-hidden="true"
                                width={12}
                                height={12}
                                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                              />
                              Symbols
                            </span>
                            <span style={{ opacity: 0.75 }}>{showSymbols ? "On" : "Off"}</span>
                          </button>
                          <button
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={darkMode}
                            className="menu-item"
                            onClick={() => setDarkMode((value) => !value)}
                            style={{
                              padding: "6px 10px 6px 18px",
                              borderRadius: 8,
                              border: "none",
                              background: "transparent",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <img
                                src={assetPath("/icons/moon.svg")}
                                alt=""
                                aria-hidden="true"
                                width={12}
                                height={12}
                                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                              />
                              Dark mode
                            </span>
                            <span style={{ opacity: 0.75 }}>{darkMode ? "On" : "Off"}</span>
                          </button>
                        </>
                      )}
                      <div
                        aria-hidden="true"
                        style={{
                          height: 1,
                          margin: "2px 6px",
                          background: "var(--ui-divider)",
                        }}
                      />
                    </>
                  )}
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
                  {!isCompact && (
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
                      View version history
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="menu-item"
                    onClick={() => {
                      if (!isCompact) {
                        setFileMenuOpen(false);
                      }
                      requestRename();
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
                </>
              )}
            </div>,
            isCompact ? headerFileRightNode! : headerFileLeftNode!
          )}
        {headerAutosaveNode &&
          isSignedIn &&
          !isCompact &&
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
                src={assetPath("/icons/cloud_done.svg")}
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
        {headerHistoryNode &&
          isCompact &&
          createPortal(
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                  flexShrink: 0,
                }}
              >
                <img
                  src={assetPath("/icons/undo.svg")}
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
                  flexShrink: 0,
                }}
              >
                <img
                  src={assetPath("/icons/redo.svg")}
                  alt=""
                  aria-hidden="true"
                  width={18}
                  height={18}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </button>
            </div>,
            headerHistoryNode
          )}
        {headerTitleNode &&
          createPortal(
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                zIndex: 2,
                minWidth: 0,
                maxWidth: isVerySmall ? "calc(100vw - 128px)" : undefined,
              }}
            >
              {isRenaming && !isCompact ? (
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
              ) : !isCompact ? (
                <span
                  onDoubleClick={requestRename}
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "var(--foreground)",
                    cursor: "text",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {title}
                </span>
              ) : null}
              {!isCompact && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginLeft: isVerySmall ? 8 : 24,
                    flexShrink: 0,
                  }}
                >
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
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={assetPath("/icons/undo.svg")}
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
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={assetPath("/icons/redo.svg")}
                      alt=""
                      aria-hidden="true"
                      width={18}
                      height={18}
                      style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                    />
                  </button>
                </div>
              )}
            </div>,
            headerTitleNode
          )}
        {!isNarrow && (
          <button
            className="pattern-sidebar-toggle-desktop"
            type="button"
            onClick={() => setSidebarCollapsedWithFlip(true)}
            aria-label="Collapse sidebar"
            style={{
              position: "absolute",
              top: "50%",
              left: menuWidth + (sidebarCollapsed ? 0 : sidebarWidth),
              transform: "translate(-50%, -50%)",
              width: 22,
              height: 40,
              borderRadius: 999,
              border: "1px solid var(--ui-border)",
              background: "var(--card-bg)",
              boxShadow: "var(--ui-shadow-md)",
              display: "grid",
              placeItems: "center",
              cursor: sidebarCollapsed ? "default" : "pointer",
              opacity: sidebarCollapsed ? 0 : 1,
              pointerEvents: sidebarCollapsed ? "none" : "auto",
              transition: "left 200ms ease, opacity 200ms ease",
              zIndex: 200,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1, opacity: 0.7 }}>
              ◂
            </span>
          </button>
        )}
        {isNarrow && (
          <button
            type="button"
            onClick={() => setSidebarCollapsedWithFlip(true)}
            aria-label="Collapse sidebar"
            style={{
              position: "fixed",
              left: "50%",
              bottom: sidebarCollapsed
                ? `calc(${bottomMenuBarHeight}px + env(safe-area-inset-bottom, 0px) - 10px)`
                : `calc(${bottomMenuBarHeight}px + env(safe-area-inset-bottom, 0px) + ${sidebarBottomSheetHeight} - 10px)`,
              transform: "translateX(-50%)",
              width: 42,
              height: 22,
              borderRadius: 999,
              border: "1px solid var(--ui-border)",
              background: "var(--card-bg)",
              boxShadow: "var(--ui-shadow-md)",
              display: "grid",
              placeItems: "center",
              cursor: sidebarCollapsed ? "default" : "pointer",
              opacity: sidebarCollapsed ? 0 : 1,
              pointerEvents: sidebarCollapsed ? "none" : "auto",
              transition: "bottom 220ms ease, opacity 220ms ease",
              zIndex: 202,
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1, opacity: 0.7 }}>▾</span>
          </button>
        )}
        {!isNarrow && (
          <div
            className="pattern-menu pattern-menu-desktop"
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
                className="pattern-menu-button"
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
                aria-label={page.label}
                aria-pressed={activeMenuId === page.id}
                style={{
                  width: 52,
                  height: 54,
                  borderRadius: 12,
                  border: "none",
                  background: activeMenuId === page.id && !sidebarCollapsed ? "var(--accent-wash)" : "var(--card-bg)",
                  color: "var(--foreground)",
                  fontSize: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
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
                <span style={{ fontSize: 10, lineHeight: 1.1, whiteSpace: "nowrap" }}>{page.label}</span>
              </button>
            ))}
          </div>
        )}
        {isNarrow && (
          <div
            className="pattern-menu pattern-menu-mobile"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              gap: 8,
              justifyContent: "center",
              padding: "6px 10px calc(8px + env(safe-area-inset-bottom, 0px))",
              background: "var(--card-bg)",
              borderTop: "1px solid var(--ui-divider)",
              zIndex: 200,
            }}
          >
            {mobileMenuPages.map((page) => {
              const isToolsButton = page.id === "tools";
              const isPressed = isToolsButton
                ? mobileToolbarVisible && !mobileToolbarCollapsed
                : activeMenuId === page.id;
              const showSelected = isToolsButton
                ? mobileToolbarVisible && !mobileToolbarCollapsed
                : isPressed && !sidebarCollapsed;
              return (
                <button
                  key={page.id}
                  className="pattern-menu-button"
                  type="button"
                  onClick={() => {
                    if (isToolsButton) {
                      setMobileToolbarVisible((prev) => !prev);
                      setSidebarCollapsedWithFlip(true);
                      return;
                    }
                    if (activeMenuId === page.id) {
                      setSidebarCollapsedWithFlip((prev) => !prev);
                    } else {
                      setActiveMenuId(page.id);
                      setSidebarCollapsedWithFlip(false);
                    }
                  }}
                  title={page.label}
                  aria-label={page.label}
                  aria-pressed={isPressed}
                  style={{
                    width: 56,
                    height: 48,
                    borderRadius: 12,
                    border: "none",
                    background: showSelected ? "var(--accent-wash)" : "var(--card-bg)",
                    color: "var(--foreground)",
                    fontSize: 16,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
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
                  <span style={{ fontSize: 10, lineHeight: 1.1, whiteSpace: "nowrap" }}>{page.label}</span>
                </button>
              );
            })}
          </div>
        )}
        <div
          className="pattern-sidebar"
          data-layout={isNarrow ? "mobile" : "desktop"}
          ref={sidebarRef}
          style={{
            display: "grid",
            gap: 16,
            alignContent: "start",
            minWidth: 0,
            minHeight: 0,
            height: isNarrow ? sidebarBottomSheetHeight : "100%",
            maxHeight: isNarrow ? sidebarBottomSheetHeight : "100%",
            overflowY: "hidden",
            overflowX: "visible",
            alignSelf: "stretch",
            position: isNarrow ? "fixed" : "relative",
            top: isNarrow ? "auto" : undefined,
            left: isNarrow ? 0 : undefined,
            right: isNarrow ? 0 : undefined,
            bottom: isNarrow ? `calc(${bottomMenuBarHeight}px + env(safe-area-inset-bottom, 0px))` : undefined,
            width: isNarrow
              ? "100%"
              : sidebarCollapsed
                ? 0
                : sidebarExpandedWidth,
            zIndex: isNarrow ? 80 : 90,
            borderTop: isNarrow ? "1px solid var(--ui-divider)" : undefined,
            borderTopLeftRadius: isNarrow ? 14 : undefined,
            borderTopRightRadius: isNarrow ? 14 : undefined,
            boxShadow: isNarrow ? "0 -10px 24px var(--ui-border)" : undefined,
            opacity: isNarrow ? (sidebarCollapsed ? 0 : 1) : 1,
            transform: isNarrow
              ? sidebarCollapsed
                ? "translateY(calc(100% + 12px))"
                : "translateY(0)"
              : undefined,
            transition: isNarrow ? "transform 220ms ease, opacity 180ms ease" : undefined,
            pointerEvents: isNarrow && sidebarCollapsed ? "none" : "auto",
          }}
        >
          <div
            className="pattern-sidebar-inner"
            ref={sidebarInnerRef}
            style={{
              display: "grid",
              gap: 0,
              alignContent: "start",
              padding: isNarrow ? "10px 14px 28px" : "12px 18px 32px",
              height: "100%",
              minHeight: 0,
              maxHeight: "100%",
              overflowY: sidebarInnerVisible && sidebarScrollable ? "auto" : "hidden",
              overflowX: "hidden",
              scrollbarGutter: "stable both-edges",
              opacity: sidebarInnerVisible ? 1 : 0,
              transform: isNarrow
                ? sidebarCollapsed
                  ? "translateY(8px)"
                  : "translateY(0)"
                : sidebarCollapsed
                  ? "translateX(-6px)"
                  : "translateX(0)",
              transition: isNarrow ? "opacity 180ms ease, transform 220ms ease" : "opacity 170ms ease",
              pointerEvents: sidebarInnerVisible ? "auto" : "none",
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
                  <CustomPalettesSection
                    cardStyle={sidebarCardStyle}
                    cardShadow={sidebarCardShadow}
                    cardShadowCollapsed={sidebarCardShadowCollapsed}
                    collapseStyle={collapseStyle}
                    palette={palette}
                    usedColorIds={usedColorIds}
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
                    palette={palette}
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
                    mergePreviewEnabled={mergePreviewEnabled}
                    deletePreviewEnabled={deletePreviewEnabled}
                    remapSourceId={remapSourceId}
                    remapTargetId={remapTargetId}
                    remapPreviewEnabled={remapPreviewEnabled}
                    identifyColorId={identifyColorId}
                    showSymbols={showSymbols}
                    symbolMap={symbolMap}
                    setIdentifyColorId={setIdentifyColorId}
                    setActiveColorId={setActiveColorId}
                    setDeleteSelectedIds={setDeleteSelectedIds}
                    setMergeSelectedIds={setMergeSelectedIds}
                    setMergeTargetId={setMergeTargetId}
                    setMergePreviewEnabled={setMergePreviewEnabled}
                    setDeletePreviewEnabled={setDeletePreviewEnabled}
                    setRemapPreviewEnabled={setRemapPreviewEnabled}
                    beginRemap={beginRemap}
                    setRemapPreviewTarget={setRemapPreviewTarget}
                    clearRemapSource={clearRemapSource}
                    clearRemapTarget={clearRemapTarget}
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
            ) : activeMenuId === "text" ? (
              <div style={{ padding: "12px 0" }}>
                <TextToolCard
                  cardStyle={sidebarCardStyle}
                  cardShadow={sidebarCardShadow}
                  cardShadowCollapsed={sidebarCardShadowCollapsed}
                  collapseStyle={collapseStyle}
                  textOpen={textOpen}
                  setTextOpen={setTextOpen}
                  textValue={textContent}
                  onTextValueChange={setTextContent}
                  fontValue={textFont}
                  onFontValueChange={setTextFont}
                  fontOptions={textFontOptions}
                  bold={textBold}
                  italic={textItalic}
                  underline={textUnderline}
                  onBoldChange={setTextBold}
                  onItalicChange={setTextItalic}
                  onUnderlineChange={setTextUnderline}
                  fontSize={textFontSize}
                  onFontSizeChange={setTextFontSize}
                  selectedColorId={textColorId}
                  onSelectColor={setTextColorId}
                  palette={palette}
                  usedColorCounts={usedColorCounts}
                  placementActive={Boolean(pendingTextPlacement)}
                  onAddTextBox={addTextBoxToCanvas}
                />
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
              paddingBottom: isNarrow ? `calc(${bottomMenuBarHeight}px + env(safe-area-inset-bottom, 0px))` : 0,
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
              onToolChange={(nextTool: "paint" | "eraser" | "fill" | "eyedropper" | "lasso" | "mirror") => {
                if (nextTool === "mirror" && tool !== "mirror") {
                  mirrorPrevToolRef.current = tool;
                }
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
              pendingTextPlacement={
                pendingTextPlacement
                  ? {
                      text: pendingTextPlacement.text,
                      font: pendingTextPlacement.font,
                      fontSize: pendingTextPlacement.fontSize,
                      bold: pendingTextPlacement.bold,
                      italic: pendingTextPlacement.italic,
                      underline: pendingTextPlacement.underline,
                      colorHex: paletteById.get(pendingTextPlacement.colorId)?.hex ?? "#111111",
                      x: pendingTextPlacement.x,
                      y: pendingTextPlacement.y,
                    }
                  : null
              }
              onPendingTextPlacementChange={(next: { x: number; y: number; fontSize?: number }) => {
                setPendingTextPlacement((prev) =>
                  prev
                    ? {
                        ...prev,
                        x: next.x,
                        y: next.y,
                        fontSize: typeof next.fontSize === "number" && Number.isFinite(next.fontSize) ? next.fontSize : prev.fontSize,
                      }
                    : prev
                );
              }}
              onConfirmTextPlacement={confirmTextPlacement}
              onCancelTextPlacement={cancelTextPlacement}
              traceAdjustMode={traceImage ? traceEditMode || tracePostUpload : false}
              traceLocked={traceLocked}
              onToggleTraceLock={handleToggleTraceLock}
              onTraceTransformStart={beginTraceTransform}
              onTraceTransformEnd={endTraceTransform}
              onTraceOffsetChange={(x: React.SetStateAction<number>, y: React.SetStateAction<number>) => {
                rebaseTraceTransformToCurrentFit();
                setTraceOffsetX(x);
                setTraceOffsetY(y);
              }}
              onTraceScaleChange={(value: number) => {
                rebaseTraceTransformToCurrentFit();
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
              mirrorRect={mirrorRect}
              mirrorSelecting={mirrorSelecting}
              onMirrorDone={() => {
                clearMirrorSelection();
                setTool(mirrorPrevToolRef.current);
                setPanMode(false);
              }}
              onMirrorRectChange={setMirrorRect}
              onMirrorSelectEnd={endMirrorSelection}
              onMirrorApply={applyMirror}
              isNarrow={isNarrow}
              isCompact={isCompact}
              bottomMenuBarHeight={bottomMenuBarHeight}
              toolbarVisible={!isNarrow || mobileToolbarVisible}
              onToolbarCollapsedChange={(collapsed: boolean) => {
                if (!isNarrow) return;
                setMobileToolbarCollapsed(collapsed);
              }}
              setShowGridlines={setShowGridlines}
              setShowRuler={setShowRuler}
              setThreadView={setThreadView}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
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
      {wipStatus &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: "calc(var(--app-header-height, 0px) + env(safe-area-inset-top, 0px) + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 260,
              maxWidth: "min(92vw, 560px)",
              width: "max-content",
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
              textAlign: "center",
              whiteSpace: "normal",
            }}
            role="status"
            aria-live="polite"
          >
            {wipStatus.message}
          </div>,
          document.body
        )}
    </div>
  );
}
