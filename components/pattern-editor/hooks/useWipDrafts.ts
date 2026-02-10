"use client";

import type { MutableRefObject, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { makeGrid } from "../../../lib/grid";
import { hexToRgb } from "../utils/colorUtils";

type DraftListItem = { id: string; title: string; createdAt: string; updatedAt: string };

type DraftVersionItem = { id: string; createdAt: string };

type VersionPreviewState = {
  draftId: string;
  versionId: string;
  originalDraft: any;
  versionCreatedAt?: string;
};

type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel?: string;
  position?: { top: number; left: number } | null;
} | null;

type UseWipDraftsArgs = {
  isSignedIn: boolean;
  title: string;
  setTitle: (value: string) => void;
  gridW: number;
  setGridW: (value: number) => void;
  gridH: number;
  setGridH: (value: number) => void;
  grid: Uint16Array;
  setGrid: (value: Uint16Array) => void;
  gridMode: "stitches" | "inches";
  setGridMode: (value: "stitches" | "inches") => void;
  meshCount: number;
  setMeshCount: (value: number) => void;
  widthIn: number;
  setWidthIn: (value: number) => void;
  heightIn: number;
  setHeightIn: (value: number) => void;
  traceImageUrl: string | null;
  setTraceImageUrl: (value: string | null) => void;
  traceOpacity: number;
  setTraceOpacity: (value: number) => void;
  traceScale: number;
  setTraceScale: (value: number) => void;
  traceOffsetX: number;
  setTraceOffsetX: (value: number) => void;
  traceOffsetY: number;
  setTraceOffsetY: (value: number) => void;
  traceLocked: boolean;
  setTraceLocked: (value: boolean) => void;
  traceImage: HTMLImageElement | null;
  setTraceImage: (value: HTMLImageElement | null) => void;
  traceFileName: string | null;
  setTraceFileName: (value: string | null) => void;
  traceUrlRef: MutableRefObject<string | null>;
  setDraftGridMode: (value: "stitches" | "inches") => void;
  setDraftGridW: (value: number) => void;
  setDraftGridH: (value: number) => void;
  setDraftMeshCount: (value: number) => void;
  setDraftWidthIn: (value: number) => void;
  setDraftHeightIn: (value: number) => void;
  setHistoryState: (next: { gridW: number; gridH: number; grid: Uint16Array }[]) => void;
  setFutureState: (next: { gridW: number; gridH: number; grid: Uint16Array }[]) => void;
  setRemapSourceId: (value: number | null) => void;
  setRemapTargetId: (value: number | null) => void;
  paletteById: Map<number, { hex: string }>;
  confirmActionRef: MutableRefObject<(() => void) | null>;
  setConfirmDialog: (value: ConfirmDialogState) => void;
};

type WipStatus = { message: string; tone: "info" | "success" | "error" } | null;

type UseWipDraftsReturn = {
  wipStatus: WipStatus;
  currentDraftId: string | null;
  draftPickerOpen: boolean;
  draftPickerLoading: boolean;
  draftPickerItems: DraftListItem[];
  draftPreviewUrls: Record<string, string | null>;
  versionHistoryOpen: boolean;
  versionHistoryLoading: boolean;
  versionHistoryItems: DraftVersionItem[];
  versionPreview: VersionPreviewState | null;
  draftInputRef: RefObject<HTMLInputElement | null>;
  capturePendingDraft: () => Promise<void>;
  loadDraftFile: (file: File) => void;
  loadWip: () => Promise<void>;
  openVersionHistory: () => Promise<void>;
  selectDraft: (id: string) => Promise<void>;
  requestDeleteDraft: (id: string, title: string) => void;
  closeDraftPicker: () => void;
  closeVersionHistory: () => void;
  viewVersion: (draftId: string, versionId: string, versionCreatedAt?: string) => Promise<void>;
  restoreVersion: (draftId: string, versionId: string) => Promise<void>;
  cancelVersionPreview: () => void;
  startNewWip: () => Promise<void>;
  formatDraftDate: (value: string) => string;
};

export function useWipDrafts({
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
}: UseWipDraftsArgs): UseWipDraftsReturn {
  const [wipStatus, setWipStatus] = useState<WipStatus>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [draftPickerOpen, setDraftPickerOpen] = useState(false);
  const [draftPickerLoading, setDraftPickerLoading] = useState(false);
  const [draftPickerItems, setDraftPickerItems] = useState<DraftListItem[]>([]);
  const [draftPreviewUrls, setDraftPreviewUrls] = useState<Record<string, string | null>>({});
  const draftPreviewLoadingRef = useRef(new Set<string>());
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionHistoryLoading, setVersionHistoryLoading] = useState(false);
  const [versionHistoryItems, setVersionHistoryItems] = useState<DraftVersionItem[]>([]);
  const [versionPreview, setVersionPreview] = useState<VersionPreviewState | null>(null);
  const [versionPreviewLoading, setVersionPreviewLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const saveInFlightRef = useRef(false);
  const autosaveInFlightRef = useRef(false);
  const ignoreDirtyRef = useRef(false);
  const hasMountedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const editVersionRef = useRef(0);
  const pendingRestoreHandledRef = useRef(false);
  const wipStatusTimeoutRef = useRef<number | null>(null);
  const saveDraftRef = useRef<(opts?: { silent?: boolean }) => Promise<boolean>>(async () => false);
  const draftInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (ignoreDirtyRef.current) return;
    editVersionRef.current += 1;
    setIsDirty(true);
  }, [
    title,
    gridW,
    gridH,
    grid,
    gridMode,
    meshCount,
    widthIn,
    heightIn,
    traceImageUrl,
    traceOpacity,
    traceScale,
    traceOffsetX,
    traceOffsetY,
    traceLocked,
  ]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    saveDraftRef.current = saveDraft;
  });

  useEffect(() => {
    if (!isSignedIn) {
      pendingRestoreHandledRef.current = false;
      return;
    }
    if (pendingRestoreHandledRef.current) return;
    if (typeof window === "undefined") return;
    const pendingRaw = window.sessionStorage.getItem("wippa:pendingDraft");
    if (!pendingRaw) return;

    let pendingDraft: any = null;
    try {
      pendingDraft = JSON.parse(pendingRaw);
    } catch {
      pendingDraft = null;
    }

    window.sessionStorage.removeItem("wippa:pendingDraft");
    pendingRestoreHandledRef.current = true;

    if (pendingDraft && !currentDraftId) {
      applyDraft(pendingDraft);
      window.setTimeout(() => {
        void saveDraftRef.current({ silent: true });
      }, 0);
      return;
    }

    void saveDraftRef.current({ silent: true });
  }, [isSignedIn, currentDraftId]);

  useEffect(() => {
    if (!isSignedIn) return;
    if (versionPreview) return;
    const interval = window.setInterval(() => {
      if (!isDirtyRef.current) return;
      if (autosaveInFlightRef.current) return;
      autosaveInFlightRef.current = true;
      void saveDraftRef.current({ silent: true }).finally(() => {
        autosaveInFlightRef.current = false;
      });
    }, 10000);
    return () => window.clearInterval(interval);
  }, [isSignedIn, versionPreview]);

  function setWipMessage(message: string, tone: "info" | "success" | "error" = "info") {
    if (wipStatusTimeoutRef.current) {
      window.clearTimeout(wipStatusTimeoutRef.current);
    }
    setWipStatus({ message, tone });
    wipStatusTimeoutRef.current = window.setTimeout(() => {
      setWipStatus(null);
      wipStatusTimeoutRef.current = null;
    }, 3500);
  }

  function buildDraftSnapshot() {
    return {
      version: 1,
      title,
      gridW,
      gridH,
      grid: Array.from(grid),
      gridMode,
      meshCount,
      widthIn,
      heightIn,
      trace: {
        imageDataUrl: traceImageUrl && traceImageUrl.startsWith("data:") ? traceImageUrl : null,
        opacity: traceOpacity,
        scale: traceScale,
        offsetX: traceOffsetX,
        offsetY: traceOffsetY,
        locked: traceLocked,
      },
    };
  }

  async function capturePendingDraft() {
    if (typeof window === "undefined") return;
    try {
      const draft = buildDraftSnapshot();
      window.sessionStorage.setItem("wippa:pendingDraft", JSON.stringify(draft));
    } catch {
      // Best-effort only; sign-in should still proceed.
    }
  }

  async function buildTraceImageDataUrl() {
    if (!traceImage) {
      return traceImageUrl && traceImageUrl.startsWith("data:") ? traceImageUrl : null;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = traceImage.width;
      canvas.height = traceImage.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(traceImage, 0, 0);
      return canvas.toDataURL("image/png");
    } catch {
      return traceImageUrl && traceImageUrl.startsWith("data:") ? traceImageUrl : null;
    }
  }

  async function buildDraftPayload() {
    const traceImageDataUrl = await buildTraceImageDataUrl();
    return {
      version: 1,
      title,
      gridW,
      gridH,
      grid: Array.from(grid),
      gridMode,
      meshCount,
      widthIn,
      heightIn,
      trace: {
        imageDataUrl: traceImageDataUrl,
        opacity: traceOpacity,
        scale: traceScale,
        offsetX: traceOffsetX,
        offsetY: traceOffsetY,
        locked: traceLocked,
      },
    };
  }

  async function saveDraft(options: { silent?: boolean } = {}): Promise<boolean> {
    const silent = Boolean(options.silent);
    if (saveInFlightRef.current) {
      if (!silent) {
        setWipMessage("Save already in progress.", "info");
      }
      return false;
    }
    saveInFlightRef.current = true;
    const saveVersion = editVersionRef.current;
    const draft = await buildDraftPayload();

    if (!isSignedIn) {
      if (!silent) {
        setWipMessage("Sign in to save your work.", "info");
      }
      saveInFlightRef.current = false;
      return false;
    }

    if (!silent) {
      setWipMessage(currentDraftId ? "Saving changes..." : "Saving new WIP...", "info");
    }
    try {
      const res = await fetch(currentDraftId ? `/api/wip/${currentDraftId}` : "/api/wip", {
        method: currentDraftId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, draft }),
      });
      if (res.status === 401) {
        if (!silent) {
          setWipMessage("Please sign in to save your WIP.", "error");
        }
        return false;
      }
      if (res.status === 409) {
        if (!silent) {
          setWipMessage("A draft with this name already exists. Rename it before saving.", "error");
        } else {
          setWipMessage("Autosave needs a unique name. Rename this draft.", "error");
        }
        return false;
      }
      if (!res.ok) throw new Error("Save failed");
      const data = (await res.json()) as { id?: string; title?: string };
      if (!currentDraftId && data?.id) {
        setCurrentDraftId(data.id);
      }
      let savedTitle = title;
      if (data?.title && data.title !== title) {
        savedTitle = data.title;
        setTitle(data.title);
      }
      if (!silent) {
        setWipMessage(currentDraftId ? "Saved changes." : `Saved as "${savedTitle}".`, "success");
      }
      if (editVersionRef.current === saveVersion) {
        setIsDirty(false);
      }
      return true;
    } catch {
      setWipMessage("Could not save your WIP. Please try again.", "error");
      return false;
    } finally {
      saveInFlightRef.current = false;
    }
  }

  function applyDraft(parsed: any) {
    if (!parsed || parsed.version !== 1) {
      setWipMessage("That draft could not be loaded.", "error");
      return;
    }

    ignoreDirtyRef.current = true;
    setTitle(parsed.title || "Untitled Pattern");
    setGridW(parsed.gridW);
    setGridH(parsed.gridH);
    const expectedSize = parsed.gridW * parsed.gridH;
    const nextGrid =
      Array.isArray(parsed.grid) && parsed.grid.length === expectedSize
        ? new Uint16Array(parsed.grid)
        : makeGrid(parsed.gridW, parsed.gridH);
    setGrid(nextGrid);
    setGridMode(parsed.gridMode || "stitches");
    setMeshCount(parsed.meshCount || 10);
    setWidthIn(parsed.widthIn || 11.2);
    setHeightIn(parsed.heightIn || 14);
    setDraftGridMode(parsed.gridMode || "stitches");
    setDraftGridW(parsed.gridW);
    setDraftGridH(parsed.gridH);
    setDraftMeshCount(parsed.meshCount || 10);
    setDraftWidthIn(parsed.widthIn || 11.2);
    setDraftHeightIn(parsed.heightIn || 14);
    setHistoryState([]);
    setFutureState([]);
    setRemapSourceId(null);
    setRemapTargetId(null);
    const trace = parsed.trace;
    if (trace?.imageDataUrl) {
      const img = new Image();
      img.onload = () => {
        setTraceImage(img);
        setTraceImageUrl(trace.imageDataUrl);
        setTraceFileName("Draft image");
        setTraceOpacity(trace.opacity ?? 0.5);
        setTraceScale(trace.scale ?? 1);
        setTraceOffsetX(trace.offsetX ?? 0);
        setTraceOffsetY(trace.offsetY ?? 0);
        setTraceLocked(Boolean(trace.locked));
        traceUrlRef.current = null;
      };
      img.src = trace.imageDataUrl;
    } else {
      setTraceImage(null);
      setTraceImageUrl(null);
      setTraceFileName(null);
      setTraceOpacity(0);
      setTraceScale(1);
      setTraceOffsetX(0);
      setTraceOffsetY(0);
      setTraceLocked(false);
      traceUrlRef.current = null;
    }
    window.setTimeout(() => {
      ignoreDirtyRef.current = false;
      editVersionRef.current = 0;
      setIsDirty(false);
    }, 0);
  }

  async function loadWipFromDb(id: string) {
    setWipMessage("Loading from your account...", "info");
    try {
      const res = await fetch(`/api/wip/${id}`);
      if (res.status === 401) {
        setWipMessage("Please sign in to load your WIP.", "error");
        return;
      }
      if (!res.ok) throw new Error("Load failed");
      const data = (await res.json()) as { draft?: any };
      applyDraft(data.draft);
      setCurrentDraftId(id);
      setWipMessage("Loaded from your account.", "success");
    } catch {
      setWipMessage("Could not load your WIP. Please try again.", "error");
    }
  }

  async function openDraftPicker() {
    if (!isSignedIn) {
      draftInputRef.current?.click();
      return;
    }
    setDraftPickerLoading(true);
    setDraftPickerOpen(true);
    try {
      const res = await fetch("/api/wip");
      if (res.status === 401) {
        setWipMessage("Please sign in to load your WIP.", "error");
        setDraftPickerOpen(false);
        return;
      }
      if (!res.ok) throw new Error("Load failed");
      const data = (await res.json()) as { drafts?: DraftListItem[] };
      const drafts = Array.isArray(data.drafts) ? data.drafts : [];
      if (drafts.length === 0) {
        setWipMessage("No saved WIP found yet.", "info");
        setDraftPickerOpen(false);
        return;
      }
      setDraftPickerItems(drafts);
      for (const draft of drafts) {
        if (draftPreviewUrls[draft.id] || draftPreviewLoadingRef.current.has(draft.id)) continue;
        draftPreviewLoadingRef.current.add(draft.id);
        void (async () => {
          try {
            const detail = await fetch(`/api/wip/${draft.id}`);
            if (!detail.ok) return;
            const payload = (await detail.json()) as { draft?: any };
            const preview = buildPreviewDataUrl(payload.draft);
            setDraftPreviewUrls((prev) => ({ ...prev, [draft.id]: preview }));
          } finally {
            draftPreviewLoadingRef.current.delete(draft.id);
          }
        })();
      }
    } catch {
      setWipMessage("Could not load your WIP list. Please try again.", "error");
      setDraftPickerOpen(false);
    } finally {
      setDraftPickerLoading(false);
    }
  }

  async function selectDraft(id: string) {
    setDraftPickerOpen(false);
    await loadWipFromDb(id);
  }

  function requestDeleteDraft(id: string, draftTitle: string) {
    confirmActionRef.current = () => {
      void deleteDraft(id);
    };
    setConfirmDialog({
      title: "Delete saved WIP?",
      message: `Delete "${draftTitle}"? This cannot be undone.`,
      confirmLabel: "Delete",
    });
  }

  async function deleteDraft(id: string) {
    try {
      const res = await fetch(`/api/wip/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        setWipMessage("Please sign in to delete your WIP.", "error");
        return;
      }
      if (res.status === 404) {
        setWipMessage("That WIP no longer exists.", "info");
        return;
      }
      if (!res.ok) throw new Error("Delete failed");
      setDraftPickerItems((prev) => prev.filter((draft) => draft.id !== id));
      setDraftPreviewUrls((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (currentDraftId === id) {
        setCurrentDraftId(null);
      }
      setWipMessage("WIP deleted.", "success");
    } catch {
      setWipMessage("Could not delete this WIP. Please try again.", "error");
    }
  }

  async function fetchDraftData(id: string) {
    const res = await fetch(`/api/wip/${id}`);
    if (res.status === 401) {
      setWipMessage("Please sign in to view drafts.", "error");
      return null;
    }
    if (!res.ok) return null;
    const data = (await res.json()) as { draft?: any };
    return data?.draft ?? null;
  }

  async function openVersionHistory() {
    if (!isSignedIn) {
      setWipMessage("Please sign in to view version history.", "info");
      return;
    }
    if (!currentDraftId) {
      setWipMessage("Load a WIP first to view its history.", "info");
      return;
    }
    setVersionHistoryOpen(true);
    setVersionHistoryLoading(true);
    setVersionHistoryItems([]);
    try {
      const res = await fetch(`/api/wip/${currentDraftId}/versions`);
      if (res.status === 401) {
        setWipMessage("Please sign in to view versions.", "error");
        return;
      }
      if (!res.ok) throw new Error("Version load failed");
      const data = (await res.json()) as { versions?: DraftVersionItem[] };
      const versions = Array.isArray(data.versions) ? data.versions : [];
      setVersionHistoryItems(versions);
    } catch {
      setWipMessage("Could not load versions.", "error");
    } finally {
      setVersionHistoryLoading(false);
    }
  }

  async function viewVersion(draftId: string, versionId: string, versionCreatedAt?: string) {
    if (versionPreviewLoading) return;
    setVersionPreviewLoading(true);
    try {
      const originalDraft = await fetchDraftData(draftId);
      if (!originalDraft) {
        setWipMessage("Could not load the latest draft.", "error");
        return;
      }

      const res = await fetch(`/api/wip/${draftId}/versions/${versionId}`);
      if (res.status === 401) {
        setWipMessage("Please sign in to view versions.", "error");
        return;
      }
      if (!res.ok) throw new Error("Version fetch failed");
      const data = (await res.json()) as { draft?: any; createdAt?: string };
      if (!data?.draft) {
        setWipMessage("That version could not be loaded.", "error");
        return;
      }
      applyDraft(data.draft);
      setCurrentDraftId(draftId);
      setVersionPreview({
        draftId,
        versionId,
        originalDraft,
        versionCreatedAt: versionCreatedAt ?? data.createdAt,
      });
      setVersionHistoryOpen(false);
      setDraftPickerOpen(false);
      setWipMessage("Viewing a past version. Restore or cancel when ready.", "info");
    } catch {
      setWipMessage("Could not load this version.", "error");
    } finally {
      setVersionPreviewLoading(false);
    }
  }

  async function restoreVersion(draftId: string, versionId: string) {
    try {
      const res = await fetch(`/api/wip/${draftId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      if (res.status === 401) {
        setWipMessage("Please sign in to restore versions.", "error");
        return;
      }
      if (!res.ok) throw new Error("Restore failed");
      const data = (await res.json()) as { draft?: any };
      if (data?.draft) {
        applyDraft(data.draft);
        setCurrentDraftId(draftId);
        const preview = buildPreviewDataUrl(data.draft);
        setDraftPreviewUrls((prev) => ({ ...prev, [draftId]: preview }));
      }
      setDraftPickerOpen(false);
      setVersionHistoryOpen(false);
      setVersionPreview(null);
      setWipMessage("Version restored.", "success");
    } catch {
      setWipMessage("Could not restore this version. Please try again.", "error");
    }
  }

  function cancelVersionPreview() {
    if (!versionPreview) return;
    applyDraft(versionPreview.originalDraft);
    setCurrentDraftId(versionPreview.draftId);
    setVersionPreview(null);
    setWipMessage("Back to the latest version.", "info");
  }

  async function loadWip() {
    if (!isSignedIn) {
      draftInputRef.current?.click();
      return;
    }
    await openDraftPicker();
  }

  function buildBlankDraft() {
    return {
      version: 1,
      title: "Untitled Pattern",
      gridW,
      gridH,
      grid: Array.from(makeGrid(gridW, gridH, 0)),
      gridMode,
      meshCount,
      widthIn,
      heightIn,
      trace: {
        imageDataUrl: null,
        opacity: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        locked: false,
      },
    };
  }

  async function startNewWip() {
    if (!isSignedIn) {
      setWipMessage("Sign in to save before starting a new WIP.", "info");
      return;
    }
    const saved = await saveDraft();
    if (!saved) return;
    applyDraft(buildBlankDraft());
    setCurrentDraftId(null);
    setWipMessage("New WIP started.", "success");
  }

  function loadDraftFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        applyDraft(parsed);
        setCurrentDraftId(null);
        setWipMessage("Loaded from file.", "success");
      } catch {
        setWipMessage("That draft could not be loaded.", "error");
      }
    };
    reader.readAsText(file);
  }

  function formatDraftDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffMs = startOfToday.getTime() - startOfDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    if (diffDays === 0) return `Today at ${time}`;
    if (diffDays === 1) return `Yesterday at ${time}`;
    if (diffDays === 2) return `2 days ago at ${time}`;
    if (diffDays === 3) return `3 days ago at ${time}`;

    const datePart = date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
    return `${datePart} at ${time}`;
  }

  function buildPreviewDataUrl(draft: any) {
    if (!draft) return null;
    const width = typeof draft.gridW === "number" && draft.gridW > 0 ? draft.gridW : 0;
    const height = typeof draft.gridH === "number" && draft.gridH > 0 ? draft.gridH : 0;
    const gridData = Array.isArray(draft.grid) ? draft.grid : null;
    if (!width || !height || !gridData) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const image = ctx.createImageData(width, height);
    const data = image.data;

    for (let i = 0; i < width * height; i++) {
      const colorId = gridData[i];
      if (!colorId) continue;
      const color = paletteById.get(colorId);
      if (!color) continue;
      const rgb = hexToRgb(color.hex);
      if (!rgb) continue;
      const offset = i * 4;
      data[offset] = rgb[0];
      data[offset + 1] = rgb[1];
      data[offset + 2] = rgb[2];
      data[offset + 3] = 255;
    }

    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL("image/png");
  }

  return {
    wipStatus,
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
    closeDraftPicker: () => setDraftPickerOpen(false),
    closeVersionHistory: () => setVersionHistoryOpen(false),
    viewVersion,
    restoreVersion,
    cancelVersionPreview,
    startNewWip,
    formatDraftDate,
  };
}
