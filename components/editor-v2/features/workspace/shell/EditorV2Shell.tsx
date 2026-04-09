"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  EditorSidebarSection,
} from "@/lib/editor-v2/editor/store";
import type { SavedEditorV2DocumentRecord } from "../../../app/editorV2LocalPersistence";
import {
  createSetActiveSidebarSectionCommand,
  createPanViewportCommand,
  createSetSidebarCollapsedCommand,
  createSetViewportZoomCommand,
} from "../workspaceCommands";
import { EditorRail } from "./EditorRail";
import { EditorSidebar } from "./EditorSidebar";
import { FloatingToolbar } from "./FloatingToolbar";
import { GridWorldSurface } from "../stage/GridWorldSurface";
import { ViewportToolbar } from "./ViewportToolbar";
import styles from "./EditorV2Shell.module.css";

const EXPANDED_SIDEBAR_WIDTH = 320;
const DEFAULT_CELL_SIZE = 28;

export function EditorV2Shell({
  onSaveDocument,
  onLoadDocument,
  onStartOver,
  saveMessage,
  savedDocuments,
  selectedStorageId,
  setSelectedStorageId,
}: {
  onSaveDocument: (document: EditorDocumentState) => void;
  onLoadDocument: (record: SavedEditorV2DocumentRecord) => void;
  onStartOver: () => void;
  saveMessage: string;
  savedDocuments: SavedEditorV2DocumentRecord[];
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
}) {
  const dispatch = useEditorStoreDispatch();
  const state = useEditorStoreSelector((currentState) => currentState);

  const document = state.document;
  const title = state.document.project.title;
  const activeTool = state.session.activeTool.tool;
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
  const activeSidebarSection = state.ui.shell.activeSidebarSection;
  const sidebarCollapsed = state.ui.shell.sidebarCollapsed;
  const selectionCommitted = Boolean(selectionBounds && !state.session.selection.preview);
  const canvasWorldRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedInitialFitRef = useRef(false);
  const [canvasWorldSize, setCanvasWorldSize] = useState({ width: 0, height: 0 });
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
    );
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

  return (
    <main className={styles.shell}>
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
              palette={palette}
              showRuler={showRuler}
              saveMessage={saveMessage}
              savedDocuments={savedDocuments}
              selectedStorageId={selectedStorageId}
              setSelectedStorageId={setSelectedStorageId}
              onLoadSelected={() => {
                const selectedRecord = savedDocuments.find(
                  (record) => record.storageId === selectedStorageId,
                );
                if (!selectedRecord) return;
                onLoadDocument(selectedRecord);
              }}
              onClose={() => dispatch(createSetSidebarCollapsedCommand(true))}
              onSaveDocument={onSaveDocument}
              onStartOver={onStartOver}
              trace={trace}
              usedColors={usedColors}
              document={document}
              dispatch={dispatch}
              showGridlines={showGridlines}
            />
          </div>

          <div
            className={styles.stageToolbarTop}
            style={{
              left: sidebarCollapsed
                ? "50%"
                : `calc(50% + ${EXPANDED_SIDEBAR_WIDTH / 2}px)`,
            }}
          >
            <FloatingToolbar
              activeColor={activeColor}
              activeTool={activeTool}
              canRedo={canRedo}
              canUndo={canUndo}
              dispatch={dispatch}
              hasPaintedCells={hasPaintedCells}
              selectionBounds={selectionBounds}
              selectionCommitted={selectionCommitted}
              trace={trace}
            />
          </div>

          <div className={styles.stageToolbarBottomRight}>
            <ViewportToolbar
              dispatch={dispatch}
              fitZoom={fitZoom}
              onFitToGrid={fitToGrid}
              zoomAnchor={zoomAnchor}
              viewport={viewport}
            />
          </div>

          <div ref={canvasWorldRef} className={styles.canvasWorld}>
            <GridWorldSurface
              activeColorId={activeColorId}
              activeTool={activeTool}
              colorsById={colorsById}
              dispatch={dispatch}
              showGridlines={showGridlines}
              showRuler={showRuler}
              state={state}
              zoomAnchor={zoomAnchor}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
