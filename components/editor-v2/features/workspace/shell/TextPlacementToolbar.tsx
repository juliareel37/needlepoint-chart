"use client";

import {
  SingleSelectDropdown,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarIcon,
  ToolbarLabel,
  ToolbarMeta,
  ToolbarSwatch,
} from "@/components/design-system";
import { TEXT_FONT_OPTIONS } from "@/lib/editor-v2/editor/text/textFontOptions";
import { measureIntrinsicText } from "@/lib/editor-v2/editor/text/measureIntrinsicText";
import { convertTextPlacementToCells } from "@/lib/editor-v2/editor/text/convertTextPlacementToCells";
import type {
  EditorStore,
  TextPlacementSession,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import {
  createCancelTextPlacementCommand,
  createPaintCellsCommand,
  createSetActiveSidebarSectionCommand,
  createSetSidebarCollapsedCommand,
  createUpdateTextPlacementCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

interface TextPlacementToolbarProps {
  activeColorHex: string | null;
  activeColorId: string | null;
  dispatch: EditorStore["dispatch"];
  gridMetrics: GridWorldMetrics;
  placement: TextPlacementSession;
}

export function TextPlacementToolbar({
  activeColorHex,
  activeColorId,
  dispatch,
  gridMetrics,
  placement,
}: TextPlacementToolbarProps) {
  const bold = placement.fontWeight >= 700;
  const italic = placement.fontStyle === "italic";
  const underline = placement.underline;
  const canConvert = Boolean(activeColorId);

  function openColorPanel() {
    dispatch(createSetActiveSidebarSectionCommand("color"));
    dispatch(createSetSidebarCollapsedCommand(false));
  }

  function updatePlacementStyle(next: {
    fontFamily?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  }) {
    const nextFontFamily = next.fontFamily ?? placement.fontFamily;
    const nextBold = next.bold ?? bold;
    const nextItalic = next.italic ?? italic;
    const nextUnderline = next.underline ?? underline;
    const measured = measureIntrinsicText(placement.text, {
      baseFontSize: placement.baseFontSize,
      fontFamily: nextFontFamily,
      fontStyle: nextItalic ? "italic" : "normal",
      fontWeight: nextBold ? 700 : 400,
    });

    dispatch(
      createUpdateTextPlacementCommand({
        intrinsicWidth: measured?.width ?? placement.intrinsicWidth,
        intrinsicHeight: measured?.height ?? placement.intrinsicHeight,
        fontFamily: nextFontFamily,
        fontStyle: nextItalic ? "italic" : "normal",
        fontWeight: nextBold ? 700 : 400,
        underline: nextUnderline,
      }),
    );
  }

  function handleConvert() {
    if (!activeColorId) {
      return;
    }

    const cells = convertTextPlacementToCells(placement, gridMetrics);
    if (cells.length === 0) {
      return;
    }

    dispatch(createPaintCellsCommand(activeColorId, cells));
    dispatch(createCancelTextPlacementCommand());
  }

  return (
    <Toolbar className={styles.floatingToolbar}>
      <ToolbarGroup>
        <ToolbarButton
          type="button"
          swatch
          aria-label="Open color panel"
          title="Open color panel"
          onClick={openColorPanel}
        >
          <ToolbarSwatch color={activeColorHex ?? "var(--neutral-400)"} />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarMeta>
          <SingleSelectDropdown
            ariaLabel="Text font"
            items={TEXT_FONT_OPTIONS}
            value={placement.fontFamily}
            placeholder="Font"
            triggerLabel={<strong style={{ fontFamily: placement.fontFamily }}>{placement.fontFamily}</strong>}
            triggerVariant="ghost"
            menuPlacement="bottom-start"
            minWidth="auto"
            menuWidth={220}
            getItemValue={(item) => item.value}
            getItemLabel={(item) => (
              <span style={{ fontFamily: item.value }}>{item.label}</span>
            )}
            onValueChange={(value) => {
              updatePlacementStyle({ fontFamily: value });
            }}
            wrapperStyle={{ width: "fit-content", maxWidth: 180 }}
            triggerStyle={{ minWidth: "auto", padding: "6px 8px", fontWeight: 700 }}
          />
        </ToolbarMeta>

        <ToolbarButton
          type="button"
          active={bold}
          aria-pressed={bold}
          aria-label="Bold"
          title="Bold"
          onClick={() => updatePlacementStyle({ bold: !bold })}
        >
          <ToolbarIcon icon="/icons/lucide/bold.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={italic}
          aria-pressed={italic}
          aria-label="Italic"
          title="Italic"
          onClick={() => updatePlacementStyle({ italic: !italic })}
        >
          <ToolbarIcon icon="/icons/lucide/italic.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={underline}
          aria-pressed={underline}
          aria-label="Underline"
          title="Underline"
          onClick={() => updatePlacementStyle({ underline: !underline })}
        >
          <ToolbarIcon icon="/icons/lucide/underline.svg" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup actions>
        <ToolbarButton
          type="button"
          onClick={() => dispatch(createCancelTextPlacementCommand())}
        >
          <ToolbarLabel>Cancel</ToolbarLabel>
        </ToolbarButton>

        <ToolbarButton
          type="button"
          primary
          disabled={!canConvert}
          onClick={handleConvert}
        >
          <ToolbarLabel>Convert</ToolbarLabel>
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
}
