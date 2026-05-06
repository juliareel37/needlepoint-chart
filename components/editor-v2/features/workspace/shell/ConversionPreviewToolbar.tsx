"use client";

import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarLabel } from "@/components/design-system";
import type { EditorStore } from "@/lib/editor-v2/editor/store";
import {
  createCommitTraceConversionPreviewCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

interface ConversionPreviewToolbarProps {
  dispatch: EditorStore["dispatch"];
  onExitPreview: () => void;
}

export function ConversionPreviewToolbar({
  dispatch,
  onExitPreview,
}: ConversionPreviewToolbarProps) {
  return (
    <Toolbar
      aria-label="Conversion preview toolbar"
      className={styles.conversionPreviewToolbar}
    >
      <ToolbarGroup>
        <ToolbarLabel>Exit preview to adjust conversion settings, and apply when ready. </ToolbarLabel>
      </ToolbarGroup>
      <ToolbarGroup actions>
        <ToolbarButton
          textOnly
          type="button"
          variant="secondary"
          onClick={onExitPreview}
        >
          Exit preview
        </ToolbarButton>
        <ToolbarButton
          textOnly
          type="button"
          variant="primary"
          onClick={() => dispatch(createCommitTraceConversionPreviewCommand())}
        >
          Apply
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
}
