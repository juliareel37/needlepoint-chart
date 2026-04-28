"use client";

import type {
  EditorStore,
  GridDocument,
  PaletteColor,
  TraceDocument,
  TraceRepositionOrigin,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import { TraceControls } from "../TraceControls";
import styles from "../EditorV2Shell.module.css";

interface TracePanelPageProps {
  dispatch: EditorStore["dispatch"];
  grid: GridDocument;
  gridMetrics: GridWorldMetrics;
  palette: PaletteColor[];
  repositionActive: boolean;
  repositionOrigin: TraceRepositionOrigin | null;
  trace: TraceDocument | null;
}

export function TracePanelPage({
  dispatch,
  grid,
  gridMetrics,
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
          palette={palette}
          repositionActive={repositionActive}
          repositionOrigin={repositionOrigin}
          trace={trace}
        />
      </div>
    </section>
  );
}
