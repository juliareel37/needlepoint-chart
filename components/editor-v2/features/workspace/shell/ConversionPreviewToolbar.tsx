"use client";

import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarLabel } from "@/components/design-system";
import type { EditorStore } from "@/lib/editor-v2/editor/store";
import {
  createCancelTraceConversionPreviewCommand,
  createCommitTraceConversionPreviewCommand,
} from "../workspaceCommands";

interface ConversionPreviewToolbarProps {
  dispatch: EditorStore["dispatch"];
}

export function ConversionPreviewToolbar({
  dispatch,
}: ConversionPreviewToolbarProps) {
  return (
    <Toolbar aria-label="Conversion preview toolbar">
      <ToolbarGroup>
        <ToolbarLabel>Previewing image conversion.</ToolbarLabel>
      </ToolbarGroup>
      <ToolbarGroup actions>
        <ToolbarButton
          textOnly
          type="button"
          variant="secondary"
          onClick={() => dispatch(createCancelTraceConversionPreviewCommand())}
        >
          Exit preview
        </ToolbarButton>
        <ToolbarButton
          textOnly
          type="button"
          variant="primary"
          onClick={() => dispatch(createCommitTraceConversionPreviewCommand())}
        >
          Apply to canvas
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
}
