"use client";

import type { EditorStore, TraceDocument } from "@/lib/editor-v2/editor/store";
import { TraceControls } from "../TraceControls";
import styles from "../EditorV2Shell.module.css";

interface TracePanelPageProps {
  dispatch: EditorStore["dispatch"];
  trace: TraceDocument | null;
}

export function TracePanelPage({
  dispatch,
  trace,
}: TracePanelPageProps) {
  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <TraceControls trace={trace} dispatch={dispatch} />
      </div>
    </section>
  );
}
