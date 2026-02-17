"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Color } from "../../../lib/grid";
import { idx } from "../../../lib/grid";
import { SYMBOLS } from "../../../lib/symbols";
import { rgbToOklab } from "../utils/colorUtils";
import type { FilterRect } from "../utils/geometry";
import type { Snapshot, TraceSnapshot } from "../utils/historyTypes";

type SetState<T> = (value: T | ((prev: T) => T)) => void;

type UseColorEditsArgs = {
  grid: Uint16Array;
  gridW: number;
  gridH: number;
  paletteById: Map<number, Color>;
  activeColorId: number;
  setActiveColorId: (value: number) => void;
  activeFilterRect: FilterRect | null;
  isIndexInFilter: (cellIdx: number) => boolean;
  setGrid: SetState<Uint16Array>;
  bumpStrokeVersion: () => void;
  pushHistory: (entry: Snapshot) => void;
  setFutureState: (next: Snapshot[]) => void;
  setLastEditCell: SetState<{ x: number; y: number } | null>;
  getTraceSnapshot: () => TraceSnapshot;
};

export function useColorEdits({
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
  getTraceSnapshot,
}: UseColorEditsArgs) {
  const [remapMode, setRemapMode] = useState(false);
  const [remapSourceId, setRemapSourceId] = useState<number | null>(null);
  const [remapTargetId, setRemapTargetId] = useState<number | null>(null);
  const [identifyColorId, setIdentifyColorId] = useState<number | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSelectedIds, setMergeSelectedIds] = useState<number[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState<number | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteSelectedIds, setDeleteSelectedIds] = useState<number[]>([]);
  const remapOriginalRef = useRef<Uint16Array | null>(null);
  const mergeOriginalRef = useRef<Uint16Array | null>(null);
  const deleteOriginalRef = useRef<Uint16Array | null>(null);

  function beginRemap(sourceId: number) {
    setRemapSourceId(sourceId);
    setRemapTargetId(null);
    remapOriginalRef.current = new Uint16Array(grid);
  }

  function previewRemap(targetId: number) {
    if (remapSourceId === null) return;
    const original = remapOriginalRef.current ?? new Uint16Array(grid);
    remapOriginalRef.current = original;
    setRemapTargetId(targetId);
    setGrid(() => {
      const next = new Uint16Array(original);
      for (let i = 0; i < next.length; i++) {
        if (!isIndexInFilter(i)) continue;
        if (next[i] === remapSourceId) next[i] = targetId;
      }
      return next;
    });
  }

  function cancelRemap() {
    if (remapOriginalRef.current) {
      setGrid(remapOriginalRef.current);
    }
    remapOriginalRef.current = null;
    setRemapSourceId(null);
    setRemapTargetId(null);
  }

  function cancelMerge() {
    if (mergeOriginalRef.current) {
      setGrid(mergeOriginalRef.current);
    }
    mergeOriginalRef.current = null;
    setMergeSelectedIds([]);
    setMergeTargetId(null);
  }

  function cancelDelete() {
    if (deleteOriginalRef.current) {
      setGrid(deleteOriginalRef.current);
    }
    deleteOriginalRef.current = null;
    setDeleteSelectedIds([]);
  }

  function toggleRemapMode() {
    if (remapMode) {
      cancelRemap();
      setRemapMode(false);
      return;
    }
    if (mergeMode) {
      cancelMerge();
      setMergeMode(false);
    }
    if (deleteMode) {
      cancelDelete();
      setDeleteMode(false);
    }
    cancelRemap();
    setRemapMode(true);
  }

  function toggleMergeMode() {
    if (mergeMode) {
      cancelMerge();
      setMergeMode(false);
      return;
    }
    if (remapMode) {
      cancelRemap();
      setRemapMode(false);
    }
    if (deleteMode) {
      cancelDelete();
      setDeleteMode(false);
    }
    cancelMerge();
    mergeOriginalRef.current = new Uint16Array(grid);
    setMergeMode(true);
  }

  function toggleDeleteMode() {
    if (deleteMode) {
      cancelDelete();
      setDeleteMode(false);
      return;
    }
    if (remapMode) {
      cancelRemap();
      setRemapMode(false);
    }
    if (mergeMode) {
      cancelMerge();
      setMergeMode(false);
    }
    cancelDelete();
    deleteOriginalRef.current = new Uint16Array(grid);
    setDeleteMode(true);
  }

  function confirmRemap() {
    if (remapSourceId === null || remapTargetId === null) {
      cancelRemap();
      return;
    }
    const original = remapOriginalRef.current ?? new Uint16Array(grid);
    bumpStrokeVersion();
    pushHistory({ gridW, gridH, grid: original, trace: getTraceSnapshot() });
    setFutureState([]);
    let focusCell: { x: number; y: number } | null = null;
    setGrid(() => {
      const next = new Uint16Array(original);
      for (let i = 0; i < next.length; i++) {
        if (!isIndexInFilter(i)) continue;
        if (next[i] === remapSourceId) {
          next[i] = remapTargetId;
          if (focusCell == null) {
            focusCell = { x: i % gridW, y: Math.floor(i / gridW) };
          }
        }
      }
      return next;
    });
    if (focusCell) {
      setLastEditCell(focusCell);
    }
    setActiveColorId(remapTargetId);
    remapOriginalRef.current = null;
    setRemapSourceId(null);
    setRemapTargetId(null);
    setRemapMode(false);
  }

  function confirmMerge() {
    if (mergeSelectedIds.length < 2 || mergeTargetId === null || !mergeSelectedIds.includes(mergeTargetId)) {
      return;
    }
    const targetId = mergeTargetId;
    const sourceIds = mergeSelectedIds.filter((id) => id !== targetId);
    if (sourceIds.length === 0) return;
    const sourceSet = new Set(sourceIds);
    const original = mergeOriginalRef.current ?? new Uint16Array(grid);
    mergeOriginalRef.current = original;
    bumpStrokeVersion();
    pushHistory({ gridW, gridH, grid: original, trace: getTraceSnapshot() });
    setFutureState([]);
    let focusCell: { x: number; y: number } | null = null;
    setGrid((prev) => {
      const next = new Uint16Array(original);
      let changed = false;
      for (let i = 0; i < next.length; i++) {
        if (!isIndexInFilter(i)) continue;
        if (sourceSet.has(next[i])) {
          next[i] = targetId;
          changed = true;
          if (!focusCell) {
            focusCell = { x: i % gridW, y: Math.floor(i / gridW) };
          }
        }
      }
      return changed ? next : prev;
    });
    if (focusCell) {
      setLastEditCell(focusCell);
    }
    setActiveColorId(targetId);
    mergeOriginalRef.current = null;
    setMergeSelectedIds([]);
    setMergeTargetId(null);
    setMergeMode(false);
  }

  function confirmDeleteColors() {
    if (deleteSelectedIds.length === 0) return;
    const availableIds = usedColorIds.filter((id) => !deleteSelectedIds.includes(id));
    if (availableIds.length === 0) return;

    const toLab = (id: number) => {
      const color = paletteById.get(id);
      if (!color) return null;
      const clean = color.hex.replace("#", "");
      if (clean.length !== 6) return null;
      const r = parseInt(clean.slice(0, 2), 16) / 255;
      const g = parseInt(clean.slice(2, 4), 16) / 255;
      const b = parseInt(clean.slice(4, 6), 16) / 255;
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
      return rgbToOklab(r, g, b);
    };

    const candidateLabs = availableIds
      .map((id) => {
        const lab = toLab(id);
        if (!lab) return null;
        return { id, L: lab.L, A: lab.A, B: lab.B };
      })
      .filter((entry): entry is { id: number; L: number; A: number; B: number } => Boolean(entry));

    const fallbackId = candidateLabs[0]?.id ?? availableIds[0];
    if (fallbackId == null) return;

    const replacementById = new Map<number, number>();
    for (const id of deleteSelectedIds) {
      const lab = toLab(id);
      if (!lab || candidateLabs.length === 0) {
        replacementById.set(id, fallbackId);
        continue;
      }
      let bestId = fallbackId;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const candidate of candidateLabs) {
        const dx = lab.L - candidate.L;
        const dy = lab.A - candidate.A;
        const dz = lab.B - candidate.B;
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < bestDist) {
          bestDist = dist;
          bestId = candidate.id;
        }
      }
      replacementById.set(id, bestId);
    }

    const original = deleteOriginalRef.current ?? new Uint16Array(grid);
    deleteOriginalRef.current = original;
    bumpStrokeVersion();
    pushHistory({ gridW, gridH, grid: original, trace: getTraceSnapshot() });
    setFutureState([]);
    let focusCell: { x: number; y: number } | null = null;
    setGrid((prev) => {
      const next = new Uint16Array(original);
      let changed = false;
      for (let i = 0; i < next.length; i++) {
        if (!isIndexInFilter(i)) continue;
        const replacement = replacementById.get(next[i]);
        if (replacement != null) {
          next[i] = replacement;
          changed = true;
          if (!focusCell) {
            focusCell = { x: i % gridW, y: Math.floor(i / gridW) };
          }
        }
      }
      return changed ? next : prev;
    });
    if (focusCell) {
      setLastEditCell(focusCell);
    }
    if (replacementById.has(activeColorId)) {
      setActiveColorId(replacementById.get(activeColorId) ?? activeColorId);
    }
    deleteOriginalRef.current = null;
    setDeleteSelectedIds([]);
    setDeleteMode(false);
  }

  const usedColorsGrid =
    remapMode && remapOriginalRef.current
      ? remapOriginalRef.current
      : mergeMode && mergeOriginalRef.current
        ? mergeOriginalRef.current
        : deleteMode && deleteOriginalRef.current
          ? deleteOriginalRef.current
          : grid;
  const usedColorsAll = useMemo(() => {
    const counts = new Map<number, number>();
    for (let i = 0; i < usedColorsGrid.length; i++) {
      const id = usedColorsGrid[i];
      if (id === 0) continue;
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([id, count]) => ({ color: paletteById.get(id)!, count }))
      .filter((x) => Boolean(x.color))
      .sort((a, b) => b.count - a.count);
  }, [usedColorsGrid, paletteById]);
  const usedColors = useMemo(() => {
    const counts = new Map<number, number>();
    if (activeFilterRect) {
      for (let y = activeFilterRect.y0; y <= activeFilterRect.y1; y++) {
        for (let x = activeFilterRect.x0; x <= activeFilterRect.x1; x++) {
          const id = usedColorsGrid[idx(x, y, gridW)];
          if (id === 0) continue;
          counts.set(id, (counts.get(id) || 0) + 1);
        }
      }
    } else {
      for (let i = 0; i < usedColorsGrid.length; i++) {
        const id = usedColorsGrid[i];
        if (id === 0) continue;
        counts.set(id, (counts.get(id) || 0) + 1);
      }
    }
    const arr = Array.from(counts.entries())
      .map(([id, count]) => ({ color: paletteById.get(id)!, count }))
      .filter((x) => Boolean(x.color))
      .sort((a, b) => b.count - a.count);
    return arr;
  }, [usedColorsGrid, paletteById, activeFilterRect, gridW]);
  const hasAnyPaintedCells = usedColorsAll.length > 0;
  const usedColorIds = useMemo(() => usedColors.map((entry) => entry.color.id), [usedColors]);
  const [symbolMap, setSymbolMap] = useState<Map<number, string>>(() => new Map());
  useEffect(() => {
    if (usedColors.length === 0) return;
    setSymbolMap((prev) => {
      let changed = false;
      const next = new Map(prev);
      const usedSymbols = new Set(next.values());
      for (const entry of usedColors) {
        const id = entry.color.id;
        if (next.has(id)) continue;
        const symbol = SYMBOLS.find((value) => value && !usedSymbols.has(value)) ?? "";
        if (symbol) {
          next.set(id, symbol);
          usedSymbols.add(symbol);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [usedColors]);
  useEffect(() => {
    setMergeSelectedIds((prev) => prev.filter((id) => usedColorIds.includes(id)));
  }, [usedColorIds]);
  useEffect(() => {
    if (mergeTargetId !== null && !usedColorIds.includes(mergeTargetId)) {
      setMergeTargetId(null);
    }
  }, [mergeTargetId, usedColorIds]);
  useEffect(() => {
    setDeleteSelectedIds((prev) => prev.filter((id) => usedColorIds.includes(id)));
  }, [usedColorIds]);

  useEffect(() => {
    if (!mergeMode) return;
    const original = mergeOriginalRef.current;
    if (!original) return;
    if (mergeSelectedIds.length < 2 || mergeTargetId === null || !mergeSelectedIds.includes(mergeTargetId)) {
      setGrid(original);
      return;
    }
    const targetId = mergeTargetId;
    const sourceSet = new Set(mergeSelectedIds.filter((id) => id !== targetId));
    if (sourceSet.size === 0) {
      setGrid(original);
      return;
    }
    setGrid(() => {
      const next = new Uint16Array(original);
      for (let i = 0; i < next.length; i++) {
        if (!isIndexInFilter(i)) continue;
        if (sourceSet.has(next[i])) {
          next[i] = targetId;
        }
      }
      return next;
    });
  }, [mergeMode, mergeSelectedIds, mergeTargetId, activeFilterRect, gridW]);

  useEffect(() => {
    if (!deleteMode) return;
    const original = deleteOriginalRef.current;
    if (!original) return;
    if (deleteSelectedIds.length === 0) {
      setGrid(original);
      return;
    }
    const availableIds = usedColorIds.filter((id) => !deleteSelectedIds.includes(id));
    if (availableIds.length === 0) {
      setGrid(original);
      return;
    }
    const toLab = (id: number) => {
      const color = paletteById.get(id);
      if (!color) return null;
      const clean = color.hex.replace("#", "");
      if (clean.length !== 6) return null;
      const r = parseInt(clean.slice(0, 2), 16) / 255;
      const g = parseInt(clean.slice(2, 4), 16) / 255;
      const b = parseInt(clean.slice(4, 6), 16) / 255;
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
      return rgbToOklab(r, g, b);
    };
    const candidateLabs = availableIds
      .map((id) => {
        const lab = toLab(id);
        if (!lab) return null;
        return { id, L: lab.L, A: lab.A, B: lab.B };
      })
      .filter((entry): entry is { id: number; L: number; A: number; B: number } => Boolean(entry));
    const fallbackId = candidateLabs[0]?.id ?? availableIds[0];
    if (fallbackId == null) {
      setGrid(original);
      return;
    }
    const replacementById = new Map<number, number>();
    for (const id of deleteSelectedIds) {
      const lab = toLab(id);
      if (!lab || candidateLabs.length === 0) {
        replacementById.set(id, fallbackId);
        continue;
      }
      let bestId = fallbackId;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const candidate of candidateLabs) {
        const dx = lab.L - candidate.L;
        const dy = lab.A - candidate.A;
        const dz = lab.B - candidate.B;
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < bestDist) {
          bestDist = dist;
          bestId = candidate.id;
        }
      }
      replacementById.set(id, bestId);
    }
    setGrid(() => {
      const next = new Uint16Array(original);
      for (let i = 0; i < next.length; i++) {
        if (!isIndexInFilter(i)) continue;
        const replacement = replacementById.get(next[i]);
        if (replacement != null) {
          next[i] = replacement;
        }
      }
      return next;
    });
  }, [deleteMode, deleteSelectedIds, usedColorIds, paletteById, activeFilterRect, gridW]);

  return {
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
  };
}
