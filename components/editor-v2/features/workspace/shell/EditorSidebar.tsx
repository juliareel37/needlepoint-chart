"use client";

import { Button } from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import type {
  EditorSidebarSection,
  EditorStore,
  EditorDocumentState,
  PaletteColor,
  TextPlacementSession,
  TraceDocument,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import type { SavedEditorV2DocumentRecord } from "../../../app/editorV2LocalPersistence";
import { ColorPanelPage } from "./panel-pages/ColorPanelPage";
import { DocumentPanelPage } from "./panel-pages/DocumentPanelPage";
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
  palette: PaletteColor[];
  saveMessage: string;
  savedDocuments: SavedEditorV2DocumentRecord[];
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  onLoadSelected: () => void;
  onClose: () => void;
  onSaveDocument: (document: EditorDocumentState) => void;
  onStartOver: () => void;
  showGridlines: boolean;
  showRuler: boolean;
  showSymbols: boolean;
  trace: TraceDocument | null;
  traceRepositionActive: boolean;
  usedColors: Array<{ colorId: string; count: number }>;
  document: EditorDocumentState;
  gridMetrics: GridWorldMetrics;
  dispatch: EditorStore["dispatch"];
  textPlacement: TextPlacementSession | null;
}

export function EditorSidebar({
  activeSection,
  activeColor,
  activeColorId,
  colorsById,
  documentTitle,
  palette,
  saveMessage,
  savedDocuments,
  selectedStorageId,
  setSelectedStorageId,
  onLoadSelected,
  onClose,
  onSaveDocument,
  onStartOver,
  showGridlines,
  showRuler,
  showSymbols,
  trace,
  traceRepositionActive,
  usedColors,
  document,
  gridMetrics,
  dispatch,
  textPlacement,
}: EditorSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarSurface}>
        <div className={styles.sidebarPanelHeader}>
          <h2 className={styles.sidebarPanelTitle} style={typographyStyles.h4}>
            {activeSection === "document"
              ? "Document"
              : activeSection === "color"
                ? "Color"
                : activeSection === "trace"
                  ? "Trace"
                  : activeSection === "text"
                    ? "Text"
                      : "Settings"}
          </h2>
          <Button
            type="button"
            variant="ghostV2"
            size="sm"
            className={styles.sidebarCloseButton}
            aria-label="Hide panel"
            title="Hide panel"
            onClick={onClose}
          >
            <img
              src="/icons/lucide/x.svg"
              alt=""
              aria-hidden="true"
              className={styles.sidebarCloseIcon}
            />
          </Button>
        </div>

        {activeSection === "document" ? (
          <DocumentPanelPage
            dispatch={dispatch}
            document={document}
            documentTitle={documentTitle}
            onLoadSelected={onLoadSelected}
            onSaveDocument={onSaveDocument}
            onStartOver={onStartOver}
            saveMessage={saveMessage}
            savedDocuments={savedDocuments}
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
            palette={palette}
            showGridlines={showGridlines}
            showRuler={showRuler}
            usedColors={usedColors}
          />
        ) : null}

        {activeSection === "trace" ? (
          <TracePanelPage
            dispatch={dispatch}
            repositionActive={traceRepositionActive}
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
          />
        ) : null}

        {activeSection === "settings" ? (
          <SettingsPanelPage
            dispatch={dispatch}
            showGridlines={showGridlines}
            showRuler={showRuler}
            showSymbols={showSymbols}
          />
        ) : null}
      </div>
    </aside>
  );
}
