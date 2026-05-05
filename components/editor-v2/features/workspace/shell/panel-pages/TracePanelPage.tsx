"use client";

import type {
  EditorStore,
  GridDocument,
  PaletteColor,
  TraceDocument,
  TraceRepositionOrigin,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import type { TraceCropRect } from "@/lib/editor-v2/editor/trace/crop";
import { TraceControls } from "../TraceControls";
import styles from "../EditorV2Shell.module.css";

interface TracePanelPageProps {
  dispatch: EditorStore["dispatch"];
  grid: GridDocument;
  gridMetrics: GridWorldMetrics;
  onPreviewCropChange?: (crop: TraceCropRect | null) => void;
  palette: PaletteColor[];
  repositionActive: boolean;
  repositionOrigin: TraceRepositionOrigin | null;
  trace: TraceDocument | null;
}

export function TracePanelPage({
  dispatch,
  grid,
  gridMetrics,
  onPreviewCropChange,
  palette,
  repositionActive,
  repositionOrigin,
  trace,
}: TracePanelPageProps) {
  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <TraceControls
          dispatch={dispatch}
          grid={grid}
          gridMetrics={gridMetrics}
          onPreviewCropChange={onPreviewCropChange}
          palette={palette}
          repositionActive={repositionActive}
          repositionOrigin={repositionOrigin}
          trace={trace}
        />
      </div>
    </section>
  );
}
