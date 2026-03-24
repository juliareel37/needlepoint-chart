"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import GridCanvas from "./GridCanvas";
import type { Color } from "../../../lib/grid";
import { assetPath } from "../../../lib/assetPath";
import { DMC_PALETTE_BANDS } from "../../../lib/dmcPaletteBands";
import { Toggle } from "../ui/Toggle";
import { sortPaletteByHsv } from "../utils/paletteSort";

export function CanvasWithExportRef(props: any) {
  const {
    width,
    height,
    grid,
    usedColors,
    paletteById,
    symbolMap,
    activeColorId,
    cellSize,
    containerWidth,
    containerHeight,
    showGridlines,
    showRuler,
    tool,
    canvasTool,
    brushSize,
    onBrushSizeChange,
    onToolChange,
    lassoPoints,
    lassoClosed,
    onPickColor,
    onPickColorComplete,
    onLassoReset,
    onLassoPoint,
    onLassoClose,
    onLassoFill,
    onStrokeStart,
    onStrokeEnd,
    onPaintCell,
    onFillCells,
    onFillGrid,
    threadView,
    onTogglePanMode,
    traceImage,
    traceImageUrl,
    traceOpacity,
    traceScale,
    traceOffsetX,
    traceOffsetY,
    pendingTextPlacement,
    onPendingTextPlacementChange,
    onConfirmTextPlacement,
    onCancelTextPlacement,
    traceAdjustMode,
    traceLocked,
    onTraceTransformStart,
    onTraceTransformEnd,
    onTraceScaleChange,
    onTraceOffsetChange,
    panMode,
    onUndo,
    onRedo,
    onClear,
    clearButtonRef,
    canUndo,
    canRedo,
    lastEditCell,
    zoom,
    minZoom,
    maxZoom,
    pinchEnabled,
    onZoomChange,
    onPanOffsetChange,
    restoredPanOffset,
    restoredViewToken,
    resetViewToken,
    darkCanvas,
    onControlsHeightChange,
    onMinZoomChange,
    fitToBoundsToken,
    showSymbols,
    setShowSymbols,
    identifyColorId,
    favoriteColorIds,
    filterMode,
    filterRect,
    filterSelecting,
    onFilterRectChange,
    onFilterSelectEnd,
    onClearFilterSelection,
    mirrorRect,
    mirrorSelecting,
    onMirrorDone,
    onMirrorRectChange,
    onMirrorSelectEnd,
    onMirrorApply,
    isNarrow,
    bottomMenuBarHeight = 64,
    toolbarVisible = true,
    onToolbarCollapsedChange,
    setShowGridlines,
    setShowRuler,
    setThreadView,
    setTraceOpacity,
    tracePostUpload,
    traceEditMode,
    onTraceCancel,
    onTraceSetImage,
    gridBackground,
    isCompact,
    darkMode,
    onDarkModeChange,
  } = props;
  const effectiveCanvasTool = canvasTool ?? tool;

  const activeColor = paletteById.get(activeColorId);
  const canvasCardRef = useRef<HTMLDivElement | null>(null);
  const [canvasCardMaxHeight, setCanvasCardMaxHeight] = useState<number | null>(null);
  const [canvasViewportHeight, setCanvasViewportHeight] = useState<number | null>(null);
  const [centerCanvasTick, setCenterCanvasTick] = useState(0);
  const [focusCell, setFocusCell] = useState<{ x: number; y: number } | null>(null);
  const [focusCellToken, setFocusCellToken] = useState(0);
  const prevFilterSelectingRef = useRef(false);
  const lastFitTokenRef = useRef<number | undefined>(undefined);
  const [fitPending, setFitPending] = useState(false);
  const hasInitializedZoomRef = useRef(false);
  const userZoomedRef = useRef(false);
  const prevPanModeRef = useRef(panMode);
  const [uiReady, setUiReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const [imageOpacityOpen, setImageOpacityOpen] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [zoomCollapsed, setZoomCollapsed] = useState(false);
  const [expandedToolbarHeight, setExpandedToolbarHeight] = useState<number | null>(null);
  const [expandedZoomHeight, setExpandedZoomHeight] = useState<number | null>(null);
  const [sizePopoverLeft, setSizePopoverLeft] = useState<number | null>(null);
  const [sizePopoverTop, setSizePopoverTop] = useState<number | null>(null);
  const [sizePopoverBottom, setSizePopoverBottom] = useState<number | null>(null);
  const [opacityPopoverLeft, setOpacityPopoverLeft] = useState<number | null>(null);
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [colorButtonHovered, setColorButtonHovered] = useState(false);
  const [colorMenuPos, setColorMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [activePalettePanel, setActivePalettePanel] = useState<"all" | "used" | "custom">("all");
  const [activePaletteFamily, setActivePaletteFamily] = useState("All");
  const [filterEditMode, setFilterEditMode] = useState(false);
  const [filterEditRect, setFilterEditRect] = useState(filterRect ?? null);
  const filterEditRectRef = useRef<typeof filterRect | null>(filterRect ?? null);
  const prevFilterRectRef = useRef<typeof filterRect | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const toolbarContentRef = useRef<HTMLDivElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const settingsPopoverRef = useRef<HTMLDivElement | null>(null);
  const brushButtonRef = useRef<HTMLButtonElement | null>(null);
  const eraserButtonRef = useRef<HTMLButtonElement | null>(null);
  const opacityButtonRef = useRef<HTMLButtonElement | null>(null);
  const colorButtonRef = useRef<HTMLButtonElement | null>(null);
  const colorMenuRef = useRef<HTMLDivElement | null>(null);
  const sizePopoverRafRef = useRef<number | null>(null);
  const effectiveTraceOpacity = props.traceVisible ? traceOpacity : 0;
  const opacityPopoverRafRef = useRef<number | null>(null);
  const hasTraceImage = Boolean(traceImage || traceImageUrl);

  useEffect(() => {
    if (!hasTraceImage) {
      setImageOpacityOpen(false);
    }
  }, [hasTraceImage]);

  useEffect(() => {
    if (!settingsOpen) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (settingsButtonRef.current?.contains(target)) return;
      if (settingsPopoverRef.current?.contains(target)) return;
      setSettingsOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [settingsOpen]);
  const mobileToolbarBottomOffset = `calc(${bottomMenuBarHeight}px + env(safe-area-inset-bottom, 0px) + 8px)`;
  const usedColorSet = useMemo(
    () => new Set((usedColors ?? []).map((entry: { color: Color }) => entry.color.id)),
    [usedColors],
  );
  const curatedPaletteIds = useMemo(
    () => new Set<number>(DMC_PALETTE_BANDS.flatMap((band) => band.rows.flat())),
    [],
  );
  const hasUsedColors = usedColorSet.size > 0;

  const effectiveContainerHeight = canvasViewportHeight ?? containerHeight;
  const baseCellSize = zoom ? cellSize / zoom : cellSize;
  const hasFitInputs =
    Number.isFinite(effectiveContainerHeight) &&
    effectiveContainerHeight > 1 &&
    containerWidth > 1 &&
    height > 0 &&
    baseCellSize > 0;
  const fitHeightZoom = hasFitInputs ? effectiveContainerHeight / (height * baseCellSize) : 1;
  const fitWidthZoom = hasFitInputs ? containerWidth / (width * baseCellSize) : 1;
  const limitingFitZoom = Math.min(fitHeightZoom || 1, fitWidthZoom || 1);
  const baseFitZoom = hasFitInputs ? Math.max(0.01, Math.min(1, limitingFitZoom)) : 1;
  const safeBaseFitZoom = Number.isFinite(baseFitZoom) && baseFitZoom > 0 ? baseFitZoom : 1;
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : safeBaseFitZoom;
  const safeMinZoom = Number.isFinite(minZoom) && minZoom > 0 ? minZoom : 0.05;
  const safeMaxZoom =
    Number.isFinite(maxZoom) && maxZoom > 0 ? Math.max(maxZoom, safeMinZoom) : Math.max(8, safeMinZoom);
  const fitTargetZoom = Math.min(safeMaxZoom, Math.max(safeMinZoom, safeBaseFitZoom));
  const zoomDisplay = safeZoom / safeBaseFitZoom;
  const zoomPercent = Math.round(zoomDisplay * 100);
  const [zoomInput, setZoomInput] = useState(String(zoomPercent));
  const zoomStepPercent = zoomDisplay < 1 ? 10 : zoomDisplay < 2 ? 20 : zoomDisplay < 4 ? 35 : 50;
  const paletteEntries = useMemo(() => {
    return sortPaletteByHsv(Array.from(paletteById.values()));
  }, [paletteById]);
  const normalizePaletteFamily = (family?: string | null) => {
    if (!family) return null;
    const key = family.trim().toLowerCase();
    const map: Record<string, string> = {
      red: "red",
      pink: "red",
      orange: "orange",
      yellow: "yellow",
      green: "green",
      blue: "blue",
      purple: "violet",
      violet: "violet",
      gray: "neutrals",
      grey: "neutrals",
      white: "neutrals",
      black: "neutrals",
      beige: "neutrals",
      brown: "neutrals",
      neutral: "neutrals",
      neutrals: "neutrals",
      custom: "neutrals",
    };
    return map[key] ?? key;
  };
  const paletteFamilySwatches: Record<string, string> = {
    red: "#d62b5b",
    orange: "#f27842",
    yellow: "#ffd24d",
    green: "#4caf50",
    blue: "#3b82f6",
    violet: "#8b5cf6",
    neutrals: "#9ca3af",
  };
  const paletteFamilies = useMemo(() => {
    const set = new Set<string>();
    paletteEntries.forEach((c) => {
      const normalized = normalizePaletteFamily(c.family);
      if (normalized) set.add(normalized);
    });
    set.delete("Extracted");
    const order = ["All", "red", "orange", "yellow", "green", "blue", "violet", "neutrals"];
    const rest = Array.from(set).filter((f) => !order.includes(f)).sort();
    return ["All", ...order.filter((f) => f !== "All" && set.has(f)), ...rest];
  }, [paletteEntries]);
  const filteredPaletteEntries = useMemo(() => {
    const panelFiltered =
      activePalettePanel === "used" && hasUsedColors
        ? paletteEntries.filter((color) => usedColorSet.has(color.id))
        : activePalettePanel === "custom"
          ? paletteEntries.filter((color) => !curatedPaletteIds.has(color.id))
          : paletteEntries;
    if (activePalettePanel !== "all") return panelFiltered;
    if (activePaletteFamily === "All") return panelFiltered;
    return panelFiltered.filter((color) => normalizePaletteFamily(color.family) === activePaletteFamily);
  }, [
    activePalettePanel,
    activePaletteFamily,
    hasUsedColors,
    paletteEntries,
    usedColorSet,
    curatedPaletteIds,
  ]);
  const effectiveGridBackground = darkMode ? "#1f252d" : gridBackground ?? "#ffffff";
  const brushSizePresets = [1, 3, 5, 8, 12] as const;
  const normalizedBrushSize = Number.isFinite(brushSize) ? brushSize : 1;
  const closestBrushSizePreset = brushSizePresets.reduce((closest, current) =>
    Math.abs(current - normalizedBrushSize) < Math.abs(closest - normalizedBrushSize) ? current : closest
  );
  const toggleLabel = (icon: string, text: string) => (
    <>
      <img
        src={assetPath(icon)}
        alt=""
        aria-hidden="true"
        width={12}
        height={12}
        style={{ display: "block", filter: "var(--icon-on-bg-filter)", opacity: 0.85 }}
      />
      <span>{text}</span>
    </>
  );

  useEffect(() => {
    if (fitPending) return;
    setZoomInput(String(zoomPercent));
  }, [zoomPercent, fitPending]);

  useEffect(() => {
    if (restoredViewToken === undefined) return;
    userZoomedRef.current = true;
  }, [restoredViewToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateHeights = () => {
      const card = canvasCardRef.current;
      if (!card) return;
      const parentHeight = card.parentElement?.getBoundingClientRect().height ?? window.innerHeight;
      const maxHeight = Math.max(240, Math.floor(parentHeight));
      setCanvasCardMaxHeight(maxHeight);
      const zoomRowHeight = 0;
      const padding = 0;
      const gap = 0;
      const availableCanvasHeight = Math.max(120, maxHeight - zoomRowHeight - padding * 2 - gap);
      setCanvasViewportHeight(availableCanvasHeight);
    };
    updateHeights();
    window.addEventListener("resize", updateHeights);
    return () => window.removeEventListener("resize", updateHeights);
  }, [containerWidth, containerHeight, zoom]);

  useEffect(() => {
    if (!onMinZoomChange) return;
    if (!effectiveContainerHeight || !height || !cellSize || !zoom) {
      onMinZoomChange(null);
      return;
    }
    const baseCellSize = cellSize / (zoom || 1);
    if (!Number.isFinite(baseCellSize) || baseCellSize <= 0) {
      onMinZoomChange(null);
      return;
    }
    const fitHeightZoom = effectiveContainerHeight / (height * baseCellSize);
    const fitWidthZoom = containerWidth / (width * baseCellSize);
    const limitingFitZoom = Math.min(fitHeightZoom, fitWidthZoom);
    if (!Number.isFinite(limitingFitZoom) || limitingFitZoom <= 0) {
      onMinZoomChange(null);
      return;
    }
    onMinZoomChange(limitingFitZoom);
  }, [effectiveContainerHeight, containerWidth, height, width, cellSize, zoom, onMinZoomChange]);

  useEffect(() => {
    if (!hasFitInputs) return;
    if (hasInitializedZoomRef.current) return;
    hasInitializedZoomRef.current = true;
    if (restoredViewToken > 0) return;
    if (hasTraceImage) return;
    onZoomChange(fitTargetZoom);
    setCenterCanvasTick((tick) => tick + 1);
  }, [hasFitInputs, fitTargetZoom, onZoomChange, hasTraceImage, restoredViewToken]);

  useEffect(() => {
    if (!hasFitInputs) return;
    if (fitPending) return;
    if (userZoomedRef.current) return;
    if (hasTraceImage) return;
    if (Math.abs(zoom - fitTargetZoom) < 0.002) return;
    onZoomChange(fitTargetZoom);
    setCenterCanvasTick((tick) => tick + 1);
  }, [hasFitInputs, fitPending, zoom, fitTargetZoom, onZoomChange, hasTraceImage]);

  useEffect(() => {
    if (fitPending) {
      setUiReady(false);
      return;
    }
    const id = requestAnimationFrame(() => setUiReady(true));
    return () => cancelAnimationFrame(id);
  }, [fitPending]);

  useEffect(() => {
    if (panMode) {
      userZoomedRef.current = true;
    }
    if (prevPanModeRef.current && !panMode) {
      userZoomedRef.current = true;
    }
    prevPanModeRef.current = panMode;
  }, [panMode]);

  useEffect(() => {
    if (!colorMenuOpen) return;
    const updatePosition = () => {
      if (!colorButtonRef.current) return;
      const rect = colorButtonRef.current.getBoundingClientRect();
      setColorMenuPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
    };
    updatePosition();
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!target) return;
      if (colorMenuRef.current?.contains(target)) return;
      if (colorButtonRef.current?.contains(target)) return;
      setColorMenuOpen(false);
    };
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [colorMenuOpen]);

  useEffect(() => {
    if (toolbarCollapsed) {
      setColorMenuOpen(false);
    }
  }, [toolbarCollapsed]);

  useEffect(() => {
    if (!filterMode) {
      setFilterEditMode(false);
      setFilterEditRect(null);
    }
  }, [filterMode]);

  useEffect(() => {
    if (!filterEditMode) {
      setFilterEditRect(filterRect ?? null);
      filterEditRectRef.current = filterRect ?? null;
    }
  }, [filterRect, filterEditMode]);

  const handleFilterRectChange = (rect: typeof filterRect | null) => {
    if (filterSelecting || filterEditMode) {
      setFilterEditRect(rect);
      filterEditRectRef.current = rect;
      return;
    }
    onFilterRectChange(rect);
  };

  const handleFilterSelectEnd = () => {
    if (filterSelecting) {
      const nextRect = filterEditRectRef.current ?? filterRect ?? null;
      if (nextRect) {
        onFilterRectChange(nextRect);
        setFilterEditRect(nextRect);
        filterEditRectRef.current = nextRect;
      }
      setFilterEditMode(false);
    }
    onFilterSelectEnd();
  };

  const focusOnCell = (cell: { x: number; y: number }) => {
    setFocusCell(cell);
    setFocusCellToken((tick) => tick + 1);
  };

  useEffect(() => {
    const wasSelecting = prevFilterSelectingRef.current;
    prevFilterSelectingRef.current = filterSelecting;
    if (!wasSelecting || filterSelecting) return;
    if (!filterRect) return;
    if (containerWidth <= 0 || effectiveContainerHeight <= 0) return;
    const rectW = Math.max(1, filterRect.x1 - filterRect.x0 + 1);
    const rectH = Math.max(1, filterRect.y1 - filterRect.y0 + 1);
    const baseCellSize = cellSize / (zoom || 1);
    if (!Number.isFinite(baseCellSize) || baseCellSize <= 0) return;
    let paddedW = rectW;
    let paddedH = rectH;
    const paddingFactor = 1.08;
    if (rectW > rectH) {
      paddedW *= paddingFactor;
    } else if (rectH > rectW) {
      paddedH *= paddingFactor;
    }
    const targetCellSize = Math.min(containerWidth / paddedW, effectiveContainerHeight / paddedH);
    if (!Number.isFinite(targetCellSize) || targetCellSize <= 0) return;
    const nextZoom = Math.min(safeMaxZoom, Math.max(safeMinZoom, targetCellSize / baseCellSize));
    userZoomedRef.current = true;
    onZoomChange(nextZoom);
    focusOnCell({
      x: Math.round((filterRect.x0 + filterRect.x1) / 2),
      y: Math.round((filterRect.y0 + filterRect.y1) / 2),
    });
  }, [
    filterRect,
    filterSelecting,
    containerWidth,
    effectiveContainerHeight,
    cellSize,
    zoom,
    minZoom,
    maxZoom,
    onZoomChange,
  ]);

  function commitZoomInput(value: string) {
    if (value.trim() === "") {
      setZoomInput(String(zoomPercent));
      return;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setZoomInput(String(zoomPercent));
      return;
    }
    const minValue = Math.round((safeMinZoom / safeBaseFitZoom) * 100);
    const maxValue = Math.round((safeMaxZoom / safeBaseFitZoom) * 100);
    const clamped = Math.min(maxValue, Math.max(minValue, parsed));
    userZoomedRef.current = true;
    onZoomChange((clamped / 100) * safeBaseFitZoom);
    setZoomInput(String(Math.round(clamped)));
  }

  function fitToBounds() {
    userZoomedRef.current = true;
    onZoomChange(fitTargetZoom);
    setCenterCanvasTick((tick) => tick + 1);
  }

  function setUserZoom(next: number) {
    userZoomedRef.current = true;
    onZoomChange(next);
  }

  useEffect(() => {
    if (fitToBoundsToken === undefined) return;
    if (!hasFitInputs) return;
    if (fitToBoundsToken === lastFitTokenRef.current) return;
    lastFitTokenRef.current = fitToBoundsToken;
    setFitPending(true);
    fitToBounds();
  }, [fitToBoundsToken, fitTargetZoom, hasFitInputs]);
  useEffect(() => {
    if (!fitPending) return;
    if (Math.abs(zoom - fitTargetZoom) <= 0.01) {
      setFitPending(false);
    }
  }, [fitPending, zoom, fitTargetZoom]);

  useEffect(() => {
    if (!fitPending) return;
    const timeout = window.setTimeout(() => {
      setFitPending(false);
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [fitPending]);

  const controlsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!controlsRef.current || !onControlsHeightChange) return;
    const node = controlsRef.current;
    const notify = () => {
      const height = Math.round(node.getBoundingClientRect().height);
      onControlsHeightChange(height);
      setToolbarHeight(height);
      if (!toolbarCollapsed) {
        setExpandedToolbarHeight(height);
      }
    };
    notify();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => notify());
    observer.observe(node);
    return () => observer.disconnect();
  }, [onControlsHeightChange, toolbarCollapsed]);

  useEffect(() => {
    onToolbarCollapsedChange?.(toolbarCollapsed);
  }, [onToolbarCollapsedChange, toolbarCollapsed]);

  useEffect(() => {
    if (isNarrow && toolbarCollapsed) {
      setToolbarCollapsed(false);
    }
  }, [isNarrow, toolbarCollapsed]);

  const zoomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!zoomRef.current) return;
    const node = zoomRef.current;
    const notify = () => {
      const height = Math.round(node.getBoundingClientRect().height);
      if (!zoomCollapsed) {
        setExpandedZoomHeight(height);
      }
    };
    notify();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => notify());
    observer.observe(node);
    return () => observer.disconnect();
  }, [zoomCollapsed]);

  useEffect(() => {
    if (!canvasCardRef.current) return;
    if (toolbarCollapsed || !sizePopoverOpen) {
      setSizePopoverLeft(null);
      setSizePopoverTop(null);
      setSizePopoverBottom(null);
      return;
    }
    setSizePopoverLeft(null);
    setSizePopoverTop(null);
    setSizePopoverBottom(null);

    const measure = () => {
      if (!canvasCardRef.current) return false;
      const targetRef = tool === "eraser" ? eraserButtonRef.current : brushButtonRef.current;
      if (!targetRef) return false;
      const controlsNode = controlsRef.current;
      if (!controlsNode) return false;
      const cardRect = canvasCardRef.current.getBoundingClientRect();
      const targetRect = targetRef.getBoundingClientRect();
      const controlsRect = controlsNode.getBoundingClientRect();
      if (!targetRect.width || !cardRect.width || !controlsRect.height) return false;
      const left = isNarrow
        ? targetRect.left + targetRect.width / 2
        : targetRect.left - cardRect.left + targetRect.width / 2;
      setSizePopoverLeft(left);
      if (isNarrow) {
        setSizePopoverTop(null);
        setSizePopoverBottom(Math.max(8, window.innerHeight - controlsRect.top + 6));
      } else {
        setSizePopoverBottom(null);
        setSizePopoverTop(controlsRect.bottom - cardRect.top + 6);
      }
      return true;
    };

    let attempts = 0;
    const tryMeasure = () => {
      if (sizePopoverRafRef.current) cancelAnimationFrame(sizePopoverRafRef.current);
      sizePopoverRafRef.current = requestAnimationFrame(() => {
        if (measure()) return;
        if (attempts < 12) {
          attempts += 1;
          tryMeasure();
        }
      });
    };

    let raf2 = 0;
    const scheduleNextFrame = () => {
      if (raf2) cancelAnimationFrame(raf2);
      raf2 = requestAnimationFrame(() => tryMeasure());
    };

    tryMeasure();
    window.addEventListener("resize", tryMeasure);

    let toolbarObserver: ResizeObserver | null = null;
    let targetObserver: ResizeObserver | null = null;
    if (toolbarContentRef.current) {
      toolbarObserver = new ResizeObserver(scheduleNextFrame);
      toolbarObserver.observe(toolbarContentRef.current);
    }
    const targetRef = tool === "eraser" ? eraserButtonRef.current : brushButtonRef.current;
    if (targetRef) {
      targetObserver = new ResizeObserver(scheduleNextFrame);
      targetObserver.observe(targetRef);
    }
    const toolbarNode = toolbarContentRef.current;
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === toolbarNode) {
        scheduleNextFrame();
      }
    };
    toolbarNode?.addEventListener("transitionend", onTransitionEnd);
    return () => {
      if (sizePopoverRafRef.current) {
        cancelAnimationFrame(sizePopoverRafRef.current);
        sizePopoverRafRef.current = null;
      }
      if (raf2) cancelAnimationFrame(raf2);
      window.removeEventListener("resize", tryMeasure);
      toolbarObserver?.disconnect();
      targetObserver?.disconnect();
      toolbarNode?.removeEventListener("transitionend", onTransitionEnd);
    };
  }, [isNarrow, tool, toolbarCollapsed, toolbarHeight, sizePopoverOpen]);

  useEffect(() => {
    if (tool !== "paint" && tool !== "eraser") {
      setSizePopoverOpen(false);
    }
    if (panMode || traceAdjustMode) {
      setSizePopoverOpen(false);
    }
  }, [tool, panMode, traceAdjustMode]);

  useEffect(() => {
    if (!canvasCardRef.current) return;
    if (!imageOpacityOpen || toolbarCollapsed) {
      setOpacityPopoverLeft(null);
      return;
    }

    const measure = () => {
      if (!canvasCardRef.current) return false;
      const targetRef = opacityButtonRef.current;
      if (!targetRef) return false;
      const cardRect = canvasCardRef.current.getBoundingClientRect();
      const targetRect = targetRef.getBoundingClientRect();
      if (!targetRect.width || !cardRect.width) return false;
      const left = targetRect.left - cardRect.left + targetRect.width / 2;
      setOpacityPopoverLeft(left);
      return true;
    };

    let attempts = 0;
    const tryMeasure = () => {
      if (opacityPopoverRafRef.current) cancelAnimationFrame(opacityPopoverRafRef.current);
      opacityPopoverRafRef.current = requestAnimationFrame(() => {
        if (measure()) return;
        if (attempts < 12) {
          attempts += 1;
          tryMeasure();
        }
      });
    };

    let raf2 = 0;
    const scheduleNextFrame = () => {
      if (raf2) cancelAnimationFrame(raf2);
      raf2 = requestAnimationFrame(() => tryMeasure());
    };

    tryMeasure();
    window.addEventListener("resize", tryMeasure);

    let toolbarObserver: ResizeObserver | null = null;
    let targetObserver: ResizeObserver | null = null;
    if (toolbarContentRef.current) {
      toolbarObserver = new ResizeObserver(scheduleNextFrame);
      toolbarObserver.observe(toolbarContentRef.current);
    }
    if (opacityButtonRef.current) {
      targetObserver = new ResizeObserver(scheduleNextFrame);
      targetObserver.observe(opacityButtonRef.current);
    }
    const toolbarNode = toolbarContentRef.current;
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === toolbarNode) {
        scheduleNextFrame();
      }
    };
    toolbarNode?.addEventListener("transitionend", onTransitionEnd);
    return () => {
      if (opacityPopoverRafRef.current) {
        cancelAnimationFrame(opacityPopoverRafRef.current);
        opacityPopoverRafRef.current = null;
      }
      if (raf2) cancelAnimationFrame(raf2);
      window.removeEventListener("resize", tryMeasure);
      toolbarObserver?.disconnect();
      targetObserver?.disconnect();
      toolbarNode?.removeEventListener("transitionend", onTransitionEnd);
    };
  }, [imageOpacityOpen, toolbarCollapsed, toolbarHeight]);

  return (
    <div style={{ display: "grid", gap: 0, height: "100%", minHeight: 0, width: "100%" }}>
      <div
        ref={canvasCardRef}
        style={{
          background: "var(--canvas-card-bg, var(--card-bg))",
          border: "none",
          borderRadius: "var(--canvas-card-radius, 12px)",
          padding:
            "var(--canvas-card-padding-y, var(--canvas-card-padding, 12px)) var(--canvas-card-padding-x, var(--canvas-card-padding, 12px))",
          boxShadow: "var(--canvas-card-shadow, 0 6px 16px var(--ui-border-subtle))",
          display: "grid",
          gap: 10,
          height: "100%",
          maxHeight: "100%",
          minHeight: "100%",
          flex: "1 1 auto",
          overflow: "visible",
          position: "relative",
        }}
      >
        {toolbarVisible && (
        <div
          ref={controlsRef}
          className="canvas-toolbar"
          data-collapsed={toolbarCollapsed ? "true" : undefined}
          data-trace-adjust={traceAdjustMode ? "true" : undefined}
          style={{
            opacity: uiReady ? 1 : 0,
            pointerEvents: uiReady ? "auto" : "none",
            position: isNarrow ? "fixed" : "absolute",
            top: isNarrow ? undefined : 16,
            left: 12,
            bottom: isNarrow ? mobileToolbarBottomOffset : undefined,
            transform: "none",
            zIndex: isNarrow ? 210 : 4,
            background: "var(--canvas-toolbar-bg)",
            border: "none",
            borderRadius: 12,
            padding: "6px 10px",
            boxShadow: "0 8px 18px var(--ui-border)",
            backdropFilter: "blur(6px)",
            overflowY: "visible",
            display: "flex",
            gap: 1,
            alignItems: "var(--canvas-toolbar-align, flex-start)" as React.CSSProperties["alignItems"],
            flexWrap: "var(--canvas-toolbar-wrap, wrap)" as React.CSSProperties["flexWrap"],
            maxWidth: "var(--canvas-toolbar-max-width, calc(100% - 180px))",
            minHeight: toolbarCollapsed ? expandedToolbarHeight ?? undefined : undefined,
            cursor: filterEditMode ? "default" : "auto",
            transition: "background 160ms ease, box-shadow 160ms ease, padding 160ms ease, border-radius 160ms ease",
          }}
        >
          {!isNarrow && (
            <button
              onClick={() => setToolbarCollapsed((value) => !value)}
              aria-pressed={toolbarCollapsed}
              aria-label={toolbarCollapsed ? "Expand toolbar" : "Collapse toolbar"}
              className="toolbar-button toolbar-toggle"
              style={{
                padding: 0,
                width: "auto",
                height: "auto",
                borderRadius: 10,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span className="toolbar-toggle-icon" aria-hidden="true">
                <span
                  style={{
                    fontSize: 14,
                    lineHeight: 1,
                    opacity: 0.7,
                    display: "grid",
                    placeItems: "center",
                    width: 14,
                    height: 14,
                  }}
                >
                  {toolbarCollapsed ? "▾" : "▸"}
                </span>
              </span>
            </button>
          )}
          <div
            className="canvas-toolbar-content"
            ref={toolbarContentRef}
            style={{
              display: "flex",
              gap: 1,
              flexWrap: "var(--canvas-toolbar-wrap, wrap)" as React.CSSProperties["flexWrap"],
              alignItems: "center",
              transformOrigin: "left center",
              transform: toolbarCollapsed ? "scaleX(0)" : "scaleX(1)",
              opacity: toolbarCollapsed ? 0 : filterEditMode ? 0.5 : 1,
              maxWidth: toolbarCollapsed ? 0 : "100%",
              maxHeight: toolbarCollapsed ? 0 : 999,
              overflow: toolbarCollapsed ? "hidden" : "visible",
              transition: "transform 160ms ease, opacity 160ms ease",
              pointerEvents: toolbarCollapsed || filterEditMode ? "none" : "auto",
            }}
          >
            <div className="canvas-toolbar-scroll" style={{ display: "flex", alignItems: "center", gap: 1 }}>
            <div style={{ position: "relative" }}>
              <button
                ref={colorButtonRef}
                onClick={() => setColorMenuOpen((open) => !open)}
                onMouseEnter={() => setColorButtonHovered(true)}
                onMouseLeave={() => setColorButtonHovered(false)}
                aria-pressed={colorMenuOpen}
                aria-label="Select color"
                data-active={colorMenuOpen ? "true" : undefined}
                data-color-swatch="true"
                className="toolbar-button"
                style={{
                  padding: "4px 6px",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 44,
                }}
              >
                <span className="toolbar-icon" aria-hidden="true">
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: activeColor?.hex ?? "transparent",
                      border: colorMenuOpen
                        ? "2px solid var(--accent-strong)"
                        : colorButtonHovered
                          ? "1px solid var(--ui-border-strong)"
                          : "1px solid rgba(255,255,255,0.4)",
                      boxShadow: colorMenuOpen ? "0 0 0 2px var(--accent-soft)" : "none",
                      display: "grid",
                      placeItems: "center",
                      padding: 0,
                      transition: "border-color 120ms ease, box-shadow 120ms ease",
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        background: activeColor?.hex ?? "transparent",
                        display: "inline-block",
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                      }}
                    />
                  </span>
                </span>
              </button>
              {colorMenuOpen && colorMenuPos
                ? createPortal(
                    <div
                      ref={colorMenuRef}
                      style={{
                        position: "fixed",
                        top: colorMenuPos.top,
                        left: colorMenuPos.left,
                        zIndex: 999,
                        background: "var(--surface-elevated)",
                        borderRadius: 12,
                        padding: 8,
                        boxShadow: "0 8px 18px var(--ui-border)",
                        border: "1px solid var(--ui-border-subtle)",
                        overflow: "hidden",
                        display: "grid",
                        gap: 6,
                        minWidth: 200,
                        width: 220,
                        maxWidth: 220,
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: 4,
                          borderRadius: 10,
                          border: "1px solid var(--ui-border-subtle)",
                          background: "var(--ui-surface-soft)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setActivePalettePanel("all")}
                          aria-pressed={activePalettePanel === "all"}
                          data-active={activePalettePanel === "all" ? "true" : undefined}
                          className="menu-tab-button"
                          style={{
                            padding: "6px 10px",
                            flex: "1 1 0",
                            borderRadius: 8,
                            border: "none",
                            color: "var(--foreground)",
                            cursor: "pointer",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePalettePanel("used")}
                          aria-pressed={activePalettePanel === "used"}
                          data-active={activePalettePanel === "used" ? "true" : undefined}
                          className="menu-tab-button"
                          style={{
                            padding: "6px 10px",
                            flex: "1 1 0",
                            borderRadius: 8,
                            border: "none",
                            color: "var(--foreground)",
                            cursor: "pointer",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          Used
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePalettePanel("custom")}
                          aria-pressed={activePalettePanel === "custom"}
                          data-active={activePalettePanel === "custom" ? "true" : undefined}
                          className="menu-tab-button"
                          style={{
                            padding: "6px 10px",
                            flex: "1 1 0",
                            borderRadius: 8,
                            border: "none",
                            color: "var(--foreground)",
                            cursor: "pointer",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          Custom
                        </button>
                      </div>
                      {activePalettePanel === "all" && (
                        <div style={{ display: "grid", gap: 6 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0 8px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                width: "100%",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                              }}
                            >
                              {paletteFamilies
                                .filter((family) => family !== "All")
                                .map((family) => {
                                  const swatch = paletteFamilySwatches[family] ?? "#9ca3af";
                                  const isActive = activePaletteFamily === family;
                                  return (
                                    <button
                                      key={family}
                                      type="button"
                                      onClick={() => setActivePaletteFamily(isActive ? "All" : family)}
                                      aria-pressed={isActive}
                                      aria-label={`Filter ${family}`}
                                      title={family}
                                      style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 6,
                                        background: swatch,
                                        border: isActive
                                          ? "2px solid var(--accent-strong)"
                                          : "1px solid var(--ui-border-strong)",
                                        boxShadow: isActive ? "0 0 0 2px var(--accent-soft)" : "none",
                                        cursor: "pointer",
                                      }}
                                    />
                                  );
                                })}
                            </div>
                          </div>
                          <div style={{ height: 1, background: "var(--ui-border-subtle)" }} />
                        </div>
                      )}
                      {activePalettePanel === "used" && !hasUsedColors ? (
                        <div
                          style={{
                            padding: "10px 8px",
                            borderRadius: 10,
                            border: "none",
                            background: "var(--ui-surface-faint)",
                            textAlign: "center",
                            fontSize: 11,
                            lineHeight: 1.3,
                            color: "var(--foreground)",
                            opacity: 0.75,
                            overflowWrap: "anywhere",
                          }}
                        >
                          No colors used. Let's start painting!
                        </div>
                      ) : activePalettePanel === "custom" && filteredPaletteEntries.length === 0 ? (
                        <div
                          style={{
                            padding: "10px 8px",
                            borderRadius: 10,
                            border: "none",
                            background: "var(--ui-surface-faint)",
                            textAlign: "center",
                            fontSize: 11,
                            lineHeight: 1.3,
                            color: "var(--foreground)",
                            opacity: 0.75,
                            overflowWrap: "anywhere",
                          }}
                        >
                          No custom colors yet.
                        </div>
                      ) : (
                        <div
                          className="toolbar-palette-scroll"
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            columnGap: 6,
                            rowGap: 6,
                            maxHeight: 170,
                            overflowY: "auto",
                            padding: "10px 8px 8px 8px",
                          }}
                        >
                          {filteredPaletteEntries.map((color) => {
                            const usedCount = (usedColors ?? []).find(
                              (entry: { color: Color }) => entry.color.id === color.id,
                            )?.count;
                            const handlePick = () => {
                              onPickColor(color.id);
                              onPickColorComplete();
                              setColorMenuOpen(false);
                            };
                            return (
                              <div
                                key={color.id}
                                style={{
                                  display: "grid",
                                  gap: 2,
                                  justifyItems: "center",
                                  padding: 1,
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={handlePick}
                                  aria-label={color.name}
                                  title={color.name}
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 6,
                                    border:
                                      color.id === activeColorId
                                        ? "2px solid var(--accent-strong)"
                                        : "1px solid rgba(0,0,0,0.18)",
                                    background: color.hex,
                                    cursor: "pointer",
                                    display: "grid",
                                    placeItems: "center",
                                    padding: 0,
                                    overflow: "visible",
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: 5,
                                      background: color.hex,
                                      position: "relative",
                                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                                      display: "block",
                                    }}
                                  >
                                    {usedCount != null && usedCount > 0 && (
                                      <span
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      minWidth: 14,
                                      height: 14,
                                      padding: "0 3px",
                                      borderRadius: 999,
                                      background: "#ffffff",
                                      color: "rgba(15,23,42,0.9)",
                                      fontSize: 8,
                                      fontWeight: 700,
                                      display: "grid",
                                      placeItems: "center",
                                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                      pointerEvents: "none",
                                      transform: "translate(-50%, -50%)",
                                      zIndex: 2,
                                    }}
                                    aria-hidden="true"
                                  >
                                        {usedCount}
                                      </span>
                                    )}
                                  </span>
                                </button>
                                <span
                                  onClick={handlePick}
                                  style={{ fontSize: 9, opacity: 0.75, lineHeight: 1, cursor: "pointer" }}
                                >
                                  {color.code ?? ""}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>,
                    document.body
                  )
                : null}
            </div>
            <button
              onClick={onTogglePanMode}
              aria-pressed={panMode}
              aria-label="Pan"
              data-active={panMode && !traceAdjustMode ? "true" : undefined}
              className="toolbar-button"
              style={{
                padding: "4px 6px",
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                minWidth: 44,
              }}
            >
              <span className="toolbar-icon" aria-hidden="true">
                <img
                  src={assetPath("/icons/pan.svg")}
                  alt=""
                  aria-hidden="true"
                  width={18}
                  height={18}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </span>
              <span className="toolbar-label" style={{ fontSize: 10, lineHeight: 1 }}>
                Pan
              </span>
            </button>
            {(["paint", "eraser", "fill", "lasso", "eyedropper", "mirror"] as const).map((t) => (
              <button
                key={t}
                ref={t === "paint" ? brushButtonRef : t === "eraser" ? eraserButtonRef : null}
                onClick={() => {
                  if (t === "mirror" && tool === "mirror") {
                    onMirrorDone?.();
                    setSizePopoverOpen(false);
                    return;
                  }
                  if (t === "paint" || t === "eraser") {
                    onToolChange(t);
                    if (tool === t) {
                      setSizePopoverOpen((open) => !open);
                    } else {
                      setSizePopoverOpen(true);
                    }
                  } else {
                    onToolChange(t);
                    setSizePopoverOpen(false);
                  }
                }}
                aria-label={
                  t === "paint"
                    ? "Brush"
                    : t === "eraser"
                      ? "Eraser"
                      : t === "fill"
                        ? "Fill"
                        : t === "eyedropper"
                          ? "Eyedropper"
                          : t === "lasso"
                            ? "Lasso"
                            : "Mirror"
                }
                data-active={tool === t && !panMode && !traceAdjustMode ? "true" : undefined}
                className="toolbar-button"
                style={{
                  padding: "4px 6px",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 44,
                }}
              >
                <span className="toolbar-icon" aria-hidden="true">
                  <img
                    src={
                      t === "paint"
                        ? assetPath("/icons/brush.svg")
                        : t === "eraser"
                          ? assetPath("/icons/eraser.svg")
                          : t === "fill"
                            ? assetPath("/icons/paint_bucket.svg")
                            : t === "eyedropper"
                              ? assetPath("/icons/dropper.svg")
                              : t === "lasso"
                                ? assetPath("/icons/lasso.svg")
                                : assetPath("/icons/flip.svg")
                    }
                    alt=""
                    aria-hidden="true"
                    width={18}
                    height={18}
                    style={{
                      display: "block",
                      filter: "var(--icon-on-bg-filter)",
                    }}
                  />
                </span>
                <span className="toolbar-label" style={{ fontSize: 10, lineHeight: 1 }}>
                  {t === "paint"
                    ? "Brush"
                    : t === "eraser"
                      ? "Erase"
                      : t === "fill"
                        ? "Fill"
                        : t === "eyedropper"
                          ? "Pick"
                          : t === "lasso"
                            ? "Lasso"
                            : "Mirror"}
                </span>
              </button>
            ))}
            <button
              ref={clearButtonRef}
              type="button"
              onClick={onClear}
              aria-label="Clear"
              title="Clear"
              className="toolbar-button"
              style={{
                padding: "4px 6px",
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                minWidth: 44,
              }}
            >
              <span className="toolbar-icon" aria-hidden="true">
                <img
                  src={assetPath("/icons/trash.svg")}
                  alt=""
                  aria-hidden="true"
                  width={18}
                  height={18}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </span>
              <span className="toolbar-label" style={{ fontSize: 10, lineHeight: 1 }}>
                Clear
              </span>
            </button>
            {traceImage && (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    width: 1,
                    height: 22,
                    background: "var(--ui-border)",
                    alignSelf: "center",
                    margin: "0 4px",
                  }}
                />
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4, paddingTop: 6 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: -4,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(100,116,139,0.9)",
                      padding: "2px 6px",
                      pointerEvents: "none",
                    }}
                  >
                    Image
                  </span>
                  <button
                    type="button"
                    onClick={props.onToggleTraceVisible}
                    aria-pressed={props.traceVisible}
                    aria-label={props.traceVisible ? "Hide background image" : "Show background image"}
                    className="toolbar-button"
                    style={{
                      padding: "4px 6px",
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      minWidth: 44,
                    }}
                  >
                    <span className="toolbar-icon" aria-hidden="true">
                      <img
                        src={assetPath(props.traceVisible ? "/icons/eye.svg" : "/icons/eye_off.svg")}
                        alt=""
                        aria-hidden="true"
                        width={18}
                        height={18}
                        style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                      />
                    </span>
                    <span className="toolbar-label" style={{ fontSize: 10, lineHeight: 1 }}>
                      {props.traceVisible ? "Visible" : "Hidden"}
                    </span>
                  </button>
                  <button
                    type="button"
                    ref={opacityButtonRef}
                    onClick={() => setImageOpacityOpen((open) => !open)}
                    aria-pressed={imageOpacityOpen}
                    aria-label="Image opacity"
                    data-active={imageOpacityOpen ? "true" : undefined}
                    className="toolbar-button"
                    style={{
                      padding: "4px 6px",
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      minWidth: 44,
                    }}
                  >
                  <span className="toolbar-icon" aria-hidden="true">
                    <img
                      src={assetPath("/icons/gradient.svg")}
                      alt=""
                      aria-hidden="true"
                      width={18}
                      height={18}
                      style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                    />
                  </span>
                  <span className="toolbar-label" style={{ fontSize: 10, lineHeight: 1 }}>
                    Opacity
                  </span>
                </button>
              </div>
            </>
          )}
            </div>
          </div>
        </div>
        )}
        {uiReady && traceImage && !traceLocked && (tracePostUpload || traceEditMode) && (
          <div
            style={{
              position: "absolute",
              top: "78%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 5,
              display: "flex",
              gap: 8,
              alignItems: "center",
              background: "var(--card-bg)",
              borderRadius: 12,
              padding: "8px 10px",
              boxShadow: "var(--ui-shadow-lg)",
              border: "1px solid var(--ui-border-subtle)",
              backdropFilter: "blur(8px)",
            }}
          >
            <button
              type="button"
              onClick={onTraceCancel}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onTraceSetImage}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent-strong)",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Set Image
            </button>
          </div>
        )}
        {uiReady && pendingTextPlacement && (
          <div
            style={{
              position: "absolute",
              bottom: 70,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 6,
              display: "flex",
              gap: 8,
              alignItems: "center",
              background: "var(--card-bg)",
              borderRadius: 12,
              padding: "8px 10px",
              boxShadow: "var(--ui-shadow-lg)",
              border: "1px solid var(--ui-border-subtle)",
              backdropFilter: "blur(8px)",
            }}
          >
            <button
              type="button"
              onClick={onCancelTextPlacement}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmTextPlacement}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent-strong)",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Set
            </button>
          </div>
        )}
        {/*
        {uiReady && filterEditMode && filterEditRect && (
          <div
            style={{
              position: "absolute",
              bottom: 160,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 5,
              display: "flex",
              gap: 8,
              alignItems: "center",
              background: "var(--card-bg)",
              borderRadius: 12,
              padding: "8px 10px",
              boxShadow: "var(--ui-shadow-lg)",
              border: "1px solid var(--ui-border-subtle)",
              backdropFilter: "blur(8px)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                const prev = prevFilterRectRef.current ?? null;
                setFilterEditMode(false);
                setFilterEditRect(prev);
                onFilterRectChange(prev);
              }}
              aria-label="Cancel"
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                fontSize: 18,
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => {
                onFilterRectChange(filterEditRect);
                setFilterEditMode(false);
              }}
              aria-label="Confirm"
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                border: "none",
                background: "var(--accent-strong)",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              ✓
            </button>
          </div>
        )}
        */}
        {uiReady && filterSelecting && !filterEditMode && (
          <div
            style={{
              position: "absolute",
              top: "85%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 5,
              display: "grid",
              gap: 6,
              justifyItems: "center",
              background: "var(--card-bg)",
              borderRadius: 12,
              padding: "8px 12px",
              boxShadow: "var(--ui-shadow-lg)",
              border: "1px solid var(--ui-border-subtle)",
              backdropFilter: "blur(8px)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            <span>Drag on canvas to set your filter area.</span>
            <button
              type="button"
              onClick={() => {
                setFilterEditMode(false);
                setFilterEditRect(null);
                onClearFilterSelection?.();
              }}
              aria-label="Cancel filter selection"
              style={{
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                width: 60,
                height: 22,
                borderRadius: 999,
                fontSize: 12,
                lineHeight: 1,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
        {uiReady && filterMode && filterRect && !filterSelecting && (
          <div
            style={{
              position: "absolute",
              bottom: 70,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              background: "var(--card-bg)",
              borderRadius: 12,
              padding: "8px 12px",
              boxShadow: "var(--ui-shadow-lg)",
              border: "1px solid var(--ui-border-subtle)",
              backdropFilter: "blur(8px)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--foreground)",
              
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => onClearFilterSelection?.()}
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--ui-border-subtle)",
                  background: "var(--muted-bg)",
                  color: "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  prevFilterRectRef.current = filterRect ?? null;
                  setFilterEditMode(true);
                  setFilterEditRect(filterRect);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(191,100,217,0.35)",
                  background: "rgba(191,100,217,0.12)",
                  color: "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Edit selection
              </button>
              {filterEditMode && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const prev = prevFilterRectRef.current ?? null;
                      setFilterEditMode(false);
                      setFilterEditRect(prev);
                      onFilterRectChange(prev);
                    }}
                    aria-label="Cancel"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      border: "1px solid var(--ui-border-subtle)",
                      background: "var(--muted-bg)",
                      color: "var(--foreground)",
                      fontSize: 18,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onFilterRectChange(filterEditRect);
                      setFilterEditMode(false);
                    }}
                    aria-label="Confirm"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      border: "none",
                      background: "var(--accent-strong)",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    ✓
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        {uiReady && tool === "mirror" && mirrorSelecting && (
          <div
            style={{
              position: "absolute",
              top: "85%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 5,
              display: "grid",
              gap: 6,
              justifyItems: "center",
              background: "var(--card-bg)",
              borderRadius: 12,
              padding: "8px 12px",
              boxShadow: "var(--ui-shadow-lg)",
              border: "1px solid var(--ui-border-subtle)",
              backdropFilter: "blur(8px)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            <span>Drag on canvas to set the mirror source area.</span>
            <button
              type="button"
              onClick={() => onMirrorDone?.()}
              style={{
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                width: 60,
                height: 22,
                borderRadius: 999,
                fontSize: 12,
                lineHeight: 1,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
        {uiReady && tool === "mirror" && mirrorRect && !mirrorSelecting && (
          <div
            style={{
              position: "absolute",
              bottom: 70,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 5,
              display: "flex",
              gap: 8,
              alignItems: "center",
              background: "var(--card-bg)",
              borderRadius: 12,
              padding: "8px 12px",
              boxShadow: "var(--ui-shadow-lg)",
              border: "1px solid var(--ui-border-subtle)",
              backdropFilter: "blur(8px)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            <span>Click a shaded direction to mirror this area.</span>
            <button
              type="button"
              onClick={() => onMirrorDone?.()}
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        )}
        {uiReady &&
          toolbarVisible &&
          !toolbarCollapsed &&
          !traceAdjustMode &&
          !panMode &&
          (tool === "paint" || tool === "eraser") &&
          sizePopoverOpen &&
          sizePopoverLeft !== null && (
          <div
            className="canvas-toolbar-size"
            style={{
              position: isNarrow ? "fixed" : "absolute",
              top: isNarrow ? undefined : sizePopoverTop ?? 16 + toolbarHeight + 6,
              bottom: isNarrow ? (sizePopoverBottom != null ? `${sizePopoverBottom}px` : `calc(${mobileToolbarBottomOffset} + ${toolbarHeight}px + 6px)`) : undefined,
              left: sizePopoverLeft,
              transform: "translateX(-50%)",
              zIndex: isNarrow ? 210 : 4,
              background: "var(--surface-floating)",
              border: "none",
              borderRadius: 12,
              padding: "4px 8px",
              boxShadow: "0 8px 18px var(--ui-border)",
              backdropFilter: "blur(6px)",
              display: "flex",
              gap: 4,
              alignItems: "center",
              flexWrap: "nowrap",
            }}
          >
            <span style={{ fontSize: 10, opacity: 0.7 }}>Size</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {brushSizePresets.map((size) => {
                const active = closestBrushSizePreset === size;
                const squarePx = 6 + Math.round((size / 12) * 10);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onBrushSizeChange(size)}
                    aria-label={`Set ${tool === "eraser" ? "eraser" : "brush"} size to ${size}`}
                    aria-pressed={active}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      border: active ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border)",
                      background: active ? "var(--accent-wash)" : "var(--card-bg)",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: squarePx,
                        height: squarePx,
                        borderRadius: 2,
                        background: active ? "var(--accent-strong)" : "var(--foreground)",
                        opacity: active ? 0.9 : 0.6,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {uiReady &&
          toolbarVisible &&
          !toolbarCollapsed &&
          traceImage &&
          imageOpacityOpen &&
          opacityPopoverLeft !== null && (
          <div
            className="canvas-toolbar-size"
            style={{
              position: isNarrow ? "fixed" : "absolute",
              top: isNarrow ? undefined : 16 + toolbarHeight + 6,
              bottom: isNarrow ? `calc(${mobileToolbarBottomOffset} + ${toolbarHeight}px + 6px)` : undefined,
              left: opacityPopoverLeft,
              transform: "translateX(-50%)",
              zIndex: isNarrow ? 210 : 6,
              background: "var(--surface-elevated)",
              borderRadius: 12,
              padding: "8px 10px",
              boxShadow: "0 8px 18px var(--ui-border)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto minmax(0, 1fr) auto",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 10, opacity: 0.7 }}>Opacity</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((Number.isFinite(traceOpacity) ? traceOpacity : 0) * 100)}
                onChange={(e) => setTraceOpacity(parseInt(e.target.value, 10) / 100)}
                style={{ width: 140, cursor: "pointer" }}
              />
              <span
                style={{
                  width: 44,
                  minWidth: 0,
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 2,
                  padding: "3px 5px",
                  borderRadius: 8,
                  border: "1px solid var(--ui-border-subtle)",
                  background: "var(--card-bg)",
                  color: "var(--foreground)",
                }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(Math.round((Number.isFinite(traceOpacity) ? traceOpacity : 0) * 100))}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, "");
                    if (!digits) return;
                    const next = Number(digits);
                    if (!Number.isFinite(next)) return;
                    setTraceOpacity(Math.max(0, Math.min(100, Math.round(next))) / 100);
                  }}
                  aria-label="Opacity percentage"
                  style={{
                    minWidth: 0,
                    width: "100%",
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    color: "inherit",
                    fontSize: 10,
                    fontWeight: 400,
                    textAlign: "left",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: 10, opacity: 0.72 }}>%</span>
              </span>
            </div>
          </div>
        )}
        <div
          className="zoom-shell"
          style={{
            opacity: uiReady ? 1 : 0,
            pointerEvents: uiReady ? "auto" : "none",
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 60,
            display: "flex",
            alignItems: "stretch",
            gap: 8,
          }}
        >
          <div
            className="zoom-floating"
            ref={zoomRef}
            style={{
              display: "flex",
              alignItems: "center",
              gap: zoomCollapsed ? 0 : 8,
              padding: zoomCollapsed ? "6px 4px" : "6px 8px",
              borderRadius: 12,
              background: "var(--canvas-toolbar-bg)",
              backdropFilter: "blur(6px)",
              boxShadow: "0 8px 18px var(--ui-border)",
              minWidth: 0,
              minHeight: zoomCollapsed ? expandedZoomHeight ?? undefined : undefined,
              transition:
                "background 160ms ease, box-shadow 160ms ease, padding 160ms ease, border-radius 160ms ease",
            }}
          >
          <div
            className="zoom-toolbar-content"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              transformOrigin: "right center",
              transform: zoomCollapsed ? "scaleX(0)" : "scaleX(1)",
              opacity: zoomCollapsed ? 0 : 1,
              maxWidth: zoomCollapsed ? 0 : "100%",
              maxHeight: zoomCollapsed ? 0 : 999,
              overflow: "hidden",
              transition: "transform 160ms ease, opacity 160ms ease",
              pointerEvents: zoomCollapsed ? "none" : "auto",
            }}
          >
          <button
            onClick={() => {
              if (!lastEditCell) return;
              focusOnCell(lastEditCell);
            }}
            disabled={!lastEditCell}
            aria-label="Jump to last edit"
            title="Jump to last edit"
            style={{
              padding: "4px 6px",
              borderRadius: 8,
              border: "none",
              background: "var(--muted-bg)",
              color: "var(--foreground)",
              cursor: lastEditCell ? "pointer" : "not-allowed",
              opacity: lastEditCell ? 1 : 0.5,
              fontSize: 12,
            }}
          >
            <img
              src={assetPath("/icons/jump_to_element.svg")}
              alt=""
              aria-hidden="true"
              width={18}
              height={18}
              style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
            />
          </button>
          <button
            onClick={() => {
              fitToBounds();
            }}
            aria-label="Fit"
            title="Fit"
            style={{
              padding: "4px 6px",
              borderRadius: 8,
              border: "none",
              background: "var(--muted-bg)",
              color: "var(--foreground)",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            <img
              src={assetPath("/icons/fit_width.svg")}
              alt=""
              aria-hidden="true"
              width={18}
              height={18}
              style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
            />
          </button>
          <button
            onClick={() => {
              const minPercent = Math.round((safeMinZoom / safeBaseFitZoom) * 100);
              const next = Math.max(minPercent, zoomPercent - zoomStepPercent);
              setUserZoom((next / 100) * safeBaseFitZoom);
            }}
            style={{
              padding: "4px 6px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--foreground)",
              cursor: "pointer",
            }}
          >
            -
          </button>
          <input
            type="range"
            min={Math.round((safeMinZoom / safeBaseFitZoom) * 100)}
            max={Math.round((safeMaxZoom / safeBaseFitZoom) * 100)}
            value={Math.round((safeZoom / safeBaseFitZoom) * 100)}
            onChange={(e) => setUserZoom((parseInt(e.target.value, 10) / 100) * safeBaseFitZoom)}
            style={{ width: 120 }}
          />
          <button
            onClick={() => {
              const maxPercent = Math.round((safeMaxZoom / safeBaseFitZoom) * 100);
              const next = Math.min(maxPercent, zoomPercent + zoomStepPercent);
              setUserZoom((next / 100) * safeBaseFitZoom);
            }}
            style={{
              padding: "4px 6px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--foreground)",
              cursor: "pointer",
            }}
          >
            +
          </button>
          <span
            style={{
              width: 44,
              minWidth: 0,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 2,
              padding: "3px 5px",
              borderRadius: 8,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--card-bg)",
              color: "var(--foreground)",
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              value={zoomInput}
              onChange={(e) => {
                const next = e.target.value.replace(/[^\d]/g, "");
                setZoomInput(next);
              }}
              onBlur={(e) => commitZoomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitZoomInput((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              style={{
                minWidth: 0,
                width: "100%",
                padding: 0,
                border: "none",
                background: "transparent",
                color: "inherit",
                fontSize: 10,
                fontWeight: 400,
                textAlign: "left",
                outline: "none",
              }}
            />
            <span style={{ fontSize: 10, opacity: 0.72 }}>%</span>
          </span>
          </div>
          <button
            onClick={() => setZoomCollapsed((value) => !value)}
            aria-pressed={zoomCollapsed}
            aria-label={zoomCollapsed ? "Expand zoom toolbar" : "Collapse zoom toolbar"}
            className="zoom-caret"
            style={{
              padding: "4px 6px",
              borderRadius: 8,
              border: "none",
              background: "var(--muted-bg)",
              color: "var(--foreground)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {zoomCollapsed ? "▴" : "◂"}
          </button>
          </div>
          {!isCompact && <div className="settings-floating" style={{ display: "flex" }}>
            <button
              ref={settingsButtonRef}
              onClick={() => setSettingsOpen((open) => !open)}
              aria-pressed={settingsOpen}
              aria-label="Canvas settings"
              title="Canvas settings"
              className="zoom-settings-toggle"
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: "none",
                background: "var(--canvas-toolbar-bg)",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                backdropFilter: "blur(6px)",
                boxShadow: "0 8px 18px var(--ui-border)",
                height: "100%",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 12,
                  lineHeight: 1,
                  color: "var(--foreground)",
                  opacity: 0.7,
                }}
              >
                {settingsOpen ? "▴" : "◂"}
              </span>
              <img
                src={assetPath("/icons/settings.svg")}
                alt=""
                aria-hidden="true"
                width={18}
                height={18}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
            </button>
          </div>}
        </div>
        {uiReady && !isCompact && settingsOpen && (
          <div
            ref={settingsPopoverRef}
            style={{
              position: "fixed",
              right: 16,
              bottom: 72,
              zIndex: 60,
              background: "var(--surface-elevated)",
              borderRadius: 12,
              padding: "10px 12px",
              boxShadow: "0 8px 18px var(--ui-border)",
              backdropFilter: "blur(6px)",
              display: "grid",
              gap: 10,
              minWidth: 104,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <Toggle label={toggleLabel("/icons/grid3.svg", "Gridlines")} checked={showGridlines} onChange={setShowGridlines} />
              <Toggle label={toggleLabel("/icons/sqfoot.svg", "Ruler")} checked={showRuler} onChange={setShowRuler} />
              <Toggle label={toggleLabel("/icons/thread.svg", "Thread view")} checked={threadView} onChange={setThreadView} />
              <Toggle label={toggleLabel("/icons/glyphs.svg", "Symbols")} checked={showSymbols} onChange={setShowSymbols} />
              <Toggle label={toggleLabel("/icons/moon.svg", "Dark mode")} checked={darkMode} onChange={onDarkModeChange} />
            </div>
          </div>
        )}
        <div style={{ opacity: uiReady ? 1 : 0, pointerEvents: uiReady ? "auto" : "none" }}>
          <GridCanvas
            width={width}
            height={height}
            grid={grid}
            paletteById={paletteById}
            symbolMap={symbolMap}
            activeColorId={activeColorId}
            identifyColorId={identifyColorId}
            cellSize={cellSize}
            containerWidth={containerWidth}
            containerHeight={effectiveContainerHeight}
            showGridlines={showGridlines}
            showRuler={showRuler}
            tool={effectiveCanvasTool}
            brushSize={brushSize}
            lassoPoints={lassoPoints}
            lassoClosed={lassoClosed}
            onPickColor={onPickColor}
            onPickColorComplete={onPickColorComplete}
            onLassoReset={onLassoReset}
            onLassoPoint={onLassoPoint}
            onLassoClose={onLassoClose}
            onLassoFill={onLassoFill}
            onStrokeStart={onStrokeStart}
            onStrokeEnd={onStrokeEnd}
            onPaintCell={onPaintCell}
            onFillCells={onFillCells}
            onFillGrid={onFillGrid}
            threadView={threadView}
            darkCanvas={darkCanvas}
            panMode={panMode}
            showSymbols={showSymbols}
            traceImage={traceImage}
            traceOpacity={effectiveTraceOpacity}
            traceScale={traceScale}
            traceOffsetX={traceOffsetX}
            traceOffsetY={traceOffsetY}
            pendingTextPlacement={pendingTextPlacement}
            onPendingTextPlacementChange={onPendingTextPlacementChange}
            traceAdjustMode={traceAdjustMode}
            onTraceTransformStart={onTraceTransformStart}
            onTraceTransformEnd={onTraceTransformEnd}
            onTraceOffsetChange={onTraceOffsetChange}
            onTraceScaleChange={onTraceScaleChange}
            gridBackground={effectiveGridBackground}
            zoom={zoom}
            minZoom={minZoom}
            maxZoom={maxZoom}
            pinchEnabled={pinchEnabled}
            onZoomChange={setUserZoom}
            onPanOffsetChange={onPanOffsetChange}
            restoredPanOffset={restoredPanOffset}
            restoredPanToken={restoredViewToken}
            resetPanToken={resetViewToken}
            centerCanvasToken={centerCanvasTick}
            focusCell={focusCell}
            focusCellToken={focusCellToken}
            filterRect={filterEditMode ? filterEditRect : filterRect}
            filterSelecting={filterEditMode ? false : filterSelecting}
            filterEditMode={filterEditMode}
            onFilterRectChange={handleFilterRectChange}
            onFilterSelectEnd={handleFilterSelectEnd}
            mirrorRect={mirrorRect}
            mirrorSelecting={mirrorSelecting}
            onMirrorRectChange={onMirrorRectChange}
            onMirrorSelectEnd={onMirrorSelectEnd}
            onMirrorApply={onMirrorApply}
          />
        </div>
        {!uiReady && (
          <div
            aria-busy="true"
            style={{
              position: "absolute",
              inset: 12,
              borderRadius: 10,
              background: "var(--canvas-surround-bg)",
              display: "grid",
              placeItems: "center",
              color: "var(--foreground)",
              fontSize: 12,
              zIndex: 2,
            }}
          >
            <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
              <div className="loading-spinner" aria-hidden="true" />
              <span>Loading canvas…</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
