"use client";

import type {
  EditorStore,
  TraceDocument,
  TraceRepositionOrigin,
} from "@/lib/editor-v2/editor/store";
import { TraceControls } from "../TraceControls";
import styles from "../EditorV2Shell.module.css";

interface TracePanelPageProps {
  dispatch: EditorStore["dispatch"];
  repositionActive: boolean;
  repositionOrigin: TraceRepositionOrigin | null;
  trace: TraceDocument | null;
}

export function TracePanelPage({
  dispatch,
  repositionActive,
  repositionOrigin,
  trace,
}: TracePanelPageProps) {
  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <TraceControls
          dispatch={dispatch}
          repositionActive={repositionActive}
          repositionOrigin={repositionOrigin}
          trace={trace}
        />
      </div>
    </section>
  );
}
