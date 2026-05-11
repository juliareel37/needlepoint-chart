"use client";

import { useEffect, useRef, useState } from "react";
import { Button, ButtonIcon } from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import type {
  EditorDocumentState,
  EditorSidebarSection,
  EditorStore,
  IconPlacementSession,
  PaletteColor,
  TextPlacementSession,
  TraceConversionPreviewState,
  TraceDocument,
  TraceRepositionOrigin,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import type {
  SavedEditorV2DocumentRecord,
} from "../../../app/editorV2ServerPersistence";
import type { TraceCropRect } from "@/lib/editor-v2/editor/trace/crop";
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
  onEnterVersionHistoryMode: () => void;
  selectionScopeActive: boolean;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  onLoadSelected: () => void;
  onClose: () => void;
  onEnterBottomPanelCanvasFocus: () => void;
  onExitBottomPanelCanvasFocus: () => void;
  onDuplicateDocument: () => void;
  onDownloadDocument: () => void;
  onSaveVersionSnapshot: () => void;
  onOpenVersionHistory: () => void;
  onSignIn: () => void;
  onScopeModeChange: (mode: "full-canvas" | "selection") => void;
  onStartOver: () => void;
  onClearLocalBrowserData: () => Promise<void> | void;
  previewMode: boolean;
  snapshotSaving: boolean;
  exportInProgress: boolean;
  previewModeDisabled?: boolean;
  selectionControlActive: boolean;
  selectionPromptVisible: boolean;
  showGridlines: boolean;
  showRuler: boolean;
  showSymbols: boolean;
  touchSnappingEnabled: boolean;
  trace: TraceDocument | null;
  traceConversionPreview: TraceConversionPreviewState | null;
  traceRepositionActive: boolean;
  traceRepositionOrigin: TraceRepositionOrigin | null;
  usedColors: Array<{ colorId: string; count: number }>;
  document: EditorDocumentState;
  gridMetrics: GridWorldMetrics;
  highlightedColorId: string | null;
  lastSaveConfirmedAt: number | null;
  recoveredLocalChanges: boolean;
  saveMessage: string;
  saveMode: "manual" | "autosave";
  dispatch: EditorStore["dispatch"];
  textPlacement: TextPlacementSession | null;
  iconPlacement: IconPlacementSession | null;
  isBottomPanelLayout: boolean;
  requestedColorPanelView: ColorPanelView | null;
  requestedColorPanelViewKey: number;
  onHighlightColorChange: (colorId: string | null) => void;
  textViewportCenter: WorldPoint | null;
  textViewportWidth: number | null;
  textViewportHeight: number | null;
  traceCropDraft?: TraceCropRect | null;
  traceCropEditing?: boolean;
  onBeginTraceCrop?: () => void;
  onCancelTraceCrop?: () => void;
  onCommitTraceCrop?: () => void;
  onResetTraceCrop?: () => void;
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
  onEnterVersionHistoryMode,
  selectionScopeActive,
  selectedStorageId,
  setSelectedStorageId,
  onLoadSelected,
  onClose,
  onEnterBottomPanelCanvasFocus,
  onExitBottomPanelCanvasFocus,
  onDuplicateDocument,
  onDownloadDocument,
  onSaveVersionSnapshot,
  onOpenVersionHistory,
  onSignIn,
  onScopeModeChange,
  onStartOver,
  onClearLocalBrowserData,
  previewMode,
  snapshotSaving,
  exportInProgress,
  previewModeDisabled = false,
  selectionControlActive,
  selectionPromptVisible,
  showGridlines,
  showRuler,
  showSymbols,
  touchSnappingEnabled,
  trace,
  traceConversionPreview,
  traceRepositionActive,
  traceRepositionOrigin,
  usedColors,
  document,
  gridMetrics,
  highlightedColorId,
  lastSaveConfirmedAt,
  recoveredLocalChanges,
  saveMessage,
  saveMode,
  dispatch,
  textPlacement,
  iconPlacement,
  isBottomPanelLayout,
  requestedColorPanelView,
  requestedColorPanelViewKey,
  onHighlightColorChange,
  textViewportCenter,
  textViewportWidth,
  textViewportHeight,
  traceCropDraft = null,
  traceCropEditing = false,
  onBeginTraceCrop,
  onCancelTraceCrop,
  onCommitTraceCrop,
  onResetTraceCrop,
}: EditorSidebarProps) {
  const [colorPanelView, setColorPanelView] = useState<ColorPanelView>("overview");
  const [iconsPanelView, setIconsPanelView] = useState<IconsPanelView>({ type: "overview" });
  const [iconsPanelBackRequestKey, setIconsPanelBackRequestKey] = useState(0);
  const iconsOverviewScrollTopRef = useRef(0);
  const iconsSubpageScrollRef = useRef<{ category: string | null; scrollTop: number }>({
    category: null,
    scrollTop: 0,
  });
  const previousActiveSectionRef = useRef(activeSection);
  const shouldRestoreIconsSubpageScrollRef = useRef(false);

  useEffect(() => {
    if (!requestedColorPanelView) {
      return;
    }

    setColorPanelView(requestedColorPanelView);
  }, [requestedColorPanelView, requestedColorPanelViewKey]);

  useEffect(() => {
    const previousActiveSection = previousActiveSectionRef.current;

    if (
      previousActiveSection === "icons" &&
      activeSection !== "icons" &&
      iconsPanelView.type === "category"
    ) {
      shouldRestoreIconsSubpageScrollRef.current = true;
    }

    previousActiveSectionRef.current = activeSection;
  }, [activeSection, iconsPanelView]);

  const handleIconsPanelViewChange = (
    nextView: IconsPanelView,
    options?: { overviewScrollTop?: number },
  ) => {
    if (typeof options?.overviewScrollTop === "number") {
      iconsOverviewScrollTopRef.current = options.overviewScrollTop;
    }

    shouldRestoreIconsSubpageScrollRef.current = false;
    setIconsPanelView(nextView);
  };

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
                onClick={() => setIconsPanelBackRequestKey((current) => current + 1)}
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
              currentStorageId={currentStorageId}
              dispatch={dispatch}
              document={document}
              documentTitle={documentTitle}
              exportInProgress={exportInProgress}
              hasSavedDesignAccess={hasSavedDesignAccess}
              hasUnsavedChanges={hasUnsavedChanges}
              isDocumentPanelStatusVisible={isDocumentPanelStatusVisible}
              lastSaveConfirmedAt={lastSaveConfirmedAt}
              onClearLocalBrowserData={onClearLocalBrowserData}
              onDownloadDocument={onDownloadDocument}
              onOpenAllDesigns={() => {
                window.location.assign("/library");
              }}
              onOpenRecentDesign={(storageId) => {
                window.location.assign(`/editor/designs/${storageId}`);
              }}
              onOpenSavedDocuments={onOpenSavedDocuments}
              onDuplicateDocument={onDuplicateDocument}
              onOpenVersionHistory={onOpenVersionHistory}
              onSaveVersionSnapshot={onSaveVersionSnapshot}
              onSignIn={onSignIn}
              onStartOver={onStartOver}
              recoveredLocalChanges={recoveredLocalChanges}
              renameRequestToken={renameRequestToken}
              savedDocuments={savedDocuments}
              savedDocumentsLoading={savedDocumentsLoading}
              saveMessage={saveMessage}
              snapshotSaving={snapshotSaving}
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
                cropDraft={traceCropDraft}
                cropEditing={traceCropEditing}
                dispatch={dispatch}
                guestDraftId={currentStorageId ? null : document.project.id}
                grid={document.grid}
                gridMetrics={gridMetrics}
                onBeginCrop={onBeginTraceCrop}
                onCancelCrop={onCancelTraceCrop}
                onCommitCrop={onCommitTraceCrop}
                onResetCrop={onResetTraceCrop}
                palette={palette}
                previewState={traceConversionPreview}
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
              backRequestKey={iconsPanelBackRequestKey}
              dispatch={dispatch}
              gridMetrics={gridMetrics}
              onBackRequestHandled={() => {}}
              onScrollPositionChange={(scrollTop, view) => {
                if (view.type === "overview") {
                  iconsOverviewScrollTopRef.current = scrollTop;
                  return;
                }

                iconsSubpageScrollRef.current = {
                  category: view.category,
                  scrollTop,
                };
              }}
              onViewChange={handleIconsPanelViewChange}
              placement={iconPlacement}
              persistedScrollTop={
                iconsPanelView.type === "overview"
                  ? iconsOverviewScrollTopRef.current
                  : shouldRestoreIconsSubpageScrollRef.current &&
                      iconsSubpageScrollRef.current.category === iconsPanelView.category
                    ? iconsSubpageScrollRef.current.scrollTop
                    : 0
              }
              view={iconsPanelView}
              viewportCenter={textViewportCenter}
              viewportWidth={textViewportWidth}
              viewportHeight={textViewportHeight}
            />
          ) : null}

          {activeSection === "settings" ? (
            <SettingsPanelPage
              dispatch={dispatch}
              isBottomPanelLayout={isBottomPanelLayout}
              previewMode={previewMode}
              previewModeDisabled={previewModeDisabled}
              showGridlines={showGridlines}
              showRuler={showRuler}
              showSymbols={showSymbols}
              touchSnappingEnabled={touchSnappingEnabled}
            />
          ) : null}
        </div>
      </div>
    </aside>
  );
}
