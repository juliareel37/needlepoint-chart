"use client";

import {
  SingleSelectDropdown,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarIcon,
  ToolbarMeta,
} from "@/components/design-system";
import type { EditorStore, ViewportState } from "@/lib/editor-v2/editor/store";
import { createSetViewportZoomCommand } from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

const ZOOM_BUTTONS_PRESET_PERCENTS = [
  1,
  2,
  5,
  10,
  15,
  20,
  25,
  33,
  40,
  50,
  67,
  80,
  100,
  200,
  400,
  800,
] as const;

const ZOOM_POPUP_PRESET_PERCENTS = [
  25,
  50,
  75,
  100,
  150,
  200,
] as const;

interface ViewportToolbarProps {
  dispatch: EditorStore["dispatch"];
  fitZoom: number;
  onFitToGrid: () => void;
  zoomAnchor: { x: number; y: number } | null;
  viewport: ViewportState;
}

type ZoomPopupItem =
  | { kind: "preset"; percent: (typeof ZOOM_POPUP_PRESET_PERCENTS)[number]; value: string }
  | { kind: "fit"; value: "fit" };

export function ViewportToolbar({
  dispatch,
  onFitToGrid,
  zoomAnchor,
  viewport,
}: ViewportToolbarProps) {
  const zoomPercent = viewport.zoom * 100;
  const zoomLabel = getZoomLabel(zoomPercent);
  const nextZoomIn = getNextZoomInPercent(zoomPercent) / 100;
  const nextZoomOut = getNextZoomOutPercent(zoomPercent) / 100;
  const zoomPopupItems: ZoomPopupItem[] = [
    { kind: "fit", value: "fit" },
    ...ZOOM_POPUP_PRESET_PERCENTS.map((percent) => ({
      kind: "preset" as const,
      percent,
      value: String(percent),
    })),
  ];

  return (
    <Toolbar className={styles.viewportToolbar}>
      <ToolbarGroup  style={{"gap": "2px"}}>
        <ToolbarButton
          type="button"
          variant="ghostNeutral"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() =>
            dispatch(
              createSetViewportZoomCommand(nextZoomOut, zoomAnchor ?? undefined),
            )
          }
        >
          <ToolbarIcon icon="/icons/lucide/zoom-out.svg" />
        </ToolbarButton>
        <ToolbarMeta>
          <SingleSelectDropdown
            ariaLabel="Zoom level"
            items={zoomPopupItems}
            value={String(Math.round(zoomPercent))}
            placeholder={zoomLabel}
            showChevron={false}
            triggerLabel={<strong>{zoomLabel}</strong>}
            triggerVariant="ghost"
            menuStyle={{ background: "var(--zoom-menu-bg)" }}
            menuPlacement="top-start"
            menuOffset={8}
            minWidth="auto"
            menuWidth={96}
            getItemValue={(item) => item.value}
            getItemLabel={(item) =>
              item.kind === "fit" ? `Fit` : `${item.percent}%`
            }
            onValueChange={(_value, item) => {
              if (item.kind === "fit") {
                onFitToGrid();
                return;
              }

              dispatch(
                createSetViewportZoomCommand(
                  item.percent / 100,
                  zoomAnchor ?? undefined,
                ),
              );
            }}
            wrapperStyle={{ width: "fit-content"}}
            triggerStyle={{
              minWidth: "auto",
              padding: "6px 8px",
              fontWeight: 700,
            }}
          />
        </ToolbarMeta>
        <ToolbarButton
          type="button"
          variant="ghostNeutral"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() =>
            dispatch(
              createSetViewportZoomCommand(nextZoomIn, zoomAnchor ?? undefined),
            )
          }
        >
          <ToolbarIcon icon="/icons/lucide/zoom-in.svg" />
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
}

function getZoomLabel(zoomPercent: number): string {
  return `${Math.round(zoomPercent)}%`;
}

function getNextZoomInPercent(zoomPercent: number): number {
  for (const preset of ZOOM_BUTTONS_PRESET_PERCENTS) {
    if (preset > zoomPercent) {
      return preset;
    }
  }

  return ZOOM_BUTTONS_PRESET_PERCENTS[ZOOM_BUTTONS_PRESET_PERCENTS.length - 1];
}

function getNextZoomOutPercent(zoomPercent: number): number {
  for (let index = ZOOM_BUTTONS_PRESET_PERCENTS.length - 1; index >= 0; index -= 1) {
    const preset = ZOOM_BUTTONS_PRESET_PERCENTS[index];

    if (preset < zoomPercent) {
      return preset;
    }
  }

  return ZOOM_BUTTONS_PRESET_PERCENTS[0];
}
