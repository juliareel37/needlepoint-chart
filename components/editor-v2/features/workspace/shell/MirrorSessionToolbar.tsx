"use client";

import { Button, ButtonIcon, Toolbar, ToolbarDivider, ToolbarGroup, ToolbarLabel } from "@/components/design-system";
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
  const hasSelection = Boolean(session?.sourceRect);
  const instruction = !hasSelection
    ? "Drag to choose an area"
    : session?.dragAnchor
      ? "Release to place mirror targets"
      : "Click a colored edge to mirror";

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

        <ToolbarDivider />

        <Button
          type="button"
          variant="secondary"
          disabled={!hasSelection}
          onClick={() => dispatch(createResetMirrorSelectionCommand())}
        >
          New area
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={() => dispatch(createDoneMirrorCommand())}
        >
          Done
        </Button>

        <Button
          type="button"
          variant="ghost"
          aria-label="Cancel mirror session"
          onClick={() => dispatch(createCancelMirrorCommand())}
        >
          <ButtonIcon icon="/icons/lucide/x.svg" />
        </Button>
      </ToolbarGroup>
    </Toolbar>
  );
}
