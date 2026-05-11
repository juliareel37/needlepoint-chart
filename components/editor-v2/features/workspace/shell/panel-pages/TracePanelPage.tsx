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
  grid: GridDocument;
  gridMetrics: GridWorldMetrics;
  onBeginCrop?: () => void;
  onCancelCrop?: () => void;
  onCommitCrop?: () => void;
  onResetCrop?: () => void;
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
  grid,
  gridMetrics,
  onBeginCrop,
  onCancelCrop,
  onCommitCrop,
  onResetCrop,
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
          guestDraftId={guestDraftId}
          grid={grid}
          gridMetrics={gridMetrics}
          onBeginCrop={onBeginCrop}
          onCancelCrop={onCancelCrop}
          onCommitCrop={onCommitCrop}
          onResetCrop={onResetCrop}
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
