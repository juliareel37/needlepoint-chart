"use client";

import React, { useEffect, useRef, useState } from "react";
import GridCanvas from "./GridCanvas";
import type { Color } from "../../../lib/grid";
import { idx } from "../../../lib/grid";
import { symbolForColorId } from "../../../lib/symbols";
import { assetPath } from "../../../lib/assetPath";
import { EXPORT_CELL_SIZE } from "../utils/constants";
import { contrastForHex } from "../utils/colorUtils";
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
    filterRect,
    filterSelecting,
    onFilterRectChange,
    onFilterSelectEnd,
    isNarrow,
    setShowGridlines,
    setThreadView,
    setTraceOpacity,
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
  const [uiReady, setUiReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const [imageOpacityOpen, setImageOpacityOpen] = useState(false);
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

  useEffect(() => {
    if (fitPending) return;
    setZoomInput(String(zoomPercent));
  }, [zoomPercent, fitPending]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateHeights = () => {
      const card = canvasCardRef.current;
      if (!card) return;
      const bottomPadding = 16;
      const maxHeight = isNarrow
        ? Math.max(240, Math.floor(window.innerHeight * 0.75))
        : Math.max(240, Math.floor(window.innerHeight - card.getBoundingClientRect().top - bottomPadding));
      setCanvasCardMaxHeight(maxHeight);
      const zoomRowHeight = 0;
      const padding = 12;
      const gap = 10;
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
    userZoomedRef.current = false;
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
    };
    notify();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => notify());
    observer.observe(node);
    return () => observer.disconnect();
  }, [onControlsHeightChange]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        ref={canvasCardRef}
        style={{
          background: "var(--card-bg)",
          border: "none",
          borderRadius: 12,
          padding: "var(--canvas-card-padding, 12px)",
          boxShadow: "0 6px 16px rgba(15, 23, 42, 0.12)",
          display: "grid",
          gap: 10,
          maxHeight: canvasCardMaxHeight ?? undefined,
          minHeight: uiReady ? canvasCardMaxHeight ?? "70vh" : "calc(100vh - 140px)",
          overflow: "visible",
          position: "relative",
        }}
      >
        <div
          ref={controlsRef}
          className="canvas-toolbar"
          style={{
            opacity: uiReady ? 1 : 0,
            pointerEvents: uiReady ? "auto" : "none",
            position: "absolute",
            top: 16,
            left: 12,
            zIndex: 4,
            background: "rgba(255,255,255,0.92)",
            border: "none",
            borderRadius: 12,
            padding: "4px 8px",
            boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
            backdropFilter: "blur(6px)",
            display: "flex",
            gap: 4,
            alignItems: "flex-start",
            flexWrap: "wrap",
            maxWidth: "calc(100% - 180px)",
          }}
        >
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "flex-start" }}>
            <button
              onClick={onTogglePanMode}
              aria-pressed={panMode}
              aria-label="Pan"
              data-active={panMode ? "true" : undefined}
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
              <span className="toolbar-label" style={{ fontSize: 9, opacity: 0.7 }}>
                Pan
              </span>
            </button>
            {(["paint", "eraser", "fill", "eyedropper", "lasso"] as const).map((t) => (
              <button
                key={t}
                onClick={() => onToolChange(t)}
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
                data-active={tool === t && !panMode ? "true" : undefined}
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
                <span className="toolbar-label" style={{ fontSize: 9, opacity: 0.7 }}>
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
            <span style={{ opacity: 0.45, margin: "0 6px" }}>|</span>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
              className="toolbar-button"
              style={{
                padding: "2px 6px",
                borderRadius: 10,
                cursor: "pointer",
                opacity: canUndo ? 1 : 0.5,
                display: "grid",
                gap: 1,
                justifyItems: "center",
              }}
            >
              <span className="toolbar-icon" aria-hidden="true">
                <img
                  src={assetPath("/undo.svg")}
                  alt=""
                  aria-hidden="true"
                  width={18}
                  height={18}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </span>
              <span className="toolbar-label" style={{ fontSize: 9, opacity: 0.7 }}>
                Undo
              </span>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo"
              className="toolbar-button"
              style={{
                padding: "2px 6px",
                borderRadius: 10,
                cursor: "pointer",
                opacity: canRedo ? 1 : 0.5,
                display: "grid",
                gap: 1,
                justifyItems: "center",
              }}
            >
              <span className="toolbar-icon" aria-hidden="true">
                <img
                  src={assetPath("/redo.svg")}
                  alt=""
                  aria-hidden="true"
                  width={18}
                  height={18}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </span>
              <span className="toolbar-label" style={{ fontSize: 9, opacity: 0.7 }}>
                Redo
              </span>
            </button>
            <button
              onClick={onClear}
              aria-label="Clear"
              ref={clearButtonRef}
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
                  src={assetPath("/trash.svg")}
                  alt=""
                  aria-hidden="true"
                  width={18}
                  height={18}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </span>
              <span className="toolbar-label" style={{ fontSize: 9, opacity: 0.7 }}>
                Clear
              </span>
            </button>
          </div>
        </div>
        {uiReady && (tool === "paint" || tool === "eraser") && (
          <div
            className="canvas-toolbar-size"
            style={{
              position: "absolute",
              top: 16 + toolbarHeight + 6,
              left: 12,
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
            <span style={{ fontSize: 10, opacity: 0.7 }}>Tool size</span>
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
        <div
          className="zoom-floating"
          style={{
            opacity: uiReady ? 1 : 0,
            pointerEvents: uiReady ? "auto" : "none",
            position: "absolute",
            right: 12,
            bottom: 12,
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 8px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(6px)",
            boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
            minWidth: 0,
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
              width={14}
              height={14}
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
              width={14}
              height={14}
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
          <button
            onClick={() => setSettingsOpen((open) => !open)}
            aria-pressed={settingsOpen}
            aria-label="Canvas settings"
            title="Canvas settings"
            style={{
              padding: "4px 6px",
              borderRadius: 8,
              border: "none",
              background: settingsOpen ? "var(--accent-wash)" : "var(--muted-bg)",
              color: settingsOpen ? "var(--accent-strong)" : "var(--foreground)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <img
              src={assetPath("/settings.svg")}
              alt=""
              aria-hidden="true"
              width={16}
              height={16}
              style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
            />
            <span
              aria-hidden="true"
              style={{
                fontSize: 12,
                lineHeight: 1,
                color: "var(--foreground)",
                opacity: 0.7,
              }}
            >
              {settingsOpen ? "▴" : "▸"}
            </span>
          </button>
        </div>
        {uiReady && settingsOpen && (
          <div
            style={{
              position: "absolute",
              right: 12,
              bottom: 56,
              zIndex: 4,
              background: "rgba(255,255,255,0.96)",
              borderRadius: 12,
              padding: "10px 12px",
              boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
              backdropFilter: "blur(6px)",
              display: "grid",
              gap: 10,
              minWidth: 120,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <Toggle label="Gridlines" checked={showGridlines} onChange={setShowGridlines} />
              <Toggle label="Thread view" checked={threadView} onChange={setThreadView} />
              <Toggle label="Color symbols" checked={showSymbols} onChange={setShowSymbols} />
            </div>
          </div>
        )}
        {uiReady && traceImage && (
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 12,
              zIndex: 4,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 12,
              padding: "6px 8px",
              boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
              backdropFilter: "blur(6px)",
              display: "grid",
              gap: 6,
              minWidth: 160,
            }}
          >
            <button
              type="button"
              onClick={() => setImageOpacityOpen((open) => !open)}
              aria-expanded={imageOpacityOpen}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              <img
                src={assetPath("/file.svg")}
                alt=""
                aria-hidden="true"
                width={14}
                height={14}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
              <span style={{ flex: "1 1 auto", textAlign: "left" }}>Image Opacity</span>
              <span aria-hidden="true" style={{ fontSize: 12, opacity: 0.7 }}>
                {imageOpacityOpen ? "▾" : "▸"}
              </span>
            </button>
            {imageOpacityOpen && (
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((traceOpacity ?? 0) * 100)}
                onChange={(e) => setTraceOpacity(parseInt(e.target.value, 10) / 100)}
                style={{ width: "100%" }}
              />
            )}
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
            zoom={zoom}
            minZoom={minZoom}
            maxZoom={maxZoom}
            pinchEnabled={pinchEnabled}
            onZoomChange={setUserZoom}
            centerCanvasToken={centerCanvasTick}
            focusCell={focusCell}
            focusCellToken={focusCellToken}
            filterRect={filterRect}
            filterSelecting={filterSelecting}
            onFilterRectChange={onFilterRectChange}
            onFilterSelectEnd={onFilterSelectEnd}
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
