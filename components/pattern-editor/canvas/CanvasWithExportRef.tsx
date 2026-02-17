"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import GridCanvas from "./GridCanvas";
import type { Color } from "../../../lib/grid";
import { idx } from "../../../lib/grid";
import { symbolForColorId } from "../../../lib/symbols";
import { assetPath } from "../../../lib/assetPath";
import { EXPORT_CELL_SIZE } from "../utils/constants";
import { contrastForHex, hexToRgb } from "../utils/colorUtils";
import { Toggle } from "../ui/Toggle";

export function CanvasWithExportRef(props: any) {
  const {
    exportCanvasRef,
    width,
    height,
    grid,
    paletteById,
    symbolMap,
    activeColorId,
    cellSize,
    containerWidth,
    containerHeight,
    showGridlines,
    tool,
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
    traceAdjustMode,
    traceLocked,
    onToggleTraceLock,
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
    darkCanvas,
    onControlsHeightChange,
    onMinZoomChange,
    fitToBoundsToken,
    showSymbols,
    setShowSymbols,
    identifyColorId,
    filterMode,
    filterRect,
    filterSelecting,
    onFilterRectChange,
    onFilterSelectEnd,
    isNarrow,
    setShowGridlines,
    setThreadView,
    setTraceOpacity,
    tracePostUpload,
    traceEditMode,
    onTraceCancel,
    onTraceSetImage,
    gridBackground,
  } = props;

  const exportCellSize = EXPORT_CELL_SIZE;
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
  const [opacityPopoverLeft, setOpacityPopoverLeft] = useState<number | null>(null);
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [colorMenuPos, setColorMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [filterEditMode, setFilterEditMode] = useState(false);
  const [filterEditRect, setFilterEditRect] = useState(filterRect ?? null);
  const prevFilterRectRef = useRef<typeof filterRect | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const toolbarContentRef = useRef<HTMLDivElement | null>(null);
  const brushButtonRef = useRef<HTMLButtonElement | null>(null);
  const eraserButtonRef = useRef<HTMLButtonElement | null>(null);
  const opacityButtonRef = useRef<HTMLButtonElement | null>(null);
  const colorButtonRef = useRef<HTMLButtonElement | null>(null);
  const colorMenuRef = useRef<HTMLDivElement | null>(null);
  const sizePopoverRafRef = useRef<number | null>(null);
  const opacityPopoverRafRef = useRef<number | null>(null);
  const hasTraceImage = Boolean(traceImage || traceImageUrl);

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
  const zoomDisplay = zoom / baseFitZoom;
  const zoomPercent = Math.round(zoomDisplay * 100);
  const [zoomInput, setZoomInput] = useState(String(zoomPercent));
  const zoomStepPercent = zoomDisplay < 1 ? 10 : zoomDisplay < 2 ? 20 : zoomDisplay < 4 ? 35 : 50;
  const paletteEntries = useMemo(() => {
    const toHsl = (hex: string) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return { h: 0, s: 0, l: 0 };
      const r = rgb.r / 255;
      const g = rgb.g / 255;
      const b = rgb.b / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      let h = 0;
      if (delta > 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
      }
      const l = (max + min) / 2;
      const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
      return { h, s, l };
    };

    return Array.from(paletteById.values())
      .map((color) => ({ color, hsl: toHsl(color.hex) }))
      .sort((a, b) => {
        const aNeutral = a.hsl.s < 0.08;
        const bNeutral = b.hsl.s < 0.08;
        if (aNeutral !== bNeutral) return aNeutral ? 1 : -1;
        if (a.hsl.h !== b.hsl.h) return a.hsl.h - b.hsl.h;
        if (a.hsl.s !== b.hsl.s) return b.hsl.s - a.hsl.s;
        return a.hsl.l - b.hsl.l;
      })
      .map((entry) => entry.color);
  }, [paletteById]);

  useEffect(() => {
    if (fitPending) return;
    setZoomInput(String(zoomPercent));
  }, [zoomPercent, fitPending]);

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
    if (hasTraceImage) return;
    onZoomChange(baseFitZoom);
    setCenterCanvasTick((tick) => tick + 1);
  }, [hasFitInputs, baseFitZoom, onZoomChange, hasTraceImage]);

  useEffect(() => {
    if (!hasFitInputs) return;
    if (fitPending) return;
    if (userZoomedRef.current) return;
    if (hasTraceImage) return;
    if (Math.abs(zoom - baseFitZoom) < 0.002) return;
    onZoomChange(baseFitZoom);
    setCenterCanvasTick((tick) => tick + 1);
  }, [hasFitInputs, fitPending, zoom, baseFitZoom, onZoomChange, hasTraceImage]);

  useEffect(() => {
    if (!hasFitInputs || fitPending) {
      setUiReady(false);
      return;
    }
    const id = requestAnimationFrame(() => setUiReady(true));
    return () => cancelAnimationFrame(id);
  }, [hasFitInputs, fitPending]);

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
    }
  }, [filterRect, filterEditMode]);

  const handleFilterRectChange = (rect: typeof filterRect | null) => {
    if (filterSelecting || filterEditMode) {
      setFilterEditRect(rect);
      return;
    }
    onFilterRectChange(rect);
  };

  const handleFilterSelectEnd = () => {
    if (filterSelecting) {
      prevFilterRectRef.current = filterRect ?? null;
      setFilterEditMode(true);
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
    const nextZoom = Math.min(maxZoom, Math.max(minZoom, targetCellSize / baseCellSize));
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
    const minValue = Math.round((minZoom / baseFitZoom) * 100);
    const maxValue = Math.round((maxZoom / baseFitZoom) * 100);
    const clamped = Math.min(maxValue, Math.max(minValue, parsed));
    userZoomedRef.current = true;
    onZoomChange((clamped / 100) * baseFitZoom);
    setZoomInput(String(Math.round(clamped)));
  }

  function fitToBounds() {
    userZoomedRef.current = true;
    onZoomChange(baseFitZoom);
    setCenterCanvasTick((tick) => tick + 1);
  }

  function setUserZoom(next: number) {
    userZoomedRef.current = true;
    onZoomChange(next);
  }

  useEffect(() => {
    if (fitToBoundsToken === undefined) return;
    if (fitToBoundsToken === lastFitTokenRef.current) return;
    lastFitTokenRef.current = fitToBoundsToken;
    setFitPending(true);
    fitToBounds();
  }, [fitToBoundsToken, baseFitZoom]);
  useEffect(() => {
    if (!fitPending) return;
    if (Math.abs(zoomDisplay - 1) <= 0.01) {
      setFitPending(false);
    }
  }, [fitPending, zoomDisplay]);

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
      return;
    }
    setSizePopoverLeft(null);

    const measure = () => {
      if (!canvasCardRef.current) return false;
      const targetRef = tool === "eraser" ? eraserButtonRef.current : brushButtonRef.current;
      if (!targetRef) return false;
      const cardRect = canvasCardRef.current.getBoundingClientRect();
      const targetRect = targetRef.getBoundingClientRect();
      if (!targetRect.width || !cardRect.width) return false;
      const left = targetRect.left - cardRect.left + targetRect.width / 2;
      setSizePopoverLeft(left);
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
  }, [tool, toolbarCollapsed, toolbarHeight, sizePopoverOpen]);

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
          boxShadow: "var(--canvas-card-shadow, 0 6px 16px rgba(15, 23, 42, 0.12))",
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
        <div
          ref={controlsRef}
          className="canvas-toolbar"
          data-collapsed={toolbarCollapsed ? "true" : undefined}
          data-trace-adjust={traceAdjustMode ? "true" : undefined}
          style={{
            opacity: uiReady ? 1 : 0,
            pointerEvents: uiReady ? "auto" : "none",
            position: "absolute",
            top: 16,
            left: 12,
            transform: "none",
            zIndex: 4,
            background: "var(--canvas-toolbar-bg, rgba(255,255,255,0.92))",
            border: "none",
            borderRadius: 12,
            padding: "4px 8px",
            boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
            backdropFilter: "blur(6px)",
            display: "flex",
            gap: 4,
            alignItems: "var(--canvas-toolbar-align, flex-start)" as React.CSSProperties["alignItems"],
            flexWrap: "var(--canvas-toolbar-wrap, wrap)" as React.CSSProperties["flexWrap"],
            maxWidth: "var(--canvas-toolbar-max-width, calc(100% - 180px))",
            minHeight: toolbarCollapsed ? expandedToolbarHeight ?? undefined : undefined,
            transition: "background 160ms ease, box-shadow 160ms ease, padding 160ms ease, border-radius 160ms ease",
          }}
        >
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
          <div
            className="canvas-toolbar-content"
            ref={toolbarContentRef}
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "var(--canvas-toolbar-wrap, wrap)" as React.CSSProperties["flexWrap"],
              alignItems: "center",
              transformOrigin: "left center",
              transform: toolbarCollapsed ? "scaleX(0)" : "scaleX(1)",
              opacity: toolbarCollapsed ? 0 : 1,
              maxWidth: toolbarCollapsed ? 0 : "100%",
              maxHeight: toolbarCollapsed ? 0 : 999,
              overflow: "hidden",
              transition: "transform 160ms ease, opacity 160ms ease",
              pointerEvents: toolbarCollapsed ? "none" : "auto",
            }}
          >
            <div className="canvas-toolbar-scroll" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ position: "relative" }}>
              <button
                ref={colorButtonRef}
                onClick={() => setColorMenuOpen((open) => !open)}
                aria-pressed={colorMenuOpen}
                aria-label="Select color"
                className="toolbar-button"
                style={{
                  padding: "2px 6px",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "grid",
                  gap: 1,
                  justifyItems: "center",
                }}
              >
                <span className="toolbar-icon" aria-hidden="true">
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      background: activeColor?.hex ?? "transparent",
                      border: "1px solid rgba(0,0,0,0.2)",
                      display: "inline-block",
                    }}
                  />
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
                        background: "rgba(255,255,255,0.98)",
                        borderRadius: 12,
                        padding: 8,
                        boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
                        border: "1px solid rgba(15,23,42,0.12)",
                        maxHeight: 180,
                        overflowY: "auto",
                        display: "grid",
                        gridTemplateColumns: "repeat(6, 1fr)",
                        gap: 6,
                        minWidth: 180,
                      }}
                    >
                      {paletteEntries.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            onPickColor(color.id);
                            onPickColorComplete();
                            setColorMenuOpen(false);
                          }}
                          aria-label={color.name}
                          title={color.name}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border:
                              color.id === activeColorId
                                ? "2px solid var(--accent-strong)"
                                : "1px solid rgba(0,0,0,0.18)",
                            background: color.hex,
                            cursor: "pointer",
                          }}
                        />
                      ))}
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
                padding: "2px 6px",
                borderRadius: 10,
                cursor: "pointer",
                display: "grid",
                gap: 1,
                justifyItems: "center",
              }}
            >
              <span className="toolbar-icon" aria-hidden="true">
                <img
                  src={assetPath("/pan.svg")}
                  alt=""
                  aria-hidden="true"
                  width={18}
                  height={18}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </span>
              <span className="toolbar-label" style={{ fontSize: 11, opacity: 0.7 }}>
                Pan
              </span>
            </button>
            {(["paint", "eraser", "fill", "lasso", "eyedropper"] as const).map((t) => (
              <button
                key={t}
                ref={t === "paint" ? brushButtonRef : t === "eraser" ? eraserButtonRef : null}
                onClick={() => {
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
                      : "Lasso"
                }
                data-active={tool === t && !panMode && !traceAdjustMode ? "true" : undefined}
                className="toolbar-button"
                style={{
                  padding: "2px 6px",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "grid",
                  gap: 1,
                  justifyItems: "center",
                }}
              >
                <span className="toolbar-icon" aria-hidden="true">
                  <img
                    src={
                      t === "paint"
                        ? assetPath("/brush.svg")
                        : t === "eraser"
                          ? assetPath("/eraser.svg")
                          : t === "fill"
                            ? assetPath("/paint_bucket.svg")
                            : t === "eyedropper"
                              ? assetPath("/dropper.svg")
                              : assetPath("/lasso.svg")
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
                <span className="toolbar-label" style={{ fontSize: 11, opacity: 0.7 }}>
                  {t === "paint"
                    ? "Brush"
                    : t === "eraser"
                      ? "Eraser"
                      : t === "fill"
                        ? "Fill"
                        : t === "eyedropper"
                          ? "Eyedropper"
                          : "Lasso"}
                </span>
              </button>
            ))}
            {traceImage && (
              <>
                <button
                  ref={opacityButtonRef}
                  onClick={() => setImageOpacityOpen((open) => !open)}
                  aria-pressed={imageOpacityOpen}
                  aria-label="Image opacity"
                  data-active={imageOpacityOpen ? "true" : undefined}
                  className="toolbar-button"
                  style={{
                    padding: "2px 6px",
                    borderRadius: 10,
                    cursor: "pointer",
                    display: "grid",
                    gap: 1,
                    justifyItems: "center",
                  }}
                >
                  <span className="toolbar-icon" aria-hidden="true">
                    <img
                      src={assetPath("/gradient.svg")}
                      alt=""
                      aria-hidden="true"
                      width={18}
                      height={18}
                      style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                    />
                  </span>
                  <span className="toolbar-label" style={{ fontSize: 11, opacity: 0.7 }}>
                    Opacity
                  </span>
                </button>
                <button
                  onClick={onToggleTraceLock}
                  aria-label="Reposition"
                  data-active={traceAdjustMode ? "true" : undefined}
                  className="toolbar-button"
                  style={{
                    padding: "2px 6px",
                    borderRadius: 10,
                    cursor: "pointer",
                    display: "grid",
                    gap: 1,
                    justifyItems: "center",
                  }}
                >
                  <span className="toolbar-icon" aria-hidden="true">
                    <img
                      src={assetPath("/transform.svg")}
                      alt=""
                      aria-hidden="true"
                      width={18}
                      height={18}
                      style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                    />
                  </span>
                  <span className="toolbar-label" style={{ fontSize: 11, opacity: 0.7 }}>
                    Reposition
                  </span>
                </button>
              </>
            )}
            </div>
          </div>
        </div>
        {uiReady && traceImage && !traceLocked && (tracePostUpload || traceEditMode) && (
          <div
            style={{
              position: "absolute",
              top: "85%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 5,
              display: "flex",
              gap: 8,
              alignItems: "center",
              background: "var(--card-bg)",
              borderRadius: 12,
              padding: "8px 10px",
              boxShadow: "0 10px 22px rgba(15,23,42,0.14)",
              border: "1px solid rgba(15,23,42,0.12)",
              backdropFilter: "blur(8px)",
            }}
          >
            <button
              type="button"
              onClick={onTraceCancel}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(15,23,42,0.12)",
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
        {uiReady && filterEditMode && filterEditRect && (
          <div
            style={{
              position: "absolute",
              top: "85%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 5,
              display: "flex",
              gap: 8,
              alignItems: "center",
              background: "var(--card-bg)",
              borderRadius: 12,
              padding: "8px 10px",
              boxShadow: "0 10px 22px rgba(15,23,42,0.14)",
              border: "1px solid rgba(15,23,42,0.12)",
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
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(15,23,42,0.12)",
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
                onFilterRectChange(filterEditRect);
                setFilterEditMode(false);
              }}
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
              OK
            </button>
          </div>
        )}
        {uiReady &&
          !toolbarCollapsed &&
          !traceAdjustMode &&
          !panMode &&
          (tool === "paint" || tool === "eraser") &&
          sizePopoverOpen &&
          sizePopoverLeft !== null && (
          <div
            className="canvas-toolbar-size"
            style={{
              position: "absolute",
              top: 16 + toolbarHeight + 6,
              left: sizePopoverLeft,
              transform: "translateX(-50%)",
              zIndex: 4,
              background: "rgba(255,255,255,0.92)",
              border: "none",
              borderRadius: 12,
              padding: "4px 8px",
              boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
              backdropFilter: "blur(6px)",
              display: "flex",
              gap: 4,
              alignItems: "center",
              flexWrap: "nowrap",
            }}
          >
            <span style={{ fontSize: 10, opacity: 0.7 }}>Size</span>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={brushSize}
              onChange={(e) => onBrushSizeChange(parseInt(e.target.value, 10))}
            />
            <span style={{ fontSize: 10, opacity: 0.7 }}>{brushSize}</span>
          </div>
        )}
        {uiReady &&
          !toolbarCollapsed &&
          traceImage &&
          imageOpacityOpen &&
          opacityPopoverLeft !== null && (
          <div
            className="canvas-toolbar-size"
            style={{
              position: "absolute",
              top: 16 + toolbarHeight + 6,
              left: opacityPopoverLeft,
              transform: "translateX(-50%)",
              zIndex: 6,
              background: "rgba(255,255,255,0.96)",
              borderRadius: 12,
              padding: "8px 10px",
              boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div style={{ display: "grid", gap: 2 }}>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((traceOpacity ?? 0) * 100)}
                onChange={(e) => setTraceOpacity(parseInt(e.target.value, 10) / 100)}
                style={{ width: 140 }}
              />
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
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(6px)",
              boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
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
              src={assetPath("/jump_to_element.svg")}
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
              src={assetPath("/fit_width.svg")}
              alt=""
              aria-hidden="true"
              width={18}
              height={18}
              style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
            />
          </button>
          <button
            onClick={() => {
              const minPercent = Math.round((minZoom / baseFitZoom) * 100);
              const next = Math.max(minPercent, zoomPercent - zoomStepPercent);
              setUserZoom((next / 100) * baseFitZoom);
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
            min={Math.round((minZoom / baseFitZoom) * 100)}
            max={Math.round((maxZoom / baseFitZoom) * 100)}
            value={Math.round((zoom / baseFitZoom) * 100)}
            onChange={(e) => setUserZoom((parseInt(e.target.value, 10) / 100) * baseFitZoom)}
            style={{ width: 120 }}
          />
          <button
            onClick={() => {
              const maxPercent = Math.round((maxZoom / baseFitZoom) * 100);
              const next = Math.min(maxPercent, zoomPercent + zoomStepPercent);
              setUserZoom((next / 100) * baseFitZoom);
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
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
                width: 44,
                height: 22,
                padding: "0 6px",
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.2)",
                fontSize: 12,
                lineHeight: "20px",
                background: "white",
              }}
            />
            <span style={{ fontSize: 12, opacity: 0.7 }}>%</span>
          </div>
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
          <div className="settings-floating" style={{ display: "flex" }}>
            <button
              onClick={() => setSettingsOpen((open) => !open)}
              aria-pressed={settingsOpen}
              aria-label="Canvas settings"
              title="Canvas settings"
              className="zoom-settings-toggle"
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: "none",
                background: settingsOpen ? "var(--accent-wash)" : "rgba(255,255,255,0.92)",
                color: settingsOpen ? "var(--accent-strong)" : "var(--foreground)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                backdropFilter: "blur(6px)",
                boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
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
                src={assetPath("/settings.svg")}
                alt=""
                aria-hidden="true"
                width={18}
                height={18}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
            </button>
          </div>
        </div>
        {uiReady && settingsOpen && (
          <div
            style={{
              position: "fixed",
              right: 16,
              bottom: 72,
              zIndex: 60,
              background: "rgba(255,255,255,0.96)",
              borderRadius: 12,
              padding: "10px 12px",
              boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
              backdropFilter: "blur(6px)",
              display: "grid",
              gap: 10,
              minWidth: 104,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <Toggle label="Gridlines" checked={showGridlines} onChange={setShowGridlines} />
              <Toggle label="Thread view" checked={threadView} onChange={setThreadView} />
              <Toggle label="Color symbols" checked={showSymbols} onChange={setShowSymbols} />
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
            tool={tool}
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
            traceOpacity={traceOpacity}
            traceScale={traceScale}
            traceOffsetX={traceOffsetX}
            traceOffsetY={traceOffsetY}
            traceAdjustMode={traceAdjustMode}
            onTraceOffsetChange={onTraceOffsetChange}
            onTraceScaleChange={onTraceScaleChange}
            gridBackground={gridBackground}
            zoom={zoom}
            minZoom={minZoom}
            maxZoom={maxZoom}
            pinchEnabled={pinchEnabled}
            onZoomChange={setUserZoom}
            centerCanvasToken={centerCanvasTick}
            focusCell={focusCell}
            focusCellToken={focusCellToken}
            filterRect={filterEditMode ? filterEditRect : filterRect}
            filterSelecting={filterEditMode ? false : filterSelecting}
            filterEditMode={filterEditMode}
            onFilterRectChange={handleFilterRectChange}
            onFilterSelectEnd={handleFilterSelectEnd}
          />
        </div>
        {!uiReady && (
          <div
            aria-busy="true"
            style={{
              position: "absolute",
              inset: 12,
              borderRadius: 10,
              background: "rgba(255,255,255,0.8)",
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

      <div style={{ position: "absolute", left: -10000, top: -10000 }}>
        <ExportCanvas
          exportCanvasRef={exportCanvasRef}
          width={width}
          height={height}
          grid={grid}
          paletteById={paletteById}
          symbolMap={symbolMap}
          cellSize={exportCellSize}
          showGridlines={true}
        />
      </div>
    </div>
  );
}

function ExportCanvas({
  exportCanvasRef,
  width,
  height,
  grid,
  paletteById,
  symbolMap,
  cellSize,
  showGridlines,
}: {
  exportCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  grid: Uint16Array;
  paletteById: Map<number, Color>;
  symbolMap?: Map<number, string>;
  cellSize: number;
  showGridlines: boolean;
}) {
  const canvasW = width * cellSize;
  const canvasH = height * cellSize;

  React.useEffect(() => {
    const canvas = exportCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasW;
    canvas.height = canvasH;

    ctx.clearRect(0, 0, canvasW, canvasH);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorId = grid[idx(x, y, width)];
        if (colorId === 0) continue;
        const color = paletteById.get(colorId);
        if (!color) continue;
        ctx.fillStyle = color.hex;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        const symbol = symbolForColorId(color.id, symbolMap);
        if (symbol) {
          ctx.save();
          ctx.fillStyle = contrastForHex(color.hex);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `700 ${Math.max(10, Math.floor(cellSize * 0.7))}px ui-sans-serif, system-ui, sans-serif`;
          ctx.fillText(symbol, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2 + 0.5);
          ctx.restore();
        }
      }
    }

    if (showGridlines) {
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize + 0.5, 0);
        ctx.lineTo(x * cellSize + 0.5, canvasH);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize + 0.5);
        ctx.lineTo(canvasW, y * cellSize + 0.5);
        ctx.stroke();
      }
    }
  }, [
    exportCanvasRef,
    canvasW,
    canvasH,
    width,
    height,
    grid,
    paletteById,
    symbolMap,
    cellSize,
    showGridlines,
  ]);

  return <canvas ref={exportCanvasRef} />;
}
