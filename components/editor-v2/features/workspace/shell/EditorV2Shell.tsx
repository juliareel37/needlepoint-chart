"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { typographyStyles } from "@/app/design-system/typography";
import { useOpenSignIn } from "@/components/auth/useOpenSignIn";
import { IS_DEV_APP_MODE } from "@/lib/editor-v2/config";
import {
  getActiveColor,
  getActiveColorId,
  getCanRedo,
  getCanUndo,
  getPaletteColors,
  getSelectionBounds,
  getTraceDocument,
  getUsedColors,
  getViewport,
} from "@/lib/editor-v2/editor/selectors";
import { createGridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import {
  Button,
  SingleSelectDropdown,
  ToolbarButton,
  ToolbarIcon,
} from "@/components/design-system";
import { useEditorStoreDispatch, useEditorStoreSelector } from "../../../app/editorStoreContext";
import type {
  EditorDocumentState,
} from "@/lib/editor-v2/editor/store";
import type { SavedEditorV2DocumentRecord } from "../../../app/editorV2ServerPersistence";
import type {
  DeleteButtonState,
  ExportButtonState,
  EditorV2ErrorNotification,
  EditorV2SuccessNotification,
  SaveButtonState,
} from "../../../app/EditorV2Workspace";
import {
  createCancelIconPlacementCommand,
  createClearSelectionCommand,
  createRedoCommand,
  createSetActiveSidebarSectionCommand,
  createSetPreviewModeCommand,
  createPanViewportCommand,
  createSetSidebarCollapsedCommand,
  createSetViewportZoomCommand,
  createUndoCommand,
} from "../workspaceCommands";
import { EditorRail } from "./EditorRail";
import { EditorSidebar } from "./EditorSidebar";
import { FloatingToolbar } from "./FloatingToolbar";
import { ButtonIcon, Modal, Notification } from "@/components/design-system";
import { TextPlacementToolbar } from "./TextPlacementToolbar";
import { IconPlacementToolbar } from "./IconPlacementToolbar";
import { TraceRepositionToolbar } from "./TraceRepositionToolbar";
import { SaveStatusCard } from "./SaveStatusCard";
import { GridWorldSurface } from "../stage/GridWorldSurface";
import { ViewportToolbar } from "./ViewportToolbar";
import styles from "./EditorV2Shell.module.css";

const EXPANDED_SIDEBAR_WIDTH = 320;
const DEFAULT_CELL_SIZE = 28;
const FIT_ZOOM_PADDING_FACTOR = 0.92;
const SAVE_SUCCESS_PREFIX = "Saved at ";
const AUTOSAVE_SUCCESS_PREFIX = "Autosaved at ";
const ERROR_NOTIFICATION_DURATION_MS = 8000;
const ENABLE_MOBILE_SELECTION_DOCK = false;
const DUPLICATE_QUERY_PARAM = "duplicate";
const DUPLICATE_STORAGE_PREFIX = "editor-v2-duplicate:";
const HEADER_FILE_MENU_ITEMS = [
  { id: "new", label: "Create new", icon: "/icons/lucide/file-plus-corner.svg" },
  { id: "duplicate", label: "Duplicate", icon: "/icons/lucide/copy.svg" },
  { id: "rename", label: "Rename", icon: "/icons/lucide/pencil.svg" },
  { id: "download", label: "Download", icon: "/icons/lucide/download.svg" },
  { id: "delete", label: "Delete", icon: "/icons/lucide/trash.svg" },
] as const;

interface PreviewSessionSnapshot {
  sidebarCollapsed: boolean;
  viewport: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
}

interface BottomPanelCanvasFocusSnapshot {
  viewport: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
}

export function EditorV2Shell({
  canvasLoading,
  currentStorageId,
  deleteButtonState,
  errorNotification,
  exportButtonState,
  hasSavedDesignAccess,
  onCanvasReady,
  onDeleteCurrentDesign,
  onDismissErrorNotification,
  onDismissSuccessNotification,
  onExportDocument,
  onSaveDocument,
  onLoadDocument,
  onStartOver,
  recoveredLocalChanges,
  saveButtonState,
  saveMessage,
  saveMode,
  savedDocuments,
  savedDocumentsLoading,
  selectedStorageId,
  setSelectedStorageId,
  setupModal,
  setupModalOpen,
  successNotification,
}: {
  canvasLoading: boolean;
  currentStorageId: string;
  deleteButtonState: DeleteButtonState;
  errorNotification: EditorV2ErrorNotification | null;
  exportButtonState: ExportButtonState;
  hasSavedDesignAccess: boolean;
  onCanvasReady: () => void;
  onDeleteCurrentDesign: (document: EditorDocumentState) => Promise<void> | void;
  onDismissErrorNotification: () => void;
  onDismissSuccessNotification: () => void;
  onExportDocument: (document: EditorDocumentState) => Promise<void> | void;
  onSaveDocument: (document: EditorDocumentState) => Promise<void> | void;
  onLoadDocument: (record: SavedEditorV2DocumentRecord) => Promise<void> | void;
  onStartOver: () => void;
  recoveredLocalChanges: boolean;
  saveButtonState: SaveButtonState;
  saveMessage: string;
  saveMode: "manual" | "autosave";
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  setupModal: ReactNode;
  setupModalOpen: boolean;
  successNotification: EditorV2SuccessNotification | null;
}) {
  const openSignIn = useOpenSignIn();
  const dispatch = useEditorStoreDispatch();
  const state = useEditorStoreSelector((currentState) => currentState);

  const document = state.document;
  const title = state.document.project.title;
  const activeTool = state.session.activeTool.tool;
  const brushSize = state.session.activeTool.brushSize;
  const colorsById = state.document.palette.colorsById;
  const selectionScopeActive =
    state.session.selection.mode !== "none" && state.session.selection.rect !== null;
  const selectionControlActive =
    activeTool === "lasso" || state.session.selection.mode !== "none";
  const usedColors = getUsedColors(state, { scope: "auto" });
  const selectionBounds = getSelectionBounds(state);
  const activeColorId = getActiveColorId(state);
  const activeColor = getActiveColor(state);
  const palette = getPaletteColors(state);
  const featuredColorIds = usedColors.map((entry) => entry.colorId);
  const canUndo = getCanUndo(state);
  const canRedo = getCanRedo(state);
  const hasPaintedCells = state.document.grid.cells.some((cell) => cell !== null);
  const trace = getTraceDocument(state);
  const viewport = getViewport(state);
  const showGridlines = state.ui.preferences.showGridlines;
  const showRuler = state.ui.preferences.showRuler;
  const showSymbols = state.ui.preferences.showSymbols;
  const previewMode = state.ui.preferences.previewMode;
  const activeSidebarSection = state.ui.shell.activeSidebarSection;
  const sidebarCollapsed = state.ui.shell.sidebarCollapsed;
  const hasUnsavedChanges = state.session.persistence.dirty;
  const hasCompletedSave = state.session.persistence.lastSavedAt !== null;
  const traceRepositionActive = Boolean(state.session.traceInteraction.repositionSnapshot);
  const traceRepositionOrigin = state.session.traceInteraction.repositionOrigin;
  const mirrorSession = state.session.mirrorInteraction.session;
  const textPlacement = state.session.textInteraction.placement;
  const iconPlacement = state.session.iconInteraction.placement;
  const selectionCommitted = Boolean(selectionBounds && !state.session.selection.preview);
  const canvasWorldRef = useRef<HTMLDivElement | null>(null);
  const stageToolbarTopRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedInitialFitRef = useRef(false);
  const hasAppliedMobileLayoutRef = useRef(false);
  const mobileTraceRepositionWasActiveRef = useRef(false);
  const mobileTextPlacementWasActiveRef = useRef(false);
  const previewSessionSnapshotRef = useRef<PreviewSessionSnapshot | null>(null);
  const bottomPanelCanvasFocusSnapshotRef =
    useRef<BottomPanelCanvasFocusSnapshot | null>(null);
  const previewFitPendingRef = useRef(false);
  const bottomPanelCanvasFocusFitPendingRef = useRef(false);
  const reopenColorPanelAfterSelectionRef = useRef(false);
  const usedColorsSelectionPromptStartedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [isBottomPanelLayout, setIsBottomPanelLayout] = useState(false);
  const [isBottomPanelCanvasFocusActive, setIsBottomPanelCanvasFocusActive] =
    useState(false);
  const [isCompactHistoryLayout, setIsCompactHistoryLayout] = useState(false);
  const [layoutModeResolved, setLayoutModeResolved] = useState(false);
  const [canvasWorldSize, setCanvasWorldSize] = useState({ width: 0, height: 0 });
  const [stageToolbarTopInset, setStageToolbarTopInset] = useState(0);
  const [saveNotificationVisible, setSaveNotificationVisible] = useState(false);
  const [saveBannerDismissed, setSaveBannerDismissed] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [highlightedColorId, setHighlightedColorId] = useState<string | null>(null);
  const [renameRequestToken, setRenameRequestToken] = useState(0);
  const [headerFileLeftTarget, setHeaderFileLeftTarget] = useState<HTMLElement | null>(null);
  const [headerActionsTarget, setHeaderActionsTarget] = useState<HTMLElement | null>(null);
  const [headerAutosaveTarget, setHeaderAutosaveTarget] = useState<HTMLElement | null>(null);
  const [headerHistoryTarget, setHeaderHistoryTarget] = useState<HTMLElement | null>(null);
  const [headerOverflowTarget, setHeaderOverflowTarget] = useState<HTMLElement | null>(null);
  const [topBannerTarget, setTopBannerTarget] = useState<HTMLElement | null>(null);
  const [usedColorsSelectionPromptVisible, setUsedColorsSelectionPromptVisible] =
    useState(false);
  const mobileSelectionDocked =
    ENABLE_MOBILE_SELECTION_DOCK &&
    isBottomPanelLayout &&
    (Boolean(selectionBounds) || activeTool === "lasso");
  const mobileBottomPanelVisibleHeightRatio =
    isBottomPanelLayout && !sidebarCollapsed
      ? isBottomPanelCanvasFocusActive
        ? 0.6
        : 0.25
      : 1;
  const previewModeDisabled =
    Boolean(textPlacement) ||
    Boolean(iconPlacement) ||
    traceRepositionActive ||
    selectionControlActive;
  const mobileVisibleTopInset =
    isBottomPanelLayout && !sidebarCollapsed ? stageToolbarTopInset * 0.5 : 0;
  const mobileHeaderMenuItems = useMemo(
    () =>
      hasSavedDesignAccess
        ? [
            {
              id: previewMode ? "exit-preview" : "preview",
              label: previewMode ? "Exit preview" : "Preview",
            },
            ...HEADER_FILE_MENU_ITEMS,
          ]
        : [
            {
              id: previewMode ? "exit-preview" : "preview",
              label: previewMode ? "Exit preview" : "Preview",
            },
            ...HEADER_FILE_MENU_ITEMS,
            { id: "sign-in", label: "Sign in" },
          ],
    [hasSavedDesignAccess, previewMode],
  );
  const gridMetrics = useMemo(
    () =>
      createGridWorldMetrics(
        state.document.grid.width,
        state.document.grid.height,
        DEFAULT_CELL_SIZE,
        0,
      ),
    [state.document.grid.height, state.document.grid.width],
  );
  const fitZoom = useMemo(() => {
    if (canvasWorldSize.width <= 0 || canvasWorldSize.height <= 0) {
      return 1;
    }

    const availableWidth = Math.max(
      canvasWorldSize.width - (sidebarCollapsed || isBottomPanelLayout ? 0 : EXPANDED_SIDEBAR_WIDTH),
      1,
    );
    const availableHeight = Math.max(
      canvasWorldSize.height * mobileBottomPanelVisibleHeightRatio - mobileVisibleTopInset,
      1,
    );

    return Math.min(
      availableWidth / Math.max(gridMetrics.surfaceWidth, 1),
      availableHeight / Math.max(gridMetrics.surfaceHeight, 1),
    ) * FIT_ZOOM_PADDING_FACTOR;
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    gridMetrics.surfaceHeight,
    gridMetrics.surfaceWidth,
    mobileVisibleTopInset,
    mobileBottomPanelVisibleHeightRatio,
  ]);
  const zoomAnchor = useMemo(() => {
    if (canvasWorldSize.width <= 0 || canvasWorldSize.height <= 0) {
      return null;
    }

    const visibleLeftInset =
      sidebarCollapsed || isBottomPanelLayout ? 0 : EXPANDED_SIDEBAR_WIDTH;
    const visibleCenterX =
      visibleLeftInset + (canvasWorldSize.width - visibleLeftInset) / 2;
    const visibleCanvasHeight = Math.max(
      canvasWorldSize.height * mobileBottomPanelVisibleHeightRatio - mobileVisibleTopInset,
      1,
    );
    const visibleCenterY = mobileVisibleTopInset + visibleCanvasHeight / 2;
    const centeredWorldOriginX =
      (canvasWorldSize.width - gridMetrics.surfaceWidth) / 2;
    const centeredWorldOriginY =
      (canvasWorldSize.height - gridMetrics.surfaceHeight) / 2;

    return {
      x: visibleCenterX - centeredWorldOriginX,
      y: visibleCenterY - centeredWorldOriginY,
    };
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    gridMetrics.surfaceHeight,
    gridMetrics.surfaceWidth,
    isBottomPanelLayout,
    mobileVisibleTopInset,
    mobileBottomPanelVisibleHeightRatio,
    sidebarCollapsed,
  ]);
  const textViewportCenter = useMemo(() => {
    if (viewport.zoom <= 0 || canvasWorldSize.width <= 0 || canvasWorldSize.height <= 0) {
      return null;
    }

    const visibleLeftInset =
      sidebarCollapsed || isBottomPanelLayout ? 0 : EXPANDED_SIDEBAR_WIDTH;
    const visibleCenterX =
      visibleLeftInset + (canvasWorldSize.width - visibleLeftInset) / 2;
    const visibleCanvasHeight = Math.max(
      canvasWorldSize.height - mobileVisibleTopInset,
      1,
    );
    const visibleCenterY = mobileVisibleTopInset + visibleCanvasHeight / 2;
    const centeredWorldOriginX =
      (canvasWorldSize.width - gridMetrics.surfaceWidth) / 2;
    const centeredWorldOriginY =
      (canvasWorldSize.height - gridMetrics.surfaceHeight) / 2;
    const anchorX = visibleCenterX - centeredWorldOriginX;
    const anchorY = visibleCenterY - centeredWorldOriginY;

    return {
      x: (anchorX - viewport.offsetX) / viewport.zoom,
      y: (anchorY - viewport.offsetY) / viewport.zoom,
    };
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    gridMetrics.surfaceHeight,
    gridMetrics.surfaceWidth,
    isBottomPanelLayout,
    mobileVisibleTopInset,
    sidebarCollapsed,
    viewport.offsetX,
    viewport.offsetY,
    viewport.zoom,
  ]);
  const textViewportWidth = useMemo(() => {
    if (viewport.zoom <= 0 || canvasWorldSize.width <= 0) {
      return null;
    }

    const visibleLeftInset =
      sidebarCollapsed || isBottomPanelLayout ? 0 : EXPANDED_SIDEBAR_WIDTH;
    const visibleCanvasWidth = Math.max(canvasWorldSize.width - visibleLeftInset, 1);

    return visibleCanvasWidth / viewport.zoom;
  }, [
    canvasWorldSize.width,
    isBottomPanelLayout,
    sidebarCollapsed,
    viewport.zoom,
  ]);
  const textViewportHeight = useMemo(() => {
    if (viewport.zoom <= 0 || canvasWorldSize.height <= 0) {
      return null;
    }

    return Math.max(
      canvasWorldSize.height - mobileVisibleTopInset,
      1,
    ) / viewport.zoom;
  }, [
    canvasWorldSize.height,
    mobileVisibleTopInset,
    viewport.zoom,
  ]);
  const fitToGrid = useCallback(() => {
    if (
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    const visibleLeftInset =
      sidebarCollapsed || isBottomPanelLayout ? 0 : EXPANDED_SIDEBAR_WIDTH;
    const availableLeft = visibleLeftInset;
    const availableTop = mobileVisibleTopInset;
    const availableWidth = canvasWorldSize.width - visibleLeftInset;
    const visibleCanvasHeight =
      canvasWorldSize.height * mobileBottomPanelVisibleHeightRatio - mobileVisibleTopInset;
    const renderedWidth = gridMetrics.surfaceWidth * fitZoom;
    const renderedHeight = gridMetrics.surfaceHeight * fitZoom;
    const frameOriginX =
      (canvasWorldSize.width - gridMetrics.surfaceWidth) / 2;
    const frameOriginY =
      (canvasWorldSize.height - gridMetrics.surfaceHeight) / 2;
    const targetOffsetX =
      availableLeft + (availableWidth - renderedWidth) / 2 - frameOriginX;
    const targetOffsetY =
      availableTop + (visibleCanvasHeight - renderedHeight) / 2 - frameOriginY;

    dispatch(createSetViewportZoomCommand(fitZoom));
    dispatch(
      createPanViewportCommand(
        targetOffsetX - viewport.offsetX,
        targetOffsetY - viewport.offsetY,
      ),
    );
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    dispatch,
    fitZoom,
    gridMetrics.surfaceHeight,
    gridMetrics.surfaceWidth,
    isBottomPanelLayout,
    mobileVisibleTopInset,
    mobileBottomPanelVisibleHeightRatio,
    sidebarCollapsed,
    viewport.offsetX,
    viewport.offsetY,
  ]);

  const enterPreviewMode = useCallback(() => {
    if (previewMode || previewModeDisabled) {
      return;
    }

    previewSessionSnapshotRef.current = {
      sidebarCollapsed,
      viewport: {
        zoom: viewport.zoom,
        offsetX: viewport.offsetX,
        offsetY: viewport.offsetY,
      },
    };
    previewFitPendingRef.current = true;

    dispatch(createSetPreviewModeCommand(true));
    if (!sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(true));
    }
  }, [
    dispatch,
    previewMode,
    previewModeDisabled,
    sidebarCollapsed,
    viewport.offsetX,
    viewport.offsetY,
    viewport.zoom,
  ]);

  const exitPreviewMode = useCallback(() => {
    if (!previewMode) {
      return;
    }

    const snapshot = previewSessionSnapshotRef.current;
    previewFitPendingRef.current = false;
    dispatch(createSetPreviewModeCommand(false));

    if (!snapshot) {
      return;
    }

    if (sidebarCollapsed !== snapshot.sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(snapshot.sidebarCollapsed));
    }

    dispatch(createSetViewportZoomCommand(snapshot.viewport.zoom));
    dispatch(
      createPanViewportCommand(
        snapshot.viewport.offsetX - viewport.offsetX,
        snapshot.viewport.offsetY - viewport.offsetY,
      ),
    );

    previewSessionSnapshotRef.current = null;
  }, [
    dispatch,
    previewMode,
    sidebarCollapsed,
    viewport.offsetX,
    viewport.offsetY,
  ]);

  const exitBottomPanelCanvasFocus = useCallback(
    (options?: { restoreViewport?: boolean }) => {
      const restoreViewport = options?.restoreViewport ?? true;
      const snapshot = bottomPanelCanvasFocusSnapshotRef.current;

      bottomPanelCanvasFocusFitPendingRef.current = false;
      setIsBottomPanelCanvasFocusActive(false);

      if (!restoreViewport || !snapshot) {
        bottomPanelCanvasFocusSnapshotRef.current = null;
        return;
      }

      dispatch(createSetViewportZoomCommand(snapshot.viewport.zoom));
      dispatch(
        createPanViewportCommand(
          snapshot.viewport.offsetX - viewport.offsetX,
          snapshot.viewport.offsetY - viewport.offsetY,
        ),
      );

      bottomPanelCanvasFocusSnapshotRef.current = null;
    },
    [dispatch, viewport.offsetX, viewport.offsetY],
  );

  const enterBottomPanelCanvasFocus = useCallback(() => {
    if (isBottomPanelCanvasFocusActive || !isBottomPanelLayout || sidebarCollapsed) {
      return;
    }

    bottomPanelCanvasFocusSnapshotRef.current = {
      viewport: {
        zoom: viewport.zoom,
        offsetX: viewport.offsetX,
        offsetY: viewport.offsetY,
      },
    };
    bottomPanelCanvasFocusFitPendingRef.current = true;
    setIsBottomPanelCanvasFocusActive(true);
  }, [
    isBottomPanelCanvasFocusActive,
    isBottomPanelLayout,
    sidebarCollapsed,
    viewport.offsetX,
    viewport.offsetY,
    viewport.zoom,
  ]);

  const toggleBottomPanelCanvasFocus = useCallback(() => {
    if (isBottomPanelCanvasFocusActive) {
      exitBottomPanelCanvasFocus();
      return;
    }

    enterBottomPanelCanvasFocus();
  }, [
    enterBottomPanelCanvasFocus,
    exitBottomPanelCanvasFocus,
    isBottomPanelCanvasFocusActive,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setLayoutModeResolved(true);
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => {
      setIsBottomPanelLayout(mediaQuery.matches);
      setLayoutModeResolved(true);
    };

    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 1000px)");
    const update = () => {
      setIsCompactHistoryLayout(mediaQuery.matches);
    };

    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  useEffect(() => {
    const element = canvasWorldRef.current;

    if (!element) {
      return;
    }

    const update = () => {
      const rect = element.getBoundingClientRect();

      setCanvasWorldSize({
        width: rect.width,
        height: rect.height,
      });
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => {
      const canvasElement = canvasWorldRef.current;
      const toolbarElement = stageToolbarTopRef.current;

      if (!canvasElement || !toolbarElement || previewMode || isBottomPanelCanvasFocusActive) {
        setStageToolbarTopInset(0);
        return;
      }

      const canvasRect = canvasElement.getBoundingClientRect();
      const toolbarRect = toolbarElement.getBoundingClientRect();
      const nextInset = Math.max(0, toolbarRect.bottom - canvasRect.top + 12);
      setStageToolbarTopInset((current) =>
        Math.abs(current - nextInset) < 0.5 ? current : nextInset,
      );
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const observer = new ResizeObserver(update);
    if (canvasWorldRef.current) {
      observer.observe(canvasWorldRef.current);
    }
    if (stageToolbarTopRef.current) {
      observer.observe(stageToolbarTopRef.current);
    }

    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [isBottomPanelCanvasFocusActive, previewMode, sidebarCollapsed, activeSidebarSection]);

  useEffect(() => {
    if (
      !layoutModeResolved ||
      hasAppliedInitialFitRef.current ||
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    fitToGrid();
    hasAppliedInitialFitRef.current = true;
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    fitZoom,
    fitToGrid,
    layoutModeResolved,
  ]);

  useEffect(() => {
    if (!isBottomPanelLayout) {
      hasAppliedMobileLayoutRef.current = false;
      if (isBottomPanelCanvasFocusActive) {
        exitBottomPanelCanvasFocus({ restoreViewport: false });
      }
      return;
    }

    if (
      !layoutModeResolved ||
      hasAppliedMobileLayoutRef.current ||
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    if (!sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(true));
      return;
    }

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      fitToGrid();
      hasAppliedMobileLayoutRef.current = true;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    dispatch,
    fitToGrid,
    fitZoom,
    isBottomPanelLayout,
    isBottomPanelCanvasFocusActive,
    layoutModeResolved,
    sidebarCollapsed,
    exitBottomPanelCanvasFocus,
  ]);

  useEffect(() => {
    if (
      !previewMode ||
      !previewFitPendingRef.current ||
      !sidebarCollapsed ||
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      fitToGrid();
      previewFitPendingRef.current = false;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    fitToGrid,
    fitZoom,
    previewMode,
    sidebarCollapsed,
  ]);

  useEffect(() => {
    if (!isBottomPanelCanvasFocusActive || sidebarCollapsed) {
      if (isBottomPanelCanvasFocusActive && sidebarCollapsed) {
        exitBottomPanelCanvasFocus({ restoreViewport: false });
      }
      return;
    }

    if (
      !bottomPanelCanvasFocusFitPendingRef.current ||
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      fitToGrid();
      bottomPanelCanvasFocusFitPendingRef.current = false;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    exitBottomPanelCanvasFocus,
    fitToGrid,
    fitZoom,
    isBottomPanelCanvasFocusActive,
    sidebarCollapsed,
  ]);

  useEffect(() => {
    if (!traceRepositionActive) {
      mobileTraceRepositionWasActiveRef.current = false;
      return;
    }

    if (!isBottomPanelLayout && activeSidebarSection !== "trace") {
      dispatch(createSetActiveSidebarSectionCommand("trace"));
    }

    if (isBottomPanelLayout) {
      if (!mobileTraceRepositionWasActiveRef.current && !sidebarCollapsed) {
        dispatch(createSetSidebarCollapsedCommand(true));
      }
      mobileTraceRepositionWasActiveRef.current = true;
      return;
    }

    if (sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(false));
    }
  }, [
    activeSidebarSection,
    dispatch,
    isBottomPanelLayout,
    sidebarCollapsed,
    traceRepositionActive,
  ]);

  useEffect(() => {
    if (!textPlacement) {
      mobileTextPlacementWasActiveRef.current = false;
      return;
    }

    if (!isBottomPanelLayout) {
      return;
    }

    if (!mobileTextPlacementWasActiveRef.current && !sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(true));
    }

    mobileTextPlacementWasActiveRef.current = true;
  }, [dispatch, isBottomPanelLayout, sidebarCollapsed, textPlacement]);

  useEffect(() => {
    if (!previewMode) {
      return;
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      exitPreviewMode();
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [exitPreviewMode, previewMode]);

  useEffect(() => {
    if (!iconPlacement) {
      return;
    }

    if (!isBottomPanelLayout) {
      return;
    }

    if (!sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(true));
    }
  }, [dispatch, iconPlacement, isBottomPanelLayout, sidebarCollapsed]);

  useEffect(() => {
    if (!reopenColorPanelAfterSelectionRef.current) {
      return;
    }

    if (selectionCommitted) {
      dispatch(createSetSidebarCollapsedCommand(false));
      reopenColorPanelAfterSelectionRef.current = false;
      return;
    }

    if (activeTool !== "lasso" && !selectionScopeActive) {
      reopenColorPanelAfterSelectionRef.current = false;
    }
  }, [activeTool, dispatch, selectionCommitted, selectionScopeActive]);

  useEffect(() => {
    if (!usedColorsSelectionPromptVisible) {
      usedColorsSelectionPromptStartedRef.current = false;
      return;
    }

    if (selectionCommitted) {
      setUsedColorsSelectionPromptVisible(false);
      return;
    }

    if (selectionControlActive) {
      usedColorsSelectionPromptStartedRef.current = true;
      return;
    }

    if (usedColorsSelectionPromptStartedRef.current) {
      setUsedColorsSelectionPromptVisible(false);
    }
  }, [
    selectionCommitted,
    selectionControlActive,
    usedColorsSelectionPromptVisible,
  ]);

  const [selectionRequestKey, setSelectionRequestKey] = useState(0);

  const handleUsedColorsScopeModeChange = useCallback(
    (mode: "full-canvas" | "selection") => {
      if (mode === "selection") {
        if (isBottomPanelLayout) {
          if (!sidebarCollapsed) {
            dispatch(createSetSidebarCollapsedCommand(true));
          }
          reopenColorPanelAfterSelectionRef.current = true;
        } else if (sidebarCollapsed) {
          dispatch(createSetSidebarCollapsedCommand(false));
        }

        setSelectionRequestKey((current) => current + 1);
        setUsedColorsSelectionPromptVisible(true);
        return;
      }

      reopenColorPanelAfterSelectionRef.current = false;
      setUsedColorsSelectionPromptVisible(false);
      dispatch(createClearSelectionCommand());
    },
    [dispatch, isBottomPanelLayout, sidebarCollapsed],
  );

  useEffect(() => {
    if (!iconPlacement) {
      return;
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.key !== "Backspace" && event.key !== "Delete") {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      dispatch(createCancelIconPlacementCommand());
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [dispatch, iconPlacement]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!saveMessage.startsWith(SAVE_SUCCESS_PREFIX)) {
      setSaveNotificationVisible(false);
      return;
    }

    setSaveNotificationVisible(true);

    const timeoutId = window.setTimeout(() => {
      setSaveNotificationVisible(false);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, 
  [saveMessage]);

  useEffect(() => {
    setHeaderFileLeftTarget(window.document.getElementById("app-header-file-left"));
    setHeaderActionsTarget(window.document.getElementById("app-header-actions"));
    setHeaderAutosaveTarget(window.document.getElementById("app-header-autosave"));
    setHeaderHistoryTarget(window.document.getElementById("app-header-history-right"));
    setHeaderOverflowTarget(window.document.getElementById("app-header-overflow-right"));
    setTopBannerTarget(window.document.getElementById("app-top-banner"));
  }, []);

  const showSaveStatus =
    saveMode === "autosave" && !hasCompletedSave && !saveMessage
      ? true
      : Boolean(saveMessage || hasUnsavedChanges);
  const showAutoSavePanelStatus = isBottomPanelLayout && saveMode === "autosave";
  const useTopSaveBanner =
    isBottomPanelLayout && saveMode !== "autosave" && showSaveStatus;
  const showTopSaveBanner = useTopSaveBanner && !saveBannerDismissed;
  const showSaveConfirmationOverlay =
    saveNotificationVisible &&
    (IS_DEV_APP_MODE || saveMode === "manual" || !hasSavedDesignAccess);

  useEffect(() => {
    setSaveBannerDismissed(false);
  }, [hasUnsavedChanges, saveMessage]);

  useEffect(() => {
    const appShellRoot = window.document.getElementById("app-shell-root");
    if (!appShellRoot) {
      return;
    }

    appShellRoot.style.setProperty(
      "--app-top-banner-height",
      showTopSaveBanner ? "30px" : "0px",
    );

    return () => {
      appShellRoot.style.setProperty("--app-top-banner-height", "0px");
    };
  }, [showTopSaveBanner]);

  useEffect(() => {
    const appShellRoot = window.document.getElementById("app-shell-root");
    if (!appShellRoot) {
      return;
    }

    appShellRoot.setAttribute(
      "data-mobile-header-overflow-auth",
      isBottomPanelLayout ? "true" : "false",
    );

    return () => {
      appShellRoot.removeAttribute("data-mobile-header-overflow-auth");
    };
  }, [isBottomPanelLayout]);

  useEffect(() => {
    if (!errorNotification) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onDismissErrorNotification();
    }, ERROR_NOTIFICATION_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [errorNotification, onDismissErrorNotification]);

  useEffect(() => {
    if (!successNotification) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onDismissSuccessNotification();
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [onDismissSuccessNotification, successNotification]);

  function handleHeaderMenuAction(value: string): void {
    if (value === "preview") {
      enterPreviewMode();
      return;
    }

    if (value === "exit-preview") {
      exitPreviewMode();
      return;
    }

    if (value === "new") {
      onStartOver();
      return;
    }

    if (value === "duplicate") {
      duplicateDesignToNewTab(document);
      return;
    }

    if (value === "rename") {
      dispatch(createSetActiveSidebarSectionCommand("document"));
      dispatch(createSetSidebarCollapsedCommand(false));
      setRenameRequestToken((currentValue) => currentValue + 1);
      return;
    }

    if (value === "download") {
      void onExportDocument(document);
      return;
    }

    if (value === "delete") {
      setDeleteConfirmationOpen(true);
      return;
    }

    if (value === "sign-in") {
      openSignIn();
    }
  }

  function renderHeaderMenuItemLabel(item: { id: string; label: string; icon?: string }) {
    if (item.id === "preview" || item.id === "exit-preview") {
      return (
        <span className={styles.headerOverflowItemLabel}>
          <ButtonIcon
            icon={
              item.id === "exit-preview"
                ? "/icons/lucide/eye-off.svg"
                : "/icons/lucide/eye.svg"
            }
            className={styles.saveButtonIcon}
          />
          <span>{item.label}</span>
        </span>
      );
    }

    if (item.id === "sign-in") {
      return (
        <span className={styles.headerOverflowItemLabel}>
          <ButtonIcon
            icon="/icons/lucide/log-in.svg"
            className={styles.saveButtonIcon}
          />
          <span>{item.label}</span>
        </span>
      );
    }

    if (item.id === "download") {
      return (
        <span className={styles.headerOverflowItemLabel}>
          {exportButtonState === "exporting" ? (
            <span className={styles.saveButtonSpinner} aria-hidden="true" />
          ) : (
            <ButtonIcon
              icon="/icons/lucide/download.svg"
              className={styles.saveButtonIcon}
            />
          )}
          <span>
            {exportButtonState === "exporting" ? "Exporting..." : item.label}
          </span>
        </span>
      );
    }

    if (item.icon) {
      return (
        <span className={styles.headerOverflowItemLabel}>
          <ButtonIcon icon={item.icon} className={styles.saveButtonIcon} />
          <span>{item.label}</span>
        </span>
      );
    }

    return item.label;
  }

  return (
    <main className={styles.shell}>
      {!setupModalOpen &&
      headerFileLeftTarget &&
      (saveMode === "manual" || !hasSavedDesignAccess)
        ? createPortal(
            <Button
              type="button"
              variant="primary"
              size="sm"
              className={styles.headerSaveButton}
              disabled={saveButtonState === "saving"}
              onClick={() => onSaveDocument(document)}
            >
              <SaveButtonLabel
                hasSavedDesignAccess={hasSavedDesignAccess}
                state={saveButtonState}
              />
            </Button>,
            headerFileLeftTarget,
          )
        : null}
      {!setupModalOpen && !useTopSaveBanner && !showAutoSavePanelStatus && headerAutosaveTarget
        ? createPortal(
            isBottomPanelLayout ? (
              <SaveStatusCard
                autoSaveEnabled={saveMode === "autosave" && !hasCompletedSave && !saveMessage}
                hasSavedDesignAccess={hasSavedDesignAccess}
                hasUnsavedChanges={hasUnsavedChanges}
                layout="header"
                onDismiss={null}
                onSignIn={openSignIn}
                recoveredLocalChanges={recoveredLocalChanges}
                saveMode={saveMode}
                saveMessage={saveMessage}
              />
            ) : (
              <div className={styles.headerFileMenuGroup}>
                <SingleSelectDropdown
                  ariaLabel="File actions"
                  items={[...HEADER_FILE_MENU_ITEMS]}
                  value=""
                  placeholder="File"
                  triggerLabel={<span className={styles.headerFileMenuTriggerLabel}>File</span>}
                  triggerVariant="ghost"
                  showChevron={false}
                  menuPortalToViewport
                  menuPlacement="bottom-start"
                  menuShowTrailingCheck={false}
                  minWidth="auto"
                  menuWidth={180}
                  getItemValue={(item) => item.id}
                  getItemLabel={renderHeaderMenuItemLabel}
                  getItemDisabled={(item) =>
                    (item.id === "download" && exportButtonState === "exporting") ||
                    (item.id === "delete" && deleteButtonState === "deleting")
                  }
                  onValueChange={handleHeaderMenuAction}
                  wrapperClassName={styles.headerFileMenu}
                  triggerClassName={styles.headerFileMenuTrigger}
                  menuClassName={styles.headerFileMenuSurface}
                  triggerStyle={{ minWidth: "auto", padding: "6px 8px" }}
                />
                <SaveStatusCard
                  autoSaveEnabled={saveMode === "autosave" && !hasCompletedSave && !saveMessage}
                  hasSavedDesignAccess={hasSavedDesignAccess}
                  hasUnsavedChanges={hasUnsavedChanges}
                  layout="header"
                  onDismiss={null}
                  onSignIn={openSignIn}
                  recoveredLocalChanges={recoveredLocalChanges}
                  saveMode={saveMode}
                  saveMessage={saveMessage}
                />
              </div>
            ),
            headerAutosaveTarget,
          )
        : null}
      {!setupModalOpen && showTopSaveBanner && topBannerTarget
        ? createPortal(
            <SaveStatusCard
              autoSaveEnabled={false}
              hasSavedDesignAccess={hasSavedDesignAccess}
              hasUnsavedChanges={hasUnsavedChanges}
              layout="banner"
              onDismiss={() => setSaveBannerDismissed(true)}
              onSignIn={openSignIn}
              recoveredLocalChanges={recoveredLocalChanges}
              saveMode={saveMode}
              saveMessage={saveMessage}
            />,
            topBannerTarget,
          )
        : null}
      {!setupModalOpen && headerHistoryTarget && isBottomPanelLayout
        ? createPortal(
            <div className={styles.headerHistoryControls}>
              {previewMode ? (
                <Button
                  type="button"
                  variant="secondary2"
                  size="sm"
                  className={styles.headerMobilePreviewButton}
                  onClick={exitPreviewMode}
                >
                  <ButtonIcon
                    icon="/icons/lucide/eye-off.svg"
                    className={styles.saveButtonIcon}
                  />
                  Exit preview
                </Button>
              ) : (
                <>
                  <ToolbarButton
                    type="button"
                    disabled={!canUndo}
                    aria-label="Undo"
                    title="Undo"
                    className={[styles.historyButton, styles.headerHistoryButton].join(" ")}
                    onClick={() => dispatch(createUndoCommand())}
                  >
                    <ToolbarIcon icon="/icons/lucide/undo.svg" />
                  </ToolbarButton>
                  <ToolbarButton
                    type="button"
                    disabled={!canRedo}
                    aria-label="Redo"
                    title="Redo"
                    className={[styles.historyButton, styles.headerHistoryButton].join(" ")}
                    onClick={() => dispatch(createRedoCommand())}
                  >
                    <ToolbarIcon icon="/icons/lucide/redo.svg" />
                  </ToolbarButton>
                </>
              )}
            </div>,
            headerHistoryTarget,
          )
        : null}
      {!setupModalOpen && headerOverflowTarget && isBottomPanelLayout
        ? createPortal(
            <SingleSelectDropdown
              ariaLabel="More actions"
              items={mobileHeaderMenuItems}
              value=""
              placeholder="More actions"
              triggerLabel={<span className={styles.headerOverflowDots}>⋮</span>}
              triggerVariant="ghost"
              showChevron={false}
              menuPortalToViewport
              menuPlacement="bottom-end"
              menuShowTrailingCheck={false}
              minWidth="auto"
              getItemValue={(item) => item.id}
              getItemLabel={renderHeaderMenuItemLabel}
              getItemDisabled={(item) =>
                (item.id === "download" && exportButtonState === "exporting") ||
                (item.id === "delete" && deleteButtonState === "deleting") ||
                (item.id === "preview" && previewModeDisabled)
              }
              onValueChange={handleHeaderMenuAction}
              wrapperClassName={styles.headerOverflowMenu}
              triggerClassName={styles.headerOverflowTrigger}
              menuClassName={styles.headerOverflowSurface}
              triggerStyle={{ minWidth: "32px", padding: "6px 8px" }}
            />,
            headerOverflowTarget,
          )
        : null}
      {!setupModalOpen && headerActionsTarget && !isBottomPanelLayout
        ? createPortal(
            <div className={styles.headerActionGroup}>
              {isCompactHistoryLayout ? (
                <div className={styles.headerHistoryControls}>
                  <ToolbarButton
                    type="button"
                    disabled={!canUndo}
                    aria-label="Undo"
                    title="Undo"
                    className={[styles.historyButton, styles.headerHistoryButton].join(" ")}
                    onClick={() => dispatch(createUndoCommand())}
                  >
                    <ToolbarIcon icon="/icons/lucide/undo.svg" />
                  </ToolbarButton>
                  <ToolbarButton
                    type="button"
                    disabled={!canRedo}
                    aria-label="Redo"
                    title="Redo"
                    className={[styles.historyButton, styles.headerHistoryButton].join(" ")}
                    onClick={() => dispatch(createRedoCommand())}
                  >
                    <ToolbarIcon icon="/icons/lucide/redo.svg" />
                  </ToolbarButton>
                </div>
              ) : null}
              <Button
                type="button"
                variant={previewMode ? "secondary" : "secondary2"}
                size="md"
                className={styles.headerPreviewButton}
                disabled={!previewMode && previewModeDisabled}
                onClick={previewMode ? exitPreviewMode : enterPreviewMode}
              >
                <ButtonIcon
                  icon={previewMode ? "/icons/lucide/eye-off.svg" : "/icons/lucide/eye.svg"}
                  className={styles.saveButtonIcon}
                />
                {previewMode ? "Exit preview" : "Preview"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                className={styles.headerExportButton}
                disabled={exportButtonState === "exporting"}
                onClick={() => onExportDocument(document)}
              >
                {exportButtonState === "exporting" ? (
                  <>
                    <span className={styles.saveButtonSpinner} aria-hidden="true" />
                    Exporting
                  </>
                ) : (
                  <>
                    <ButtonIcon icon="/icons/lucide/download.svg" className={styles.saveButtonIcon} />
                    Export
                  </>
                )}
              </Button>
            </div>,
            headerActionsTarget,
          )
        : null}
      {mounted && showSaveConfirmationOverlay
        ? createPortal(
            <div className={styles.editorNotificationOverlayTop}>
              <div className={styles.editorNotificationStack} 
              data-auto-dismiss="true"
              >
                <Notification
                  tone="success"
                  title="Design saved"
                  onDismiss={() => setSaveNotificationVisible(false)}
                />
              </div>
            </div>,
            window.document.body,
          )
        : null}
      {mounted && successNotification
        ? createPortal(
            <div className={styles.editorNotificationOverlayTop}>
              <div
                className={styles.editorNotificationStack}
                data-auto-dismiss="true"
              >
                <Notification
                  tone="success"
                  title={successNotification.title}
                  description={successNotification.description}
                  onDismiss={onDismissSuccessNotification}
                />
              </div>
            </div>,
            window.document.body,
          )
        : null}
      {mounted && errorNotification
        ? createPortal(
            <div className={styles.editorNotificationOverlayTop}>
              <div
                className={styles.editorNotificationStack}
                data-auto-dismiss="true"
                style={{ animationDuration: `${ERROR_NOTIFICATION_DURATION_MS}ms` }}
              >
                <Notification
                  tone="destructive"
                  title={errorNotification.title}
                  description={errorNotification.description}
                  onDismiss={onDismissErrorNotification}
                />
              </div>
            </div>,
            window.document.body,
          )
        : null}
      <Modal
        isOpen={deleteConfirmationOpen}
        title={currentStorageId ? "Delete this design?" : "Discard this design?"}
        description={
          currentStorageId
            ? "This will permanently delete the current design from your saved designs."
            : "This will discard the current design."
        }
        tone="fail"
        dismissLabel="Cancel"
        confirmLabel={
          deleteButtonState === "deleting"
            ? currentStorageId
              ? "Deleting..."
              : "Discarding..."
            : currentStorageId
              ? "Delete design"
              : "Discard design"
        }
        confirmVariant="destructive"
        onDismiss={() => {
          if (deleteButtonState === "deleting") {
            return;
          }

          setDeleteConfirmationOpen(false);
        }}
        onConfirm={() => {
          void Promise.resolve(onDeleteCurrentDesign(document))
            .finally(() => {
              setDeleteConfirmationOpen(false);
            });
        }}
        confirmDisabled={deleteButtonState === "deleting"}
        dismissDisabled={deleteButtonState === "deleting"}
      />

      <div
        className={styles.shellContent}
        data-modal-open={setupModalOpen ? "true" : "false"}
        data-mobile-selection-docked={mobileSelectionDocked ? "true" : "false"}
      >
        <EditorRail
          activeSection={activeSidebarSection}
          panelCollapsed={sidebarCollapsed}
          onSelectSection={(section) => {
            if (!sidebarCollapsed && activeSidebarSection === section) {
              dispatch(createSetSidebarCollapsedCommand(true));
              return;
            }

            dispatch(createSetActiveSidebarSectionCommand(section));
            dispatch(createSetSidebarCollapsedCommand(false));
          }}
        />

        <section className={styles.canvasColumn}>
          <div className={styles.canvasStage}>
            {canvasLoading ? (
              <div className={styles.canvasLoadingOverlay} role="status" aria-live="polite">
                <div className={styles.canvasLoadingCard}>
                  <span className={styles.canvasLoadingSpinner} aria-hidden="true" />
                  <span style={{ ...typographyStyles.p2 }}>Loading design...</span>
                </div>
              </div>
            ) : null}

            <div
              className={styles.sidePanelOverlay}
              data-collapsed={sidebarCollapsed ? "true" : "false"}
              data-mobile-canvas-focus={isBottomPanelCanvasFocusActive ? "true" : "false"}
            >
              <EditorSidebar
                activeSection={activeSidebarSection}
                autoSaveEnabled={saveMode === "autosave" && !hasCompletedSave && !saveMessage}
                activeColor={activeColor}
                activeColorId={activeColorId}
                colorsById={colorsById}
                documentTitle={title}
                hasSavedDesignAccess={hasSavedDesignAccess}
                hasUnsavedChanges={hasUnsavedChanges}
                isAutoSavePanelStatusVisible={showAutoSavePanelStatus}
                isBottomPanelCanvasFocusActive={isBottomPanelCanvasFocusActive}
                palette={palette}
                renameRequestToken={renameRequestToken}
                gridMetrics={gridMetrics}
                onScopeModeChange={handleUsedColorsScopeModeChange}
                selectionScopeActive={selectionScopeActive}
                selectionControlActive={selectionControlActive}
                selectionPromptVisible={usedColorsSelectionPromptVisible}
                showRuler={showRuler}
                savedDocuments={savedDocuments}
                savedDocumentsLoading={savedDocumentsLoading}
                selectedStorageId={selectedStorageId}
                setSelectedStorageId={setSelectedStorageId}
                onLoadSelected={() => {
                  const selectedRecord = savedDocuments.find(
                    (record) => record.storageId === selectedStorageId,
                  );
                  if (!selectedRecord) return;
                  void onLoadDocument(selectedRecord);
                }}
                onClose={() => dispatch(createSetSidebarCollapsedCommand(true))}
                onEnterBottomPanelCanvasFocus={enterBottomPanelCanvasFocus}
                onExitBottomPanelCanvasFocus={exitBottomPanelCanvasFocus}
                onSignIn={openSignIn}
                onStartOver={onStartOver}
                previewMode={previewMode}
                previewModeDisabled={previewModeDisabled}
                trace={trace}
                traceRepositionActive={traceRepositionActive}
                traceRepositionOrigin={traceRepositionOrigin}
                textPlacement={textPlacement}
                iconPlacement={iconPlacement}
                isBottomPanelLayout={isBottomPanelLayout}
                usedColors={usedColors}
                document={document}
                dispatch={dispatch}
                highlightedColorId={highlightedColorId}
                recoveredLocalChanges={recoveredLocalChanges}
                saveMessage={saveMessage}
                saveMode={saveMode}
                onHighlightColorChange={setHighlightedColorId}
                showGridlines={showGridlines}
                showSymbols={showSymbols}
                textViewportCenter={textViewportCenter}
                textViewportWidth={textViewportWidth}
                textViewportHeight={textViewportHeight}
              />
            </div>

            {previewMode || isBottomPanelCanvasFocusActive ? null : (
              <div
                ref={stageToolbarTopRef}
                className={styles.stageToolbarTop}
                style={{
                  ["--stage-toolbar-left-inset" as string]:
                    sidebarCollapsed || isBottomPanelLayout
                      ? "0px"
                      : `${EXPANDED_SIDEBAR_WIDTH}px`,
                }}
              >
                {traceRepositionActive && trace ? (
                  <TraceRepositionToolbar
                    dispatch={dispatch}
                    trace={trace}
                  />
                ) : textPlacement ? (
                  <TextPlacementToolbar
                    activeColorHex={activeColor?.hex ?? null}
                    activeColorId={activeColorId}
                    dispatch={dispatch}
                    featuredColorIds={featuredColorIds}
                    grid={document.grid}
                    gridMetrics={gridMetrics}
                    palette={palette}
                    placement={textPlacement}
                    showSymbols={showSymbols}
                    symbolAssignments={document.palette.symbolAssignments}
                  />
                ) : iconPlacement ? (
                  <IconPlacementToolbar
                    activeColorHex={activeColor?.hex ?? null}
                    activeColorId={activeColorId}
                    dispatch={dispatch}
                    featuredColorIds={featuredColorIds}
                    grid={document.grid}
                    gridMetrics={gridMetrics}
                    palette={palette}
                    placement={iconPlacement}
                    showSymbols={showSymbols}
                    symbolAssignments={document.palette.symbolAssignments}
                  />
                ) : (
                  <FloatingToolbar
                    activeColor={activeColor}
                    activeColorId={activeColorId}
                    activeTool={activeTool}
                    brushSize={brushSize}
                    canRedo={canRedo}
                    canUndo={canUndo}
                    dispatch={dispatch}
                    hasPaintedCells={hasPaintedCells}
                    featuredColorIds={featuredColorIds}
                    palette={palette}
                    selectionBounds={selectionBounds}
                    selectionCommitted={selectionCommitted}
                    selectionMode={state.session.selection.mode}
                    selectionShape={state.session.selection.shape}
                    trace={trace}
                    mirrorSessionActive={Boolean(mirrorSession)}
                    isBottomPanelLayout={isBottomPanelLayout}
                    selectionRequestKey={selectionRequestKey}
                    showSymbols={showSymbols}
                    symbolAssignments={document.palette.symbolAssignments}
                  />
                )}
              </div>
            )}

            {previewMode ? null : (
              <div className={styles.stageToolbarBottomRight}>
                <ViewportToolbar
                  dispatch={dispatch}
                  fitZoom={fitZoom}
                  onFitToGrid={fitToGrid}
                  zoomAnchor={zoomAnchor}
                  viewport={viewport}
                />
              </div>
            )}

            <div
              ref={canvasWorldRef}
              className={styles.canvasWorld}
              data-loading={canvasLoading ? "true" : "false"}
            >
              <GridWorldSurface
                activeColorId={activeColorId}
                activeTool={activeTool}
                brushSize={brushSize}
                colorsById={colorsById}
                dispatch={dispatch}
                highlightedColorId={highlightedColorId}
                onSurfaceReady={onCanvasReady}
                previewMode={previewMode}
                showGridlines={showGridlines}
                showRuler={showRuler}
                showSymbols={showSymbols}
                state={state}
                zoomAnchor={zoomAnchor}
              />
            </div>
          </div>
        </section>
      </div>

      {mounted && setupModalOpen
        ? createPortal(
            <div className={styles.modalOverlay}>
              {setupModal}
            </div>,
            window.document.body,
          )
        : null}
    </main>
  );
}

function SaveButtonLabel({
  hasSavedDesignAccess,
  state,
}: {
  hasSavedDesignAccess: boolean;
  state: SaveButtonState;
}) {
  if (state === "saving") {
    return (
      <>
        <span className={styles.saveButtonSpinner} aria-hidden="true" />
        Saving
      </>
    );
  }

  if (state === "saved") {
    return (
      <>
        <ButtonIcon icon="/icons/lucide/check.svg" className={styles.saveButtonIcon} />
        Saved
      </>
    );
  }

  return hasSavedDesignAccess ? (
    <>
      <ButtonIcon icon="/icons/lucide/save.svg" className={styles.saveButtonIcon} />
      Save
    </>
  ) : (
    <>
      <ButtonIcon icon="/icons/lucide/log-in.svg" className={styles.saveButtonIcon} />
      Sign in to save
    </>
  );
}

function getSaveStatusState(
  saveMessage: string,
  hasSavedDesignAccess: boolean,
): "ready" | "saving" | "saved" | "error" | "info" | "alert" {
  if (!hasSavedDesignAccess && !saveMessage) {
    return "info";
  }

  if (!saveMessage) {
    return "ready";
  }

  if (saveMessage.startsWith("Saving")) {
    return "saving";
  }

  if (
    saveMessage.startsWith(SAVE_SUCCESS_PREFIX) ||
    saveMessage.startsWith(AUTOSAVE_SUCCESS_PREFIX)
  ) {
    return "saved";
  }

  if (saveMessage.startsWith("Couldn't")) {
    return "error";
  }

  if (saveMessage.startsWith("Sync conflict")) {
    return "alert";
  }

  if (saveMessage.startsWith("Local recovery")) {
    return "info";
  }

  return "info";
}

function duplicateDesignToNewTab(document: EditorDocumentState): void {
  if (typeof window === "undefined") {
    return;
  }

  const duplicateToken =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const localProjectId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? `local_${crypto.randomUUID()}`
      : `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const normalizedTitle = document.project.title.trim() || "Untitled Design";
  const duplicateDocument: EditorDocumentState = {
    ...document,
    project: {
      ...document.project,
      id: localProjectId,
      title: `${normalizedTitle} (Copy)`,
      createdAt: null,
      updatedAt: null,
    },
    grid: {
      ...document.grid,
      cells: [...document.grid.cells],
    },
    palette: {
      ...document.palette,
      colorsById: { ...document.palette.colorsById },
      customPalettesById: { ...document.palette.customPalettesById },
      extractedPaletteIds: [...document.palette.extractedPaletteIds],
      symbolAssignments: { ...document.palette.symbolAssignments },
    },
    trace: document.trace ? { ...document.trace } : null,
    text: {
      ...document.text,
      entities: document.text.entities.map((entity) => ({ ...entity })),
    },
    metadata: {
      ...document.metadata,
      persistedVersionId: null,
    },
  };

  window.localStorage.setItem(
    `${DUPLICATE_STORAGE_PREFIX}${duplicateToken}`,
    JSON.stringify(duplicateDocument),
  );

  const duplicateUrl = new URL("/editor-v2", window.location.origin);
  duplicateUrl.searchParams.set(DUPLICATE_QUERY_PARAM, duplicateToken);
  window.open(duplicateUrl.toString(), "_blank", "noopener,noreferrer");
}
