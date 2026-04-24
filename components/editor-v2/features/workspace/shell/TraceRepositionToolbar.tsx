"use client";

import type { TraceDocument } from "@/lib/editor-v2/editor/store";
import { Button, ButtonIcon, Toolbar, ToolbarDivider, ToolbarGroup, ToolbarIcon, ToolbarLabel } from "@/components/design-system";
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
    <Toolbar className={styles.floatingToolbar}>
      <ToolbarGroup>
        <Button
          type="button"
          variant="ghostV2"
          onClick={() => {
            dispatch(createSetActiveSidebarSectionCommand("trace"));
            dispatch(createSetSidebarCollapsedCommand(false));
          }}
        >
          <ToolbarIcon icon="/icons/lucide/sliders-horizontal.svg" />
          <ToolbarLabel>Display settings</ToolbarLabel>
        </Button>

        <ToolbarDivider />

       
      <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "nowrap",
      }}>
        {/* <Button
            type="button"
            variant="secondary"
            onClick={() => dispatch(createCancelTraceRepositionCommand())}>
          Cancel
        </Button> */}
        <Button 
            type="button" 
            variant="primary" 
            onClick={() => dispatch(createCommitTraceRepositionCommand())}>
          Done
        </Button>
        
        <ToolbarDivider />

         <Button
            type="button"
            variant="toolbarX"
            onClick={() => dispatch(createCancelTraceRepositionCommand())}>
          <ButtonIcon icon="/icons/lucide/x.svg" />
        </Button>
      </div>
         

      </ToolbarGroup>
    </Toolbar>
  );
}
