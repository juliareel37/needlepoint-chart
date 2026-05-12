"use client";

import { useMemo } from "react";
import {
  SegmentedControl,
  Slider,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarIcon,
} from "@/components/design-system";
import styles from "./EditorV2Shell.module.css";

interface TraceEraserToolbarProps {
  brushSize: number;
  mode: "erase" | "restore";
  onBrushSizeChange: (brushSize: number) => void;
  onCancel: () => void;
  onCommit: () => void;
  onModeChange: (mode: "erase" | "restore") => void;
}

export function TraceEraserToolbar({
  brushSize,
  mode,
  onBrushSizeChange,
  onCancel,
  onCommit,
  onModeChange,
}: TraceEraserToolbarProps) {
  const brushLabel = useMemo(() => `${Math.round(brushSize)} px`, [brushSize]);

  return (
    <div className={styles.selectionToolbarCluster}>
      <div className={styles.selectionToolbarMainViewport}>
        <Toolbar className={styles.floatingToolbar}>
          <ToolbarGroup>
            <SegmentedControl
              ariaLabel="Trace eraser mode"
              value={mode}
              onChange={(value) => onModeChange(value as "erase" | "restore")}
              options={[
                { label: "Erase", value: "erase" },
                { label: "Restore", value: "restore" },
              ]}
            />
            <ToolbarDivider />
            <div className={styles.traceEraserToolbarSlider}>
              <ToolbarIcon icon="/icons/lucide/brush_thick.svg" />
              <Slider
                className={styles.traceEraserToolbarSliderInput}
                min="4"
                max="96"
                step="1"
                value={brushSize}
                aria-label="Eraser brush size"
                onChange={(event) => onBrushSizeChange(Number(event.currentTarget.value))}
              />
              <span className={styles.traceEraserToolbarSliderValue}>{brushLabel}</span>
            </div>
            <ToolbarDivider />
            <ToolbarButton type="button" variant="secondary" textOnly onClick={onCancel}>
              Cancel
            </ToolbarButton>
            <ToolbarButton type="button" variant="primary" textOnly onClick={onCommit}>
              Apply
            </ToolbarButton>
          </ToolbarGroup>
        </Toolbar>
      </div>
    </div>
  );
}
