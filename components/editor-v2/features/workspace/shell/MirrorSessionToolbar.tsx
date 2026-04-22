"use client";

import { Button, ButtonIcon, Toolbar, ToolbarButton, ToolbarDivider, ToolbarGroup, ToolbarIcon, ToolbarLabel } from "@/components/design-system";
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
          {/* <Button
            type="button"
            variant="ghostV2"
            aria-label="Cancel mirror session"
            onClick={() => dispatch(createCancelMirrorCommand())}
          >
            <ButtonIcon icon="/icons/lucide/arrow-left.svg" />

          </Button> */}
          
          {/* <ToolbarDivider /> */}

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


        <Button
          type="button"
          variant="secondary"
          disabled={!hasCommittedSelection}
          onClick={() => dispatch(createResetMirrorSelectionCommand())}
        >
          Select new
          {/* <ButtonIcon icon="/icons/lucide/x.svg" /> */}

          
        </Button>
          <ToolbarDivider />


        <div
          style={{
            display: "flex",
            gap: 8,}}>

          {/* <Button
            type="button"
            variant="secondary"
            onClick={() => dispatch(createCancelMirrorCommand())}
            style = {{padding:"8px 20px",}}

          >
            Cancel
          </Button> */}

          <Button
            type="button"
            variant="primary"
            onClick={() => dispatch(createDoneMirrorCommand())}
            style = {{padding:"8px 20px",}}
          >
            Done
          </Button>

        </div>


          <ToolbarDivider />

           <Button
            type="button"
            variant="toolbarX"
            aria-label="Cancel mirror session"
            onClick={() => dispatch(createCancelMirrorCommand())}
          >
            <ButtonIcon icon="/icons/lucide/x.svg" />

          </Button>




        {/* <Button
          type="button"
          variant="ghostV2"
          aria-label="Cancel mirror session"
          onClick={() => dispatch(createCancelMirrorCommand())}
        >
          <ButtonIcon icon="/icons/lucide/x.svg" />
        </Button> */}

        {/* <ToolbarButton
          type="button"
          onClick={() => {
            dispatch(createCancelMirrorCommand())
          }}
        >
          <ToolbarIcon icon="/icons/lucide/x.svg" />
        </ToolbarButton> */}
      </ToolbarGroup>
    </Toolbar>
  );
}
