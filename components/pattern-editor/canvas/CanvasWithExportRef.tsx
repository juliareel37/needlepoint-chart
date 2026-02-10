"use client";

import React, { useEffect, useRef, useState } from "react";
import GridCanvas from "./GridCanvas";
import type { Color } from "../../../lib/grid";
import { idx } from "../../../lib/grid";
import { symbolForColorId } from "../../../lib/symbols";
import { assetPath } from "../../../lib/assetPath";
import { EXPORT_CELL_SIZE } from "../utils/constants";
import { contrastForHex } from "../utils/colorUtils";

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
    showSymbols,
    identifyColorId,
    filterRect,
    filterSelecting,
    onFilterRectChange,
    onFilterSelectEnd,
    isNarrow,
  } = props;

  const exportCellSize = EXPORT_CELL_SIZE;
  const zoomPercent = Math.round(zoom * 100);
  const [zoomInput, setZoomInput] = useState(String(zoomPercent));
  const zoomStep = zoom < 1 ? 0.1 : zoom < 2 ? 0.2 : zoom < 4 ? 0.35 : 0.5;
  const activeColor = paletteById.get(activeColorId);
  const canvasCardRef = useRef<HTMLDivElement | null>(null);
  const zoomRowRef = useRef<HTMLDivElement | null>(null);
  const [canvasCardMaxHeight, setCanvasCardMaxHeight] = useState<number | null>(null);
  const [canvasViewportHeight, setCanvasViewportHeight] = useState<number | null>(null);
  const [centerCanvasTick, setCenterCanvasTick] = useState(0);
  const [focusCell, setFocusCell] = useState<{ x: number; y: number } | null>(null);
  const [focusCellToken, setFocusCellToken] = useState(0);
  const prevFilterSelectingRef = useRef(false);

  useEffect(() => {
    setZoomInput(String(zoomPercent));
  }, [zoomPercent]);

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
      const zoomRowHeight = zoomRowRef.current?.getBoundingClientRect().height ?? 0;
      const padding = 12;
      const gap = 10;
      const availableCanvasHeight = Math.max(120, maxHeight - zoomRowHeight - padding * 2 - gap);
      setCanvasViewportHeight(availableCanvasHeight);
    };
    updateHeights();
    window.addEventListener("resize", updateHeights);
    return () => window.removeEventListener("resize", updateHeights);
  }, [containerWidth, containerHeight, zoom]);

  const effectiveContainerHeight =
    canvasViewportHeight !== null ? Math.min(containerHeight, canvasViewportHeight) : containerHeight;

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
    const minValue = Math.round(minZoom * 100);
    const maxValue = Math.round(maxZoom * 100);
    const clamped = Math.min(maxValue, Math.max(minValue, parsed));
    onZoomChange(clamped / 100);
    setZoomInput(String(Math.round(clamped)));
  }

  function fitToHeight() {
    if (!canvasCardRef.current) return;
    const rect = canvasCardRef.current.getBoundingClientRect();
    const rowHeight = zoomRowRef.current?.getBoundingClientRect().height ?? 0;
    const padding = 12;
    const gap = 10;
    const bottomPadding = 24;
    const available = window.innerHeight - rect.top - bottomPadding - rowHeight - gap - padding * 2;
    if (!Number.isFinite(available) || available <= 0) return;
    const baseCellSize = cellSize / (zoom || 1);
    if (!Number.isFinite(baseCellSize) || baseCellSize <= 0) return;
    const nextZoom = available / (height * baseCellSize);
    onZoomChange(nextZoom);
    setCenterCanvasTick((tick) => tick + 1);
  }

  const controlsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!controlsRef.current || !onControlsHeightChange) return;
    const node = controlsRef.current;
    const notify = () => {
      onControlsHeightChange(Math.round(node.getBoundingClientRect().height));
    };
    notify();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => notify());
    observer.observe(node);
    return () => observer.disconnect();
  }, [onControlsHeightChange]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div ref={controlsRef} style={{ display: "grid", gap: 10 }}>
        <div
          className="canvas-toolbar"
          style={{
            background: "var(--card-bg)",
            border: "none",
            borderRadius: 12,
            padding: "var(--canvas-toolbar-padding, 12px)",
            boxShadow: "none",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={onTogglePanMode}
              aria-pressed={panMode}
              aria-label="Pan"
              data-tooltip="Pan"
              data-active={panMode ? "true" : undefined}
              style={{
                padding: "6px 8px",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              <img
                src={assetPath("/pan.svg")}
                alt=""
                aria-hidden="true"
                width={18}
                height={18}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
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
                data-tooltip={
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
                style={{
                  padding: "6px 8px",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
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
              </button>
            ))}
            <span style={{ opacity: 0.45, margin: "0 6px" }}>|</span>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
              data-tooltip="Undo"
              style={{
                padding: "6px 8px",
                borderRadius: 10,
                cursor: "pointer",
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
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo"
              data-tooltip="Redo"
              style={{
                padding: "6px 8px",
                borderRadius: 10,
                cursor: "pointer",
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
              onClick={onClear}
              aria-label="Clear"
              data-tooltip="Clear"
              ref={clearButtonRef}
              style={{
                padding: "6px 8px",
                borderRadius: 10,
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
          <div style={{ flex: "1 1 auto" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {!pinchEnabled && (
              <>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Tool size</span>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={brushSize}
                  onChange={(e) => onBrushSizeChange(parseInt(e.target.value, 10))}
                />
                <span style={{ fontSize: 12, opacity: 0.7 }}>{brushSize}</span>
              </>
            )}
            {pinchEnabled && (
              <>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Tool size</span>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={brushSize}
                  onChange={(e) => onBrushSizeChange(parseInt(e.target.value, 10))}
                />
                <span style={{ fontSize: 12, opacity: 0.7 }}>{brushSize}</span>
              </>
            )}
          </div>
        </div>
      </div>

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
          overflow: "visible",
        }}
      >
        <div
          ref={zoomRowRef}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
        >
          <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.2)",
                background: activeColor?.hex ?? "transparent",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 600 }}>
              {activeColor?.code ? `#${activeColor.code}` : ""}
            </span>
          </div>
          <div
            className="zoom-row"
            style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}
          >
            <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  if (!lastEditCell) return;
                  focusOnCell(lastEditCell);
                }}
                disabled={!lastEditCell}
                aria-label="Jump to last edit"
                data-tooltip="Jump to last edit"
                title="Jump to last edit"
                style={{
                  padding: "4px 8px",
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
                  width={16}
                  height={16}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </button>
              <button
                onClick={() => {
                  onZoomChange(1);
                  setCenterCanvasTick((tick) => tick + 1);
                }}
                aria-label="Fit width"
                data-tooltip="Fit width"
                title="Fit width"
                style={{
                  padding: "4px 8px",
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
                  width={16}
                  height={16}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </button>
              <button
                onClick={() => {
                  fitToHeight();
                }}
                aria-label="Fit height"
                data-tooltip="Fit height"
                title="Fit height"
                style={{
                  padding: "4px 8px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--muted-bg)",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                <img
                  src={assetPath("/fit_height.svg")}
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </button>
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
                  width: 60,
                  height: 28,
                  padding: "0 6px",
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.2)",
                  fontSize: 12,
                  lineHeight: "26px",
                }}
              />
              <span style={{ fontSize: 12, opacity: 0.7 }}>%</span>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center", width: "100%" }}>
              <button
                onClick={() => onZoomChange(Math.max(minZoom, Number((zoom - zoomStep).toFixed(2))))}
                style={{
                  padding: "4px 8px",
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
                min={Math.round(minZoom * 100)}
                max={Math.round(maxZoom * 100)}
                value={Math.round(zoom * 100)}
                onChange={(e) => onZoomChange(parseInt(e.target.value, 10) / 100)}
                style={{ flex: 1 }}
              />
              <button
                onClick={() => onZoomChange(Math.min(maxZoom, Number((zoom + zoomStep).toFixed(2))))}
                style={{
                  padding: "4px 8px",
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: "var(--foreground)",
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
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
          onZoomChange={onZoomChange}
          centerCanvasToken={centerCanvasTick}
          focusCell={focusCell}
          focusCellToken={focusCellToken}
          filterRect={filterRect}
          filterSelecting={filterSelecting}
          onFilterRectChange={onFilterRectChange}
          onFilterSelectEnd={onFilterSelectEnd}
        />
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
