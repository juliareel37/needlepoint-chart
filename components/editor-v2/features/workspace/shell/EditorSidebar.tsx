"use client";

import { useEffect, useState } from "react";
import { Button, ButtonIcon } from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import type {
  EditorSidebarSection,
  EditorStore,
  EditorDocumentState,
  IconPlacementSession,
  PaletteColor,
  TextPlacementSession,
  TraceDocument,
  TraceRepositionOrigin,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import type { SavedEditorV2DocumentRecord } from "../../../app/editorV2ServerPersistence";
import type { SaveButtonState } from "../../../app/EditorV2Workspace";
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
  palette: PaletteColor[];
  saveButtonState: SaveButtonState;
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  onLoadSelected: () => void;
  onClose: () => void;
  onSaveDocument: (document: EditorDocumentState) => Promise<void> | void;
  onStartOver: () => void;
  previewMode: boolean;
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
  onHighlightColorChange: (colorId: string | null) => void;
  textViewportCenter: WorldPoint | null;
}

export function EditorSidebar({
  activeSection,
  activeColor,
  activeColorId,
  colorsById,
  documentTitle,
  hasSavedDesignAccess,
  palette,
  saveButtonState,
  savedDocuments,
  savedDocumentsLoading,
  selectedStorageId,
  setSelectedStorageId,
  onLoadSelected,
  onClose,
  onSaveDocument,
  onStartOver,
  previewMode,
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
  onHighlightColorChange,
  textViewportCenter,
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
              <button
                type="button"
                className={styles.sidebarPanelBackButton}
                aria-label="Back to color overview"
                title="Back to color overview"
                onClick={() => setColorPanelView("overview")}
              >
                <ButtonIcon icon="/icons/lucide/arrow-left.svg" />
              </button>
              <span className={styles.sidebarPanelBackTitle} style={typographyStyles.h4}>
                Design Colors
              </span>
            </div>
          ) : activeSection === "icons" && iconsPanelView.type === "category" ? (
            <div className={styles.sidebarPanelBackRow}>
              <button
                type="button"
                className={styles.sidebarPanelBackButton}
                aria-label="Back to icon categories"
                title="Back to icon categories"
                onClick={() => setIconsPanelView({ type: "overview" })}
              >
                <ButtonIcon icon="/icons/lucide/arrow-left.svg" />
              </button>
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

        {activeSection === "document" ? (
          <DocumentPanelPage
            dispatch={dispatch}
            document={document}
            documentTitle={documentTitle}
            hasSavedDesignAccess={hasSavedDesignAccess}
            onLoadSelected={onLoadSelected}
            onSaveDocument={onSaveDocument}
            onStartOver={onStartOver}
            saveButtonState={saveButtonState}
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
            onViewChange={setColorPanelView}
            onHighlightColorChange={onHighlightColorChange}
            palette={palette}
            usedColors={usedColors}
            view={colorPanelView}
          />
        ) : null}

        {activeSection === "trace" ? (
          <TracePanelPage
            dispatch={dispatch}
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
          />
        ) : null}

        {activeSection === "settings" ? (
          <SettingsPanelPage
            dispatch={dispatch}
            previewMode={previewMode}
            showGridlines={showGridlines}
            showRuler={showRuler}
            showSymbols={showSymbols}
          />
        ) : null}
      </div>
    </aside>
  );
}
