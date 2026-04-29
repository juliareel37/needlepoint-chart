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
import type {
  EditorDesignVersionListItem,
  LoadEditorV2VersionResult,
  RestoreEditorV2VersionResult,
  SavedEditorV2DocumentRecord,
} from "../../../app/editorV2ServerPersistence";
import { ColorPanelPage, type ColorPanelView } from "./panel-pages/ColorPanelPage";
import { DocumentPanelPage } from "./panel-pages/DocumentPanelPage";
import { IconsPanelPage, type IconsPanelView } from "./panel-pages/IconsPanelPage";
import { TextPanelPage } from "./panel-pages/TextPanelPage";
import { TracePanelPage } from "./panel-pages/TracePanelPage";
import { SettingsPanelPage } from "./panel-pages/SettingsPanelPage";
import styles from "./EditorV2Shell.module.css";

interface EditorSidebarProps {
  activeSection: EditorSidebarSection;
  autoSaveEnabled: boolean;
  activeColor: PaletteColor | null;
  activeColorId: string | null;
  colorsById: Record<string, PaletteColor>;
  documentTitle: string;
  hasSavedDesignAccess: boolean;
  hasUnsavedChanges: boolean;
  isDocumentPanelStatusVisible: boolean;
  isBottomPanelCanvasFocusActive: boolean;
  palette: PaletteColor[];
  renameRequestToken: number;
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  savedDocumentsHasMore: boolean;
  savedDocumentsLoadingMore: boolean;
  onOpenSavedDocuments: () => Promise<void> | void;
  onLoadMoreSavedDocuments: () => Promise<void> | void;
  currentStorageId: string;
  onListVersions: (storageId: string) => Promise<EditorDesignVersionListItem[]>;
  onPreviewVersion: (
    storageId: string,
    versionId: string,
    currentDocument: EditorDocumentState,
  ) => Promise<void> | void;
  onExitVersionPreview: () => void;
  onRestoreVersion: (
    storageId: string,
    versionId: string,
  ) => Promise<RestoreEditorV2VersionResult>;
  isVersionPreview: boolean;
  versionPreviewMeta: {
    versionId: string;
    createdAt: string;
    saveSource: LoadEditorV2VersionResult["saveSource"];
  } | null;
  selectionScopeActive: boolean;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  onLoadSelected: () => void;
  onClose: () => void;
  onEnterBottomPanelCanvasFocus: () => void;
  onExitBottomPanelCanvasFocus: () => void;
  onSignIn: () => void;
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
  recoveredLocalChanges: boolean;
  saveMessage: string;
  saveMode: "manual" | "autosave";
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
  autoSaveEnabled,
  activeColor,
  activeColorId,
  colorsById,
  documentTitle,
  hasSavedDesignAccess,
  hasUnsavedChanges,
  isDocumentPanelStatusVisible,
  isBottomPanelCanvasFocusActive,
  palette,
  renameRequestToken,
  savedDocuments,
  savedDocumentsLoading,
  savedDocumentsHasMore,
  savedDocumentsLoadingMore,
  onOpenSavedDocuments,
  onLoadMoreSavedDocuments,
  currentStorageId,
  onListVersions,
  onPreviewVersion,
  onExitVersionPreview,
  onRestoreVersion,
  isVersionPreview,
  versionPreviewMeta,
  selectionScopeActive,
  selectedStorageId,
  setSelectedStorageId,
  onLoadSelected,
  onClose,
  onEnterBottomPanelCanvasFocus,
  onExitBottomPanelCanvasFocus,
  onSignIn,
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
  recoveredLocalChanges,
  saveMessage,
  saveMode,
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
              autoSaveEnabled={autoSaveEnabled}
              dispatch={dispatch}
              currentDocument={document}
              documentTitle={documentTitle}
              hasSavedDesignAccess={hasSavedDesignAccess}
              hasUnsavedChanges={hasUnsavedChanges}
              isDocumentPanelStatusVisible={isDocumentPanelStatusVisible}
              onLoadSelected={onLoadSelected}
              renameRequestToken={renameRequestToken}
              onSignIn={onSignIn}
              onStartOver={onStartOver}
              recoveredLocalChanges={recoveredLocalChanges}
              saveMessage={saveMessage}
              saveMode={saveMode}
              savedDocuments={savedDocuments}
              savedDocumentsLoading={savedDocumentsLoading}
              savedDocumentsHasMore={savedDocumentsHasMore}
              savedDocumentsLoadingMore={savedDocumentsLoadingMore}
              onOpenSavedDocuments={onOpenSavedDocuments}
              onLoadMoreSavedDocuments={onLoadMoreSavedDocuments}
              currentStorageId={currentStorageId}
              onListVersions={onListVersions}
              onPreviewVersion={onPreviewVersion}
              onExitVersionPreview={onExitVersionPreview}
              onRestoreVersion={onRestoreVersion}
              isVersionPreview={isVersionPreview}
              versionPreviewMeta={versionPreviewMeta}
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
