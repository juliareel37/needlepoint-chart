"use client";

import type {
  EditorStore,
  GridDocument,
  PaletteColor,
  TraceConversionPreviewState,
  TraceDocument,
  TraceRepositionOrigin,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import type { TraceCropRect } from "@/lib/editor-v2/editor/trace/crop";
import { TraceControls } from "../TraceControls";
import styles from "../EditorV2Shell.module.css";

interface TracePanelPageProps {
  cropDraft?: TraceCropRect | null;
  cropEditing?: boolean;
  dispatch: EditorStore["dispatch"];
  editModeActive?: boolean;
  eraserEditing?: boolean;
  grid: GridDocument;
  gridMetrics: GridWorldMetrics;
  onBeginCrop?: () => void;
  onBeginEraser?: () => void;
  onCancelCrop?: () => void;
  onCommitCrop?: () => void;
  onResetCrop?: () => void;
  onToggleEditMode?: () => void;
  palette: PaletteColor[];
  previewState: TraceConversionPreviewState | null;
  repositionActive: boolean;
  repositionOrigin: TraceRepositionOrigin | null;
  trace: TraceDocument | null;
  guestDraftId?: string | null;
}

export function TracePanelPage({
  cropDraft,
  cropEditing = false,
  dispatch,
  editModeActive = false,
  eraserEditing = false,
  grid,
  gridMetrics,
  onBeginCrop,
  onBeginEraser,
  onCancelCrop,
  onCommitCrop,
  onResetCrop,
  onToggleEditMode,
  palette,
  previewState,
  repositionActive,
  repositionOrigin,
  trace,
  guestDraftId = null,
}: TracePanelPageProps) {
  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <TraceControls
          cropDraft={cropDraft}
          cropEditing={cropEditing}
          dispatch={dispatch}
          editModeActive={editModeActive}
          eraserEditing={eraserEditing}
          guestDraftId={guestDraftId}
          grid={grid}
          gridMetrics={gridMetrics}
          onBeginCrop={onBeginCrop}
          onBeginEraser={onBeginEraser}
          onCancelCrop={onCancelCrop}
          onCommitCrop={onCommitCrop}
          onResetCrop={onResetCrop}
          onToggleEditMode={onToggleEditMode}
          palette={palette}
          previewState={previewState}
          repositionActive={repositionActive}
          repositionOrigin={repositionOrigin}
          trace={trace}
        />
      </div>
    </section>
  );
}
