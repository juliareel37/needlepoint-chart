"use client";

import { Toolbar, ToolbarButton, ToolbarDivider, ToolbarGroup, ToolbarIcon, ToolbarLabel } from "@/components/design-system";
import type { EditorStore, MirrorSessionState } from "@/lib/editor-v2/editor/store";
import {
  createCancelMirrorCommand,
  createDoneMirrorCommand,
  createResetMirrorSelectionCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

interface MirrorSessionToolbarProps {
  dispatch: EditorStore["dispatch"];
  session: MirrorSessionState | null;
}

export function MirrorSessionToolbar({
  dispatch,
  session,
}: MirrorSessionToolbarProps) {
  const hasCommittedSelection = Boolean(session?.sourceRect && !session?.dragAnchor);
  const instruction = !hasCommittedSelection
    ? "Drag to select mirror area."
    : "Choose a region to mirror";

  return (
    <Toolbar className={styles.floatingToolbar}>
      <ToolbarGroup>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "nowrap",
            padding: "6px 8px",
          }}
        >
          <ToolbarLabel>{instruction}</ToolbarLabel>
        </div>

        <ToolbarButton
          type="button"
          variant="secondary"
          labelled
          disabled={!hasCommittedSelection}
          onClick={() => dispatch(createResetMirrorSelectionCommand())}
        >
          Select new
        </ToolbarButton>
        <ToolbarDivider />

        <div style={{ display: "flex", gap: 8 }}>
          <ToolbarButton
            type="button"
            variant="primary"
            labelled
            onClick={() => dispatch(createDoneMirrorCommand())}
          >
            Done
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        <ToolbarButton
          type="button"
          variant="ghost"
          iconOnly
          aria-label="Cancel mirror session"
          onClick={() => dispatch(createCancelMirrorCommand())}
        >
          <ToolbarIcon icon="/icons/lucide/x.svg" />
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
}
