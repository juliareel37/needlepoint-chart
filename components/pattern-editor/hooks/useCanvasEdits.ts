"use client";

import type { MutableRefObject, RefObject } from "react";
import { useEffect, useRef } from "react";
import { idx, makeGrid } from "../../../lib/grid";
import { useSelectionTools } from "./useSelectionTools";

type Snapshot = { gridW: number; gridH: number; grid: Uint16Array };
type ToolName = "paint" | "eraser" | "fill" | "eyedropper" | "lasso";

type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel?: string;
  position?: { top: number; left: number } | null;
} | null;

type UseCanvasEditsArgs = {
  tool: ToolName;
  grid: Uint16Array;
  gridW: number;
  gridH: number;
  setGrid: (value: Uint16Array | ((prev: Uint16Array) => Uint16Array)) => void;
  setGridW: (value: number) => void;
  setGridH: (value: number) => void;
  gridMode: "stitches" | "inches";
  setGridMode: (value: "stitches" | "inches") => void;
  meshCount: number;
  setMeshCount: (value: number) => void;
  widthIn: number;
  setWidthIn: (value: number) => void;
  heightIn: number;
  setHeightIn: (value: number) => void;
  draftGridMode: "stitches" | "inches";
  draftGridW: number;
  draftGridH: number;
  draftMeshCount: number;
  draftWidthIn: number;
  draftHeightIn: number;
  activeColorId: number;
  displayCellSize: number;
  pushHistory: (entry: Snapshot) => void;
  pushFuture: (entry: Snapshot) => void;
  popHistory: () => Snapshot | null;
  popFuture: () => Snapshot | null;
  setFutureState: (next: Snapshot[]) => void;
  setLastEditCell: (value: { x: number; y: number } | null) => void;
  confirmActionRef: MutableRefObject<(() => void) | null>;
  setConfirmDialog: (value: ConfirmDialogState) => void;
  clearButtonRef: RefObject<HTMLButtonElement | null>;
  traceImage: HTMLImageElement | null;
  traceLocked: boolean;
  setTraceLocked: (value: boolean) => void;
};

export function useCanvasEdits({
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
}: UseCanvasEditsArgs) {
  const gridRef = useRef<Uint16Array | null>(null);
  const strokeActiveRef = useRef(false);
  const strokeDirtyRef = useRef(false);
  const strokeSnapshotRef = useRef<Snapshot | null>(null);
  const strokePendingCommitRef = useRef(false);
  const strokeVersionRef = useRef(0);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  function bumpStrokeVersion() {
    strokeVersionRef.current += 1;
  }

  function commitPendingStroke() {
    if (!strokePendingCommitRef.current) return;
    const snapshot = strokeSnapshotRef.current;
    if (snapshot) {
      pushHistory(snapshot);
      setFutureState([]);
    }
    strokePendingCommitRef.current = false;
    strokeSnapshotRef.current = null;
  }

  function updateGrid(updater: (prev: Uint16Array) => Uint16Array, version?: number) {
    setGrid((prev) => {
      if (version !== undefined && version !== strokeVersionRef.current) return prev;
      const next = updater(prev);
      if (next === prev) return prev;
      if (!strokeActiveRef.current) {
        pushHistory({ gridW, gridH, grid: prev });
        setFutureState([]);
      }
      return next;
    });
  }

  const selection = useSelectionTools({
    tool,
    gridW,
    gridH,
    activeColorId,
    displayCellSize,
    updateGrid,
    setLastEditCell,
  });

  const { activeFilterRect, isCellInFilter, isIndexInFilter } = selection;

  function onPaintCell(x: number, y: number, colorId: number) {
    if (!isCellInFilter(x, y)) return;
    const currentGrid = gridRef.current ?? grid;
    const cellIdx = idx(x, y, gridW);
    if (currentGrid[cellIdx] === colorId) return;
    setLastEditCell({ x, y });
    if (strokeActiveRef.current) {
      strokeDirtyRef.current = true;
    }
    const version = strokeVersionRef.current;
    updateGrid((prev) => {
      const next = new Uint16Array(prev);
      next[cellIdx] = colorId;
      return next;
    }, version);
  }

  function onFillCells(indices: number[], colorId: number) {
    const filtered = activeFilterRect ? indices.filter((i) => isIndexInFilter(i)) : indices;
    if (filtered.length === 0) return;
    let sumX = 0;
    let sumY = 0;
    for (const i of filtered) {
      sumX += i % gridW;
      sumY += Math.floor(i / gridW);
    }
    setLastEditCell({
      x: Math.round(sumX / filtered.length),
      y: Math.round(sumY / filtered.length),
    });
    if (strokeActiveRef.current) {
      strokeDirtyRef.current = true;
    }
    const version = strokeVersionRef.current;
    updateGrid((prev) => {
      const next = new Uint16Array(prev);
      for (const i of filtered) {
        next[i] = colorId;
      }
      return next;
    }, version);
  }

  function onFillGrid(nextGrid: Uint16Array) {
    if (strokeActiveRef.current) {
      strokeDirtyRef.current = true;
    }
    if (nextGrid.length === gridW * gridH) {
      const prev = gridRef.current ?? grid;
      for (let i = 0; i < nextGrid.length; i++) {
        if (nextGrid[i] !== prev[i]) {
          setLastEditCell({ x: i % gridW, y: Math.floor(i / gridW) });
          break;
        }
      }
    }
    const version = strokeVersionRef.current;
    updateGrid(() => nextGrid, version);
  }

  function resetGrid(newW: number, newH: number) {
    bumpStrokeVersion();
    pushHistory({ gridW, gridH, grid });
    setFutureState([]);
    setGridW(newW);
    setGridH(newH);
    setGrid(makeGrid(newW, newH, 0));
  }

  function applyGridFromInches(inW: number, inH: number, mesh: number) {
    const safeMesh = Math.max(1, mesh);
    const targetW = Math.max(1, Math.round(inW * safeMesh));
    const targetH = Math.max(1, Math.round(inH * safeMesh));
    resetGrid(targetW, targetH);
  }

  function applyDraftGrid() {
    if (draftGridMode === "stitches") {
      if (gridMode === "stitches" && draftGridW === gridW && draftGridH === gridH) {
        return;
      }
      setGridMode("stitches");
      resetGrid(draftGridW, draftGridH);
      return;
    }
    if (
      gridMode === "inches" &&
      draftMeshCount === meshCount &&
      draftWidthIn === widthIn &&
      draftHeightIn === heightIn
    ) {
      return;
    }
    setGridMode("inches");
    setMeshCount(draftMeshCount);
    setWidthIn(draftWidthIn);
    setHeightIn(draftHeightIn);
    applyGridFromInches(draftWidthIn, draftHeightIn, draftMeshCount);
  }

  function hasPaintedCells() {
    const current = gridRef.current ?? grid;
    for (let i = 0; i < current.length; i++) {
      if (current[i] !== 0) return true;
    }
    return false;
  }

  function openConfirmDialog(opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    anchorRef?: RefObject<HTMLElement | null>;
  }) {
    const { title, message, confirmLabel, onConfirm, anchorRef } = opts;
    confirmActionRef.current = onConfirm;
    let position: { top: number; left: number } | null = null;
    if (anchorRef?.current && typeof window !== "undefined") {
      const rect = anchorRef.current.getBoundingClientRect();
      const margin = 12;
      const panelW = Math.min(360, window.innerWidth - margin * 2);
      const panelH = 150;
      const centerLeft = rect.left + rect.width / 2 - panelW / 2;
      const left = Math.min(Math.max(centerLeft, margin), window.innerWidth - panelW - margin);
      let top = rect.bottom + 8;
      if (top + panelH > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - panelH - 8);
      }
      position = { top, left };
    }
    setConfirmDialog({ title, message, confirmLabel, position });
  }

  function confirmAndApplyGrid() {
    if (hasPaintedCells()) {
      openConfirmDialog({
        title: "Change canvas size?",
        message: "Changing the grid size will clear your current stitches. Do you want to continue?",
        confirmLabel: "Continue",
        onConfirm: applyDraftGrid,
      });
      return;
    }
    applyDraftGrid();
  }

  function toggleTraceLock() {
    if (!traceImage) return;
    if (traceLocked) {
      if (hasPaintedCells()) {
        openConfirmDialog({
          title: "Unlock trace image?",
          message:
            "Unlocking the trace image after painting may misalign it with your stitches. Do you want to continue?",
          confirmLabel: "Unlock",
          onConfirm: () => setTraceLocked(false),
        });
        return;
      }
      setTraceLocked(false);
      return;
    }
    setTraceLocked(true);
  }

  function setTraceLockedState(nextLocked: boolean) {
    if (!traceImage) return;
    if (!nextLocked && traceLocked) {
      if (hasPaintedCells()) {
        openConfirmDialog({
          title: "Unlock background image?",
          message:
            "Unlocking the background image after painting may misalign it with your stitches. Do you want to continue?",
          confirmLabel: "Unlock",
          onConfirm: () => setTraceLocked(nextLocked),
        });
        return;
      }
    }
    setTraceLocked(nextLocked);
  }

  function performClearGrid() {
    bumpStrokeVersion();
    updateGrid(() => makeGrid(gridW, gridH, 0));
  }

  function clearGrid() {
    if (hasPaintedCells()) {
      openConfirmDialog({
        title: "Clear canvas?",
        message: "This will clear all painted cells. This action can be undone.",
        confirmLabel: "Clear",
        onConfirm: performClearGrid,
        anchorRef: clearButtonRef,
      });
      return;
    }
    performClearGrid();
  }

  function undo() {
    commitPendingStroke();
    const last = popHistory();
    if (!last) return;
    bumpStrokeVersion();
    pushFuture({ gridW, gridH, grid });
    setGridW(last.gridW);
    setGridH(last.gridH);
    setGrid(last.grid);
  }

  function redo() {
    commitPendingStroke();
    const next = popFuture();
    if (!next) return;
    bumpStrokeVersion();
    pushHistory({ gridW, gridH, grid });
    setGridW(next.gridW);
    setGridH(next.gridH);
    setGrid(next.grid);
  }

  function beginStroke() {
    strokeActiveRef.current = true;
    strokeDirtyRef.current = false;
    strokeSnapshotRef.current = { gridW, gridH, grid };
    bumpStrokeVersion();
  }

  function endStroke() {
    if (!strokeActiveRef.current) return;
    if (strokeSnapshotRef.current && strokeDirtyRef.current) {
      strokePendingCommitRef.current = true;
      queueMicrotask(() => {
        commitPendingStroke();
      });
    } else {
      strokeSnapshotRef.current = null;
    }
    strokeActiveRef.current = false;
    strokeDirtyRef.current = false;
  }

  return {
    ...selection,
    activeFilterRect,
    isCellInFilter,
    isIndexInFilter,
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
  };
}
