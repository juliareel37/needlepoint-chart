"use client";

import { useEffect, useState } from "react";
import { Button, ButtonIcon } from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import type {
  EditorSidebarSection,
  EditorDocumentState,
  EditorStore,
  IconPlacementSession,
  PaletteColor,
  TextPlacementSession,
  TraceDocument,
  TraceRepositionOrigin,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import type { SavedEditorV2DocumentRecord } from "../../../app/editorV2ServerPersistence";
import { ColorPanelPage, type ColorPanelView } from "./panel-pages/ColorPanelPage";
import { DocumentPanelPage } from "./panel-pages/DocumentPanelPage";
import { IconsPanelPage, type IconsPanelView } from "./panel-pages/IconsPanelPage";
import { TextPanelPage } from "./panel-pages/TextPanelPage";
import { TracePanelPage } from "./panel-pages/TracePanelPage";
import { SettingsPanelPage } from "./panel-pages/SettingsPanelPage";
import styles from "./EditorV2Shell.module.css";

interface EditorSidebarProps {
  activeSection: EditorSidebarSection;
  activeColor: PaletteColor | null;
  activeColorId: string | null;
  colorsById: Record<string, PaletteColor>;
  documentTitle: string;
  hasSavedDesignAccess: boolean;
  isBottomPanelCanvasFocusActive: boolean;
  palette: PaletteColor[];
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  selectionScopeActive: boolean;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  onLoadSelected: () => void;
  onClose: () => void;
  onEnterBottomPanelCanvasFocus: () => void;
  onExitBottomPanelCanvasFocus: () => void;
  onScopeModeChange: (mode: "full-canvas" | "selection") => void;
  onStartOver: () => void;
  previewMode: boolean;
  previewModeDisabled?: boolean;
  selectionControlActive: boolean;
  selectionPromptVisible: boolean;
  showGridlines: boolean;
  showRuler: boolean;
  showSymbols: boolean;
  trace: TraceDocument | null;
  traceRepositionActive: boolean;
  traceRepositionOrigin: TraceRepositionOrigin | null;
  usedColors: Array<{ colorId: string; count: number }>;
  document: EditorDocumentState;
  gridMetrics: GridWorldMetrics;
  highlightedColorId: string | null;
  dispatch: EditorStore["dispatch"];
  textPlacement: TextPlacementSession | null;
  iconPlacement: IconPlacementSession | null;
  isBottomPanelLayout: boolean;
  onHighlightColorChange: (colorId: string | null) => void;
  textViewportCenter: WorldPoint | null;
  textViewportWidth: number | null;
  textViewportHeight: number | null;
}

export function EditorSidebar({
  activeSection,
  activeColor,
  activeColorId,
  colorsById,
  documentTitle,
  hasSavedDesignAccess,
  isBottomPanelCanvasFocusActive,
  palette,
  savedDocuments,
  savedDocumentsLoading,
  selectionScopeActive,
  selectedStorageId,
  setSelectedStorageId,
  onLoadSelected,
  onClose,
  onEnterBottomPanelCanvasFocus,
  onExitBottomPanelCanvasFocus,
  onScopeModeChange,
  onStartOver,
  previewMode,
  previewModeDisabled = false,
  selectionControlActive,
  selectionPromptVisible,
  showGridlines,
  showRuler,
  showSymbols,
  trace,
  traceRepositionActive,
  traceRepositionOrigin,
  usedColors,
  document,
  gridMetrics,
  highlightedColorId,
  dispatch,
  textPlacement,
  iconPlacement,
  isBottomPanelLayout,
  onHighlightColorChange,
  textViewportCenter,
  textViewportWidth,
  textViewportHeight,
}: EditorSidebarProps) {
  const [colorPanelView, setColorPanelView] = useState<ColorPanelView>("overview");
  const [iconsPanelView, setIconsPanelView] = useState<IconsPanelView>({ type: "overview" });

  useEffect(() => {
    if (activeSection !== "color") {
      setColorPanelView("overview");
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "icons") {
      setIconsPanelView({ type: "overview" });
    }
  }, [activeSection]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarSurface}>
        <div className={styles.sidebarPanelHeader}>
          {activeSection === "color" && colorPanelView === "design-colors" ? (
            <div className={styles.sidebarPanelBackRow}>
              <Button
                type="button"
                variant="ghostV2"
                size="sm"
                className={styles.sidebarPanelBackButton}
                aria-label="Back to color overview"
                title="Back to color overview"
                onClick={() => setColorPanelView("overview")}
              >
                <ButtonIcon icon="/icons/lucide/arrow-left.svg" />
              </Button>
              <span className={styles.sidebarPanelBackTitle} style={typographyStyles.h4}>
                Design colors
              </span>
            </div>
          ) : activeSection === "icons" && iconsPanelView.type === "category" ? (
            <div className={styles.sidebarPanelBackRow}>
              <Button
                type="button"
                variant="ghostV2"
                size="sm"
                className={styles.sidebarPanelBackButton}
                aria-label="Back to icon categories"
                title="Back to icon categories"
                onClick={() => setIconsPanelView({ type: "overview" })}
              >
                <ButtonIcon icon="/icons/lucide/arrow-left.svg" />
              </Button>
              <span className={styles.sidebarPanelBackTitle} style={typographyStyles.h4}>
                {iconsPanelView.category}
              </span>
            </div>
          ) : (
            <h2 className={styles.sidebarPanelTitle} style={typographyStyles.h4}>
              {activeSection === "document"
                ? "Document"
                : activeSection === "color"
                  ? "Color"
                  : activeSection === "trace"
                    ? "Image Reference"
                    : activeSection === "text"
                      ? "Text"
                      : activeSection === "icons"
                        ? "Icons"
                        : "Settings"}
            </h2>
          )}
          <div className={styles.sidebarHeaderActions}>
            <Button
              type="button"
              variant="ghostV2"
              size="sm"
              className={styles.sidebarCloseButton}
              aria-label="Hide panel"
              title="Hide panel"
              onClick={onClose}
            >
              <ButtonIcon
                icon="/icons/lucide/x.svg"
                className={styles.sidebarCloseIcon}
              />
            </Button>
          </div>
        </div>

        <div className={styles.sidebarPanelBody}>
          {activeSection === "document" ? (
            <DocumentPanelPage
              dispatch={dispatch}
              documentTitle={documentTitle}
              hasSavedDesignAccess={hasSavedDesignAccess}
              onLoadSelected={onLoadSelected}
              onStartOver={onStartOver}
              savedDocuments={savedDocuments}
              savedDocumentsLoading={savedDocumentsLoading}
              selectedStorageId={selectedStorageId}
              setSelectedStorageId={setSelectedStorageId}
            />
          ) : null}

          {activeSection === "color" ? (
            <ColorPanelPage
              activeColor={activeColor}
              activeColorId={activeColorId}
              colorsById={colorsById}
              dispatch={dispatch}
              highlightedColorId={highlightedColorId}
              isBottomPanelCanvasFocusActive={isBottomPanelCanvasFocusActive}
              isBottomPanelLayout={isBottomPanelLayout}
              onEnterBottomPanelCanvasFocus={onEnterBottomPanelCanvasFocus}
              onExitBottomPanelCanvasFocus={onExitBottomPanelCanvasFocus}
              onViewChange={setColorPanelView}
              onHighlightColorChange={onHighlightColorChange}
              onScopeModeChange={onScopeModeChange}
              palette={palette}
              selectionControlActive={selectionControlActive}
              selectionPromptVisible={selectionPromptVisible}
              selectionScopeActive={selectionScopeActive}
              showSymbols={showSymbols}
              symbolAssignments={document.palette.symbolAssignments}
              usedColors={usedColors}
              view={colorPanelView}
            />
          ) : null}

          {activeSection === "trace" ? (
            <TracePanelPage
              dispatch={dispatch}
              grid={document.grid}
              gridMetrics={gridMetrics}
              palette={palette}
              repositionActive={traceRepositionActive}
              repositionOrigin={traceRepositionOrigin}
              trace={trace}
            />
          ) : null}

          {activeSection === "text" ? (
            <TextPanelPage
              activeColorId={activeColorId}
              dispatch={dispatch}
              gridMetrics={gridMetrics}
              palette={palette}
              placement={textPlacement}
              viewportCenter={textViewportCenter}
              viewportWidth={textViewportWidth}
            />
          ) : null}

          {activeSection === "icons" ? (
            <IconsPanelPage
              dispatch={dispatch}
              gridMetrics={gridMetrics}
              onViewChange={setIconsPanelView}
              placement={iconPlacement}
              view={iconsPanelView}
              viewportCenter={textViewportCenter}
              viewportWidth={textViewportWidth}
              viewportHeight={textViewportHeight}
            />
          ) : null}

          {activeSection === "settings" ? (
            <SettingsPanelPage
              dispatch={dispatch}
              previewMode={previewMode}
              previewModeDisabled={previewModeDisabled}
              showGridlines={showGridlines}
              showRuler={showRuler}
              showSymbols={showSymbols}
            />
          ) : null}
        </div>
      </div>
    </aside>
  );
}
