"use client";

import type { EditorStore, TraceDocument } from "@/lib/editor-v2/editor/store";
import { TraceControls } from "../TraceControls";
import styles from "../EditorV2Shell.module.css";

interface TracePanelPageProps {
  dispatch: EditorStore["dispatch"];
  repositionActive: boolean;
  trace: TraceDocument | null;
}

export function TracePanelPage({
  dispatch,
  repositionActive,
  trace,
}: TracePanelPageProps) {
  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <TraceControls
          dispatch={dispatch}
          repositionActive={repositionActive}
          trace={trace}
        />
      </div>
    </section>
  );
}
