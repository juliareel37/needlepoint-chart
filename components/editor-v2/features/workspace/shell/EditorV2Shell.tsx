"use client";

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
import { useEditorStoreDispatch, useEditorStoreSelector } from "../../../app/editorStoreContext";
import type {
  EditorDocumentState,
} from "@/lib/editor-v2/editor/store";
import type { SavedEditorV2DocumentRecord } from "../../../app/editorV2ServerPersistence";
import type { SaveButtonState } from "../../../app/EditorV2Workspace";
import {
  createSetActiveSidebarSectionCommand,
  createPanViewportCommand,
  createSetSidebarCollapsedCommand,
  createSetViewportZoomCommand,
} from "../workspaceCommands";
import { EditorRail } from "./EditorRail";
import { EditorSidebar } from "./EditorSidebar";
import { FloatingToolbar } from "./FloatingToolbar";
import { ButtonIcon, Notification } from "@/components/design-system";
import { MirrorSessionToolbar } from "./MirrorSessionToolbar";
import { SelectionSessionToolbar } from "./SelectionSessionToolbar";
import { TextPlacementToolbar } from "./TextPlacementToolbar";
import { TraceRepositionToolbar } from "./TraceRepositionToolbar";
import { GridWorldSurface } from "../stage/GridWorldSurface";
import { ViewportToolbar } from "./ViewportToolbar";
import styles from "./EditorV2Shell.module.css";

const EXPANDED_SIDEBAR_WIDTH = 320;
const DEFAULT_CELL_SIZE = 28;
const FIT_ZOOM_PADDING_FACTOR = 0.92;
const SAVE_SUCCESS_PREFIX = "Saved at ";

export function EditorV2Shell({
  canvasLoading,
  hasSavedDesignAccess,
  onCanvasReady,
  onSaveDocument,
  onLoadDocument,
  onStartOver,
  saveButtonState,
  saveMessage,
  savedDocuments,
  selectedStorageId,
  setSelectedStorageId,
  setupModal,
  setupModalOpen,
}: {
  canvasLoading: boolean;
  hasSavedDesignAccess: boolean;
  onCanvasReady: () => void;
  onSaveDocument: (document: EditorDocumentState) => Promise<void> | void;
  onLoadDocument: (record: SavedEditorV2DocumentRecord) => Promise<void> | void;
  onStartOver: () => void;
  saveButtonState: SaveButtonState;
  saveMessage: string;
  savedDocuments: SavedEditorV2DocumentRecord[];
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  setupModal: ReactNode;
  setupModalOpen: boolean;
}) {
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
  const traceRepositionActive = Boolean(state.session.traceInteraction.repositionSnapshot);
  const traceRepositionOrigin = state.session.traceInteraction.repositionOrigin;
  const mirrorSession = state.session.mirrorInteraction.session;
  const mirrorActive = activeTool === "mirror" || Boolean(mirrorSession);
  const selectionActive = activeTool === "lasso";
  const textPlacement = state.session.textInteraction.placement;
  const selectionCommitted = Boolean(selectionBounds && !state.session.selection.preview);
  const canvasWorldRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedInitialFitRef = useRef(false);
  const [canvasWorldSize, setCanvasWorldSize] = useState({ width: 0, height: 0 });
  const [saveNotificationVisible, setSaveNotificationVisible] = useState(false);
  const [headerAutosaveTarget, setHeaderAutosaveTarget] = useState<HTMLElement | null>(null);
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
      canvasWorldSize.width - EXPANDED_SIDEBAR_WIDTH,
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

    const visibleLeftInset = sidebarCollapsed ? 0 : EXPANDED_SIDEBAR_WIDTH;
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
  const fitToGrid = useCallback(() => {
    if (
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    const visibleLeftInset = sidebarCollapsed ? 0 : EXPANDED_SIDEBAR_WIDTH;
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
    sidebarCollapsed,
    viewport.offsetX,
    viewport.offsetY,
  ]);

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
  ]);

  useEffect(() => {
    if (!traceRepositionActive) {
      return;
    }

    if (activeSidebarSection !== "trace") {
      dispatch(createSetActiveSidebarSectionCommand("trace"));
    }

    if (sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(false));
    }
  }, [activeSidebarSection, dispatch, sidebarCollapsed, traceRepositionActive]);

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
    setHeaderAutosaveTarget(window.document.getElementById("app-header-autosave"));
  }, []);

  return (
    <main className={styles.shell}>
      {headerAutosaveTarget
        ? createPortal(
            <HeaderSaveStatus
              hasSavedDesignAccess={hasSavedDesignAccess}
              saveMessage={saveMessage}
            />,
            headerAutosaveTarget,
          )
        : null}
      {saveNotificationVisible
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

      <div
        className={styles.shellContent}
        data-modal-open={setupModalOpen ? "true" : "false"}
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
                usedColors={usedColors}
                document={document}
                dispatch={dispatch}
                showGridlines={showGridlines}
                showSymbols={showSymbols}
                textViewportCenter={textViewportCenter}
              />
            </div>

            {previewMode ? null : (
              <div
                className={styles.stageToolbarTop}
                style={{
                  left: sidebarCollapsed
                    ? "50%"
                    : `calc(50% + ${EXPANDED_SIDEBAR_WIDTH / 2}px)`,
                }}
              >
                {traceRepositionActive && trace ? (
                  <TraceRepositionToolbar
                    dispatch={dispatch}
                    trace={trace}
                  />
                ) : mirrorActive ? (
                  <MirrorSessionToolbar
                    dispatch={dispatch}
                    session={mirrorSession}
                  />
                ) : selectionActive ? (
                  <SelectionSessionToolbar
                    activeColor={activeColor}
                    dispatch={dispatch}
                    selectionBounds={selectionBounds}
                    selectionCommitted={selectionCommitted}
                    selectionShape={state.session.selection.shape}
                  />
                ) : textPlacement ? (
                  <TextPlacementToolbar
                    activeColorHex={activeColor?.hex ?? null}
                    activeColorId={activeColorId}
                    dispatch={dispatch}
                    gridMetrics={gridMetrics}
                    palette={palette}
                    placement={textPlacement}
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
                    palette={palette}
                    trace={trace}
                  />
                )}
              </div>
            )}

            <div className={styles.stageToolbarBottomRight}>
              <ViewportToolbar
                dispatch={dispatch}
                fitZoom={fitZoom}
                onFitToGrid={fitToGrid}
                zoomAnchor={zoomAnchor}
                viewport={viewport}
              />
            </div>

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

      {setupModalOpen ? (
        <div className={styles.modalOverlay}>
          {setupModal}
        </div>
      ) : null}
    </main>
  );
}

function HeaderSaveStatus({
  hasSavedDesignAccess,
  saveMessage,
}: {
  hasSavedDesignAccess: boolean;
  saveMessage: string;
}) {
  const state = getSaveStatusState(saveMessage, hasSavedDesignAccess);
  const message =
    !hasSavedDesignAccess && !saveMessage
      ? "Sign in to save changes"
      : saveMessage || "Not saved yet";
  const icon =
    state === "alert"
      ? "/icons/lucide/alert.svg"
      : state === "error"
        ? "/icons/lucide/alert.svg"
        : "/icons/lucide/save.svg";

  return (
    <div
      className={styles.headerSaveStatus}
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
    </div>
  );
}

function getSaveStatusState(
  saveMessage: string,
  hasSavedDesignAccess: boolean,
): "ready" | "saved" | "error" | "info" | "alert" {
  if (!hasSavedDesignAccess && !saveMessage) {
    return "alert";
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
