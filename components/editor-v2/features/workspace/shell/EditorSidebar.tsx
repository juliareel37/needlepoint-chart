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
  onColorSwapPreviewChange: (preview: { fromColorId: string; toColorId: string } | null) => void;
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
  traceEditModeActive?: boolean;
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
  traceEraserEditing?: boolean;
  onBeginTraceCrop?: () => void;
  onBeginTraceEraser?: () => void;
  onCancelTraceCrop?: () => void;
  onCommitTraceCrop?: () => void;
  onResetTraceCrop?: () => void;
  onToggleTraceEditMode?: () => void;
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
  onColorSwapPreviewChange,
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
  traceEditModeActive = false,
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
  traceEraserEditing = false,
  onBeginTraceCrop,
  onBeginTraceEraser,
  onCancelTraceCrop,
  onCommitTraceCrop,
  onResetTraceCrop,
  onToggleTraceEditMode,
}: EditorSidebarProps) {
  const [colorPanelView, setColorPanelView] = useState<ColorPanelView>("overview");
  const [customPaletteDraftId, setCustomPaletteDraftId] = useState<string | null>(null);
  const [customPaletteDraftColorIds, setCustomPaletteDraftColorIds] = useState<string[]>([]);
  const [customPaletteDraftName, setCustomPaletteDraftName] = useState("");
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
  const isColorSubpage = colorPanelView !== "overview";
  const colorPanelBackTitle =
    colorPanelView === "design-colors"
      ? "Design colors"
      : colorPanelView === "custom-palettes"
        ? "Custom palettes"
        : "Create palette";
  const handleColorPanelBack = () => {
    if (colorPanelView === "custom-palette-create") {
      setColorPanelView("custom-palettes");
      return;
    }

    setColorPanelView("overview");
  };
  const colorPanelBackLabel =
    colorPanelView === "custom-palette-create"
      ? "Back to custom palettes"
      : "Back to color overview";
  const handleCustomPaletteCreateOpen = () => {
    setCustomPaletteDraftId(null);
    setCustomPaletteDraftColorIds([]);
    setCustomPaletteDraftName(buildNextCustomPaletteDefaultName(document.palette.customPalettesById));
    setColorPanelView("custom-palette-create");
  };
  const handleCustomPaletteEditOpen = (paletteId: string) => {
    const palette = document.palette.customPalettesById[paletteId];
    if (!palette) {
      return;
    }

    setCustomPaletteDraftId(palette.id);
    setCustomPaletteDraftColorIds([...palette.colorIds]);
    setCustomPaletteDraftName(palette.name);
    setColorPanelView("custom-palette-create");
  };
  const handleCustomPaletteDraftColorToggle = (colorId: string) => {
    setCustomPaletteDraftColorIds((current) =>
      current.includes(colorId)
        ? current.filter((entry) => entry !== colorId)
        : [...current, colorId],
    );
  };
  const handleCustomPaletteDraftReset = () => {
    setCustomPaletteDraftColorIds([]);
  };
  const handleCustomPaletteDraftNameChange = (nextName: string) => {
    setCustomPaletteDraftName(nextName);
  };
  const handleCustomPaletteDraftSelectAll = (colorIds: string[]) => {
    setCustomPaletteDraftColorIds((current) => {
      const next = new Set(current);
      for (const colorId of colorIds) {
        next.add(colorId);
      }

      return [...next];
    });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarSurface}>
        <div className={styles.sidebarPanelHeader}>
          {activeSection === "color" && isColorSubpage ? (
            <div className={styles.sidebarPanelBackRow}>
              <Button
                type="button"
                variant="ghostV2"
                size="sm"
                className={styles.sidebarPanelBackButton}
                aria-label={colorPanelBackLabel}
                title={colorPanelBackLabel}
                onClick={handleColorPanelBack}
              >
                <ButtonIcon icon="/icons/lucide/arrow-left.svg" />
              </Button>
              <span className={styles.sidebarPanelBackTitle} style={typographyStyles.h4}>
                {colorPanelBackTitle}
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
                        ? "Graphics"
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
              saveMode={saveMode}
              snapshotSaving={snapshotSaving}
            />
          ) : null}

          {activeSection === "color" ? (
            <ColorPanelPage
              activeColor={activeColor}
              activeColorId={activeColorId}
              colorsById={colorsById}
              customPalettesById={document.palette.customPalettesById}
              dispatch={dispatch}
              highlightedColorId={highlightedColorId}
              isBottomPanelCanvasFocusActive={isBottomPanelCanvasFocusActive}
              isBottomPanelLayout={isBottomPanelLayout}
              customPaletteDraftColorIds={customPaletteDraftColorIds}
              customPaletteDraftId={customPaletteDraftId}
              customPaletteDraftName={customPaletteDraftName}
              onEnterBottomPanelCanvasFocus={onEnterBottomPanelCanvasFocus}
              onCustomPaletteCreateOpen={handleCustomPaletteCreateOpen}
              onCustomPaletteEditOpen={handleCustomPaletteEditOpen}
              onCustomPaletteDraftColorToggle={handleCustomPaletteDraftColorToggle}
              onCustomPaletteDraftNameChange={handleCustomPaletteDraftNameChange}
              onCustomPaletteDraftReset={handleCustomPaletteDraftReset}
              onCustomPaletteDraftSelectAll={handleCustomPaletteDraftSelectAll}
              onColorSwapPreviewChange={onColorSwapPreviewChange}
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
                editModeActive={traceEditModeActive}
                eraserEditing={traceEraserEditing}
                guestDraftId={currentStorageId ? null : document.project.id}
                grid={document.grid}
                gridMetrics={gridMetrics}
                onBeginCrop={onBeginTraceCrop}
                onBeginEraser={onBeginTraceEraser}
                onCancelCrop={onCancelTraceCrop}
                onCommitCrop={onCommitTraceCrop}
                onResetCrop={onResetTraceCrop}
                onToggleEditMode={onToggleTraceEditMode}
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

function buildNextCustomPaletteDefaultName(
  customPalettesById: EditorDocumentState["palette"]["customPalettesById"],
): string {
  const existingNames = new Set(
    Object.values(customPalettesById).map((palette) => palette.name.trim().toLowerCase()),
  );
  const baseName = "My Palette";

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let index = 2;
  while (existingNames.has(`${baseName} ${index}`.toLowerCase())) {
    index += 1;
  }

  return `${baseName} ${index}`;
}
