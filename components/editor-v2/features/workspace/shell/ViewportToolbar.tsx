"use client";

import { typographyStyles } from "@/app/design-system/typography";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarIcon,
  ToolbarMeta,
} from "@/components/design-system";
import type { EditorStore, ViewportState } from "@/lib/editor-v2/editor/store";
import { createSetViewportZoomCommand } from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

const ZOOM_PRESET_PERCENTS = [
  1,
  2,
  5,
  10,
  25,
  50,
  100,
  200,
  400,
  800,
] as const;

interface ViewportToolbarProps {
  dispatch: EditorStore["dispatch"];
  fitZoom: number;
  onFitToGrid: () => void;
  zoomAnchor: { x: number; y: number } | null;
  viewport: ViewportState;
}

export function ViewportToolbar({
  dispatch,
  fitZoom: _fitZoom,
  onFitToGrid,
  zoomAnchor,
  viewport,
}: ViewportToolbarProps) {
  const zoomPercent = viewport.zoom * 100;
  const zoomLabel = getZoomLabel(zoomPercent);
  const nextZoomIn = getNextZoomInPercent(zoomPercent) / 100;
  const nextZoomOut = getNextZoomOutPercent(zoomPercent) / 100;

  return (
    <Toolbar className={styles.viewportToolbar}>
      <ToolbarGroup>
        <ToolbarButton
          type="button"
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
        <ToolbarMeta style={typographyStyles.p2}>
          <strong>{zoomLabel}</strong>
        </ToolbarMeta>
        <ToolbarButton
          type="button"
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
        <ToolbarButton
          type="button"
          aria-label="Fit grid"
          title="Fit grid"
          onClick={onFitToGrid}
        >
          Fit
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
}

function getZoomLabel(zoomPercent: number): string {
  return `${Math.round(zoomPercent)}%`;
}

function getNextZoomInPercent(zoomPercent: number): number {
  for (const preset of ZOOM_PRESET_PERCENTS) {
    if (preset > zoomPercent) {
      return preset;
    }
  }

  return ZOOM_PRESET_PERCENTS[ZOOM_PRESET_PERCENTS.length - 1];
}

function getNextZoomOutPercent(zoomPercent: number): number {
  for (let index = ZOOM_PRESET_PERCENTS.length - 1; index >= 0; index -= 1) {
    const preset = ZOOM_PRESET_PERCENTS[index];

    if (preset < zoomPercent) {
      return preset;
    }
  }

  return ZOOM_PRESET_PERCENTS[0];
}
