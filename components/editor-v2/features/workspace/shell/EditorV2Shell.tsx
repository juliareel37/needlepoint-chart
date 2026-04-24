"use client";

import { useClerk } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { typographyStyles } from "@/app/design-system/typography";
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
  ExportButtonState,
  EditorV2ErrorNotification,
  EditorV2SuccessNotification,
  SaveButtonState,
} from "../../../app/EditorV2Workspace";
import {
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
import { ButtonIcon, Notification } from "@/components/design-system";
import { TextPlacementToolbar } from "./TextPlacementToolbar";
import { IconPlacementToolbar } from "./IconPlacementToolbar";
import { TraceRepositionToolbar } from "./TraceRepositionToolbar";
import { GridWorldSurface } from "../stage/GridWorldSurface";
import { ViewportToolbar } from "./ViewportToolbar";
import styles from "./EditorV2Shell.module.css";

const EXPANDED_SIDEBAR_WIDTH = 320;
const DEFAULT_CELL_SIZE = 28;
const FIT_ZOOM_PADDING_FACTOR = 0.92;
const SAVE_SUCCESS_PREFIX = "Saved at ";
const ERROR_NOTIFICATION_DURATION_MS = 8000;

interface PreviewSessionSnapshot {
  sidebarCollapsed: boolean;
  viewport: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
}

export function EditorV2Shell({
  canvasLoading,
  errorNotification,
  exportButtonState,
  hasSavedDesignAccess,
  onCanvasReady,
  onDismissErrorNotification,
  onDismissSuccessNotification,
  onExportDocument,
  onSaveDocument,
  onLoadDocument,
  onStartOver,
  saveButtonState,
  saveMessage,
  savedDocuments,
  savedDocumentsLoading,
  selectedStorageId,
  setSelectedStorageId,
  setupModal,
  setupModalOpen,
  successNotification,
}: {
  canvasLoading: boolean;
  errorNotification: EditorV2ErrorNotification | null;
  exportButtonState: ExportButtonState;
  hasSavedDesignAccess: boolean;
  onCanvasReady: () => void;
  onDismissErrorNotification: () => void;
  onDismissSuccessNotification: () => void;
  onExportDocument: (document: EditorDocumentState) => Promise<void> | void;
  onSaveDocument: (document: EditorDocumentState) => Promise<void> | void;
  onLoadDocument: (record: SavedEditorV2DocumentRecord) => Promise<void> | void;
  onStartOver: () => void;
  saveButtonState: SaveButtonState;
  saveMessage: string;
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  setupModal: ReactNode;
  setupModalOpen: boolean;
  successNotification: EditorV2SuccessNotification | null;
}) {
  const clerk = useClerk();
  const dispatch = useEditorStoreDispatch();
  const state = useEditorStoreSelector((currentState) => currentState);

  const document = state.document;
  const title = state.document.project.title;
  const activeTool = state.session.activeTool.tool;
  const brushSize = state.session.activeTool.brushSize;
  const colorsById = state.document.palette.colorsById;
  const usedColors = getUsedColors(state);
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
  const traceRepositionActive = Boolean(state.session.traceInteraction.repositionSnapshot);
  const traceRepositionOrigin = state.session.traceInteraction.repositionOrigin;
  const mirrorSession = state.session.mirrorInteraction.session;
  const textPlacement = state.session.textInteraction.placement;
  const iconPlacement = state.session.iconInteraction.placement;
  const selectionCommitted = Boolean(selectionBounds && !state.session.selection.preview);
  const canvasWorldRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedInitialFitRef = useRef(false);
  const hasAppliedMobileLayoutRef = useRef(false);
  const mobileTraceRepositionWasActiveRef = useRef(false);
  const mobileTextPlacementWasActiveRef = useRef(false);
  const previewSessionSnapshotRef = useRef<PreviewSessionSnapshot | null>(null);
  const previewFitPendingRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [isBottomPanelLayout, setIsBottomPanelLayout] = useState(false);
  const [isCompactHistoryLayout, setIsCompactHistoryLayout] = useState(false);
  const [layoutModeResolved, setLayoutModeResolved] = useState(false);
  const [canvasWorldSize, setCanvasWorldSize] = useState({ width: 0, height: 0 });
  const [saveNotificationVisible, setSaveNotificationVisible] = useState(false);
  const [saveBannerDismissed, setSaveBannerDismissed] = useState(false);
  const [highlightedColorId, setHighlightedColorId] = useState<string | null>(null);
  const [headerActionsTarget, setHeaderActionsTarget] = useState<HTMLElement | null>(null);
  const [headerAutosaveTarget, setHeaderAutosaveTarget] = useState<HTMLElement | null>(null);
  const [headerHistoryTarget, setHeaderHistoryTarget] = useState<HTMLElement | null>(null);
  const [headerOverflowTarget, setHeaderOverflowTarget] = useState<HTMLElement | null>(null);
  const [topBannerTarget, setTopBannerTarget] = useState<HTMLElement | null>(null);
  const mobileSelectionDocked =
    isBottomPanelLayout &&
    (Boolean(selectionBounds) || activeTool === "lasso");
  const mobileHeaderMenuItems = useMemo(
    () =>
      hasSavedDesignAccess
        ? [
            { id: "export", label: "Export design" },
          ]
        : [
            { id: "export", label: "Export design" },
            { id: "sign-in", label: "Sign in" },
          ],
    [hasSavedDesignAccess],
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
    const availableHeight = Math.max(canvasWorldSize.height, 1);

    return Math.min(
      availableWidth / Math.max(gridMetrics.surfaceWidth, 1),
      availableHeight / Math.max(gridMetrics.surfaceHeight, 1),
    ) * FIT_ZOOM_PADDING_FACTOR;
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    gridMetrics.surfaceHeight,
    gridMetrics.surfaceWidth,
  ]);
  const zoomAnchor = useMemo(() => {
    if (canvasWorldSize.width <= 0 || canvasWorldSize.height <= 0) {
      return null;
    }

    const visibleLeftInset =
      sidebarCollapsed || isBottomPanelLayout ? 0 : EXPANDED_SIDEBAR_WIDTH;
    const visibleCenterX =
      visibleLeftInset + (canvasWorldSize.width - visibleLeftInset) / 2;
    const visibleCenterY = canvasWorldSize.height / 2;
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
    sidebarCollapsed,
  ]);
  const textViewportCenter = useMemo(() => {
    if (!zoomAnchor || viewport.zoom <= 0) {
      return null;
    }

    return {
      x: (zoomAnchor.x - viewport.offsetX) / viewport.zoom,
      y: (zoomAnchor.y - viewport.offsetY) / viewport.zoom,
    };
  }, [viewport.offsetX, viewport.offsetY, viewport.zoom, zoomAnchor]);
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
    const renderedWidth = gridMetrics.surfaceWidth * fitZoom;
    const renderedHeight = gridMetrics.surfaceHeight * fitZoom;
    const targetOffsetX =
      visibleLeftInset / 2 + (gridMetrics.surfaceWidth - renderedWidth) / 2;
    const targetOffsetY = (gridMetrics.surfaceHeight - renderedHeight) / 2;

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
    sidebarCollapsed,
    viewport.offsetX,
    viewport.offsetY,
  ]);

  const enterPreviewMode = useCallback(() => {
    if (previewMode) {
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
    layoutModeResolved,
    sidebarCollapsed,
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
    setHeaderActionsTarget(window.document.getElementById("app-header-actions"));
    setHeaderAutosaveTarget(window.document.getElementById("app-header-autosave"));
    setHeaderHistoryTarget(window.document.getElementById("app-header-history-right"));
    setHeaderOverflowTarget(window.document.getElementById("app-header-overflow-right"));
    setTopBannerTarget(window.document.getElementById("app-top-banner"));
  }, []);

  const showSaveStatus = Boolean(saveMessage || hasUnsavedChanges);
  const useTopSaveBanner = isBottomPanelLayout && showSaveStatus;
  const showTopSaveBanner = useTopSaveBanner && !saveBannerDismissed;

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

  return (
    <main className={styles.shell}>
      {!setupModalOpen && !useTopSaveBanner && headerAutosaveTarget
        ? createPortal(
            <HeaderSaveStatus
              hasSavedDesignAccess={hasSavedDesignAccess}
              hasUnsavedChanges={hasUnsavedChanges}
              layout="header"
              onDismiss={null}
              saveMessage={saveMessage}
            />,
            headerAutosaveTarget,
          )
        : null}
      {!setupModalOpen && showTopSaveBanner && topBannerTarget
        ? createPortal(
            <HeaderSaveStatus
              hasSavedDesignAccess={hasSavedDesignAccess}
              hasUnsavedChanges={hasUnsavedChanges}
              layout="banner"
              onDismiss={() => setSaveBannerDismissed(true)}
              saveMessage={saveMessage}
            />,
            topBannerTarget,
          )
        : null}
      {!setupModalOpen && headerHistoryTarget && isBottomPanelLayout
        ? createPortal(
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
              minWidth="auto"
              menuWidth={176}
              getItemValue={(item) => item.id}
              getItemLabel={(item) => {
                if (item.id === "export") {
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

                return item.label;
              }}
              getItemDisabled={(item) =>
                item.id === "export" && exportButtonState === "exporting"
              }
              onValueChange={(value) => {
                if (value === "export") {
                  void onExportDocument(document);
                  return;
                }

                if (value === "sign-in") {
                  void clerk.openSignIn();
                }
              }}
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
      {mounted && saveNotificationVisible
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
            >
              <EditorSidebar
                activeSection={activeSidebarSection}
                activeColor={activeColor}
                activeColorId={activeColorId}
                colorsById={colorsById}
                documentTitle={title}
                hasSavedDesignAccess={hasSavedDesignAccess}
                palette={palette}
                gridMetrics={gridMetrics}
                showRuler={showRuler}
                saveButtonState={saveButtonState}
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
                onSaveDocument={onSaveDocument}
                onStartOver={onStartOver}
                previewMode={previewMode}
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
                onHighlightColorChange={setHighlightedColorId}
                showGridlines={showGridlines}
                showSymbols={showSymbols}
                textViewportCenter={textViewportCenter}
                textViewportWidth={textViewportWidth}
              />
            </div>

            {previewMode ? null : (
              <div
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
              {previewMode ? (
                <div className={styles.previewDoneButtonWrap}>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className={styles.previewDoneButton}
                    onClick={exitPreviewMode}
                  >
                    Done
                  </Button>
                </div>
              ) : null}
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

function HeaderSaveStatus({
  hasSavedDesignAccess,
  hasUnsavedChanges,
  layout,
  onDismiss,
  saveMessage,
}: {
  hasSavedDesignAccess: boolean;
  hasUnsavedChanges: boolean;
  layout: "header" | "banner";
  onDismiss: (() => void) | null;
  saveMessage: string;
}) {
  const clerk = useClerk();

  if (!saveMessage && !hasUnsavedChanges) {
    return null;
  }

  const state = getSaveStatusState(saveMessage, hasSavedDesignAccess);
  const message =
    !hasSavedDesignAccess && !saveMessage
      ? "Sign in to save changes"
      : saveMessage || "Changes not saved";
  const icon =
    state === "info"
      ? "/icons/lucide/info.svg"
      : state === "alert"
        ? "/icons/lucide/alert.svg"
        : state === "ready"
          ? "/icons/lucide/alert.svg"
        : state === "error"
          ? "/icons/lucide/alert.svg"
          : "/icons/lucide/save.svg";

  return (
    <div
      className={styles.headerSaveStatus}
      data-layout={layout}
      data-state={state}
      role="status"
      aria-live="polite"
      title={message}
    >
      <span className={styles.headerSaveStatusIconWrap} aria-hidden="true">
        <ButtonIcon icon={icon} className={styles.headerSaveStatusIcon} />
      </span>
      <p className={styles.headerSaveStatusMessage} style={typographyStyles.p2}>
        {message}
      </p>
      {layout === "banner" && !hasSavedDesignAccess ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void clerk.openSignIn()}
        >
          Sign in
        </Button>
      ) : null}
      {layout === "banner" && onDismiss ? (
        <button
          type="button"
          className={styles.headerSaveStatusDismiss}
          aria-label="Dismiss save status"
          onClick={onDismiss}
        >
          <ButtonIcon icon="/icons/lucide/x.svg" className={styles.headerSaveStatusDismissIcon} />
        </button>
      ) : null}
    </div>
  );
}

function getSaveStatusState(
  saveMessage: string,
  hasSavedDesignAccess: boolean,
): "ready" | "saved" | "error" | "info" | "alert" {
  if (!hasSavedDesignAccess && !saveMessage) {
    return "info";
  }

  if (!saveMessage) {
    return "ready";
  }

  if (saveMessage.startsWith(SAVE_SUCCESS_PREFIX)) {
    return "saved";
  }

  if (saveMessage.startsWith("Couldn't")) {
    return "error";
  }

  return "info";
}
