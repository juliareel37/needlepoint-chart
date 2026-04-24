"use client";

import type { TraceDocument } from "@/lib/editor-v2/editor/store";
import { Toolbar, ToolbarButton, ToolbarDivider, ToolbarGroup, ToolbarIcon, ToolbarLabel } from "@/components/design-system";
import type { EditorStore } from "@/lib/editor-v2/editor/store";
import {
  createCancelTraceRepositionCommand,
  createCommitTraceRepositionCommand,
  createSetActiveSidebarSectionCommand,
  createSetSidebarCollapsedCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

interface TraceRepositionToolbarProps {
  dispatch: EditorStore["dispatch"];
  trace: TraceDocument;
}

export function TraceRepositionToolbar({
  dispatch,
  trace: _trace,
}: TraceRepositionToolbarProps) {
  return (
    <div className={styles.selectionToolbarCluster}>
      <div className={styles.selectionToolbarCloseViewport}>
        <Toolbar className={[styles.floatingToolbar, styles.selectionToolbarCloseBar].join(" ")}>
          <ToolbarButton
            type="button"
            variant="ghost"
            iconOnly
            className={styles.selectionToolbarCloseButton}
            onClick={() => dispatch(createCancelTraceRepositionCommand())}
          >
            <ToolbarIcon icon="/icons/lucide/x.svg" />
          </ToolbarButton>
        </Toolbar>
      </div>

      <div className={styles.selectionToolbarMainViewport}>
        <Toolbar className={styles.floatingToolbar}>
          <ToolbarGroup>
            <ToolbarButton
              type="button"
              labelled
              onClick={() => {
                dispatch(createSetActiveSidebarSectionCommand("trace"));
                dispatch(createSetSidebarCollapsedCommand(false));
              }}
            >
              <ToolbarIcon icon="/icons/lucide/sliders-horizontal.svg" />
              <ToolbarLabel>Display settings</ToolbarLabel>
            </ToolbarButton>
{/* 
            <ToolbarDivider />
            <ToolbarGroup style={{ display: "flex", gap: 8, alignItems: "center", paddingLeft: 10 }}>
              <ToolbarButton
                type="button"
                variant="secondary"
                labelled
                onClick={() => dispatch(createCancelTraceRepositionCommand())}
              >
                Cancel
              </ToolbarButton>
              <ToolbarButton
                type="button"
                variant="primary"
                labelled
                onClick={() => dispatch(createCommitTraceRepositionCommand())}
              >
                Done
              </ToolbarButton>
            </ToolbarGroup> */}
          </ToolbarGroup>
        </Toolbar>
      </div>

      <div className={styles.selectionToolbarCloseViewport}>
        <Toolbar className={[styles.floatingToolbar, styles.selectionToolbarCloseBar].join(" ")}>
          <ToolbarButton
            type="button"
            variant="ghost"
            iconOnly
            className={styles.selectionToolbarCloseButton}
            onClick={() => dispatch(createCommitTraceRepositionCommand())}
          >
            <ToolbarIcon icon="/icons/lucide/check.svg" />
          </ToolbarButton>
        </Toolbar>
      </div>
    </div>
  );
}
