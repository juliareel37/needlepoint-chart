"use client";

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
  canRedo: boolean;
  canUndo: boolean;
  mode: "erase" | "restore";
  onBrushSizeChange: (brushSize: number) => void;
  onCancel: () => void;
  onCommit: () => void;
  onModeChange: (mode: "erase" | "restore") => void;
  onPreviewVisibilityChange: (visible: boolean) => void;
  onRedo: () => void;
  onUndo: () => void;
}

export function TraceEraserToolbar({
  brushSize,
  canRedo,
  canUndo,
  mode,
  onBrushSizeChange,
  onCancel,
  onCommit,
  onModeChange,
  onPreviewVisibilityChange,
  onRedo,
  onUndo,
}: TraceEraserToolbarProps) {
  const normalizedBrushSize = Number.isFinite(brushSize)
    ? Math.min(Math.max(Math.round(brushSize), 1), 10)
    : 1;
  const brushSizeSliderValue = brushSize;
  const brushSizePercent = Math.round(1 + ((brushSizeSliderValue - 1) / 9) * 99);
  const brushSizeTooltipPercent = ((brushSizeSliderValue - 1) / 9) * 100;

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
            <div
              style={{
                display: "flex",
                gap: 15,
                alignItems: "center",
                flexWrap: "nowrap",
                padding: "6px 8px",
              }}
            >
              <ToolbarIcon icon="/icons/other/stroke-width.svg" />
              <div className={styles.traceSliderTooltipWrap} style={{ width: 80, flexShrink: 0 }}>
                <Slider
                  min={1}
                  max={10}
                  step={0.05}
                  value={brushSizeSliderValue}
                  aria-label="Eraser brush size"
                  aria-valuetext={`${brushSizePercent}% image-size erase area`}
                  onPointerDown={() => onPreviewVisibilityChange(true)}
                  onPointerUp={() => onPreviewVisibilityChange(false)}
                  onPointerCancel={() => onPreviewVisibilityChange(false)}
                  onBlur={() => onPreviewVisibilityChange(false)}
                  onChange={(event) => {
                    const nextSliderValue = Number(event.currentTarget.value);
                    const nextBrushSize = Math.min(Math.max(Math.round(nextSliderValue), 1), 10);

                    if (nextBrushSize === normalizedBrushSize) {
                      return;
                    }

                    onBrushSizeChange(nextBrushSize);
                  }}
                  style={{ width: "100%", maxWidth: "none" }}
                />
              </div>
            </div>
            <ToolbarDivider />
            <ToolbarButton
              type="button"
              variant="secondary"
              disabled={!canUndo}
              onClick={onUndo}
              aria-label="Undo eraser change"
            >
              <ToolbarIcon icon="/icons/lucide/undo.svg" />
            </ToolbarButton>
            <ToolbarButton
              type="button"
              variant="secondary"
              disabled={!canRedo}
              onClick={onRedo}
              aria-label="Redo eraser change"
            >
              <ToolbarIcon icon="/icons/lucide/redo.svg" />
            </ToolbarButton>
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
