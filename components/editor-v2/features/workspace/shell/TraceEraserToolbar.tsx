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
import type { EraserEditMode, EraserMode } from "@/lib/editor-v2/editor/magicWand";
import styles from "./EditorV2Shell.module.css";

interface TraceEraserToolbarProps {
  brushSize: number;
  canRedo: boolean;
  canUndo: boolean;
  editMode: EraserEditMode;
  mode: EraserMode;
  onBrushSizeChange: (brushSize: number) => void;
  onCancel: () => void;
  onCommit: () => void;
  onEditModeChange: (mode: EraserEditMode) => void;
  onModeChange: (mode: EraserMode) => void;
  onPreviewVisibilityChange: (visible: boolean) => void;
  onRedo: () => void;
  onUndo: () => void;
}

export function TraceEraserToolbar({
  brushSize,
  canRedo,
  canUndo,
  editMode,
  mode,
  onBrushSizeChange,
  onCancel,
  onCommit,
  onEditModeChange,
  onModeChange,
  onPreviewVisibilityChange,
  onRedo,
  onUndo,
}: TraceEraserToolbarProps) {
  const brushSizeSliderValue = Number.isFinite(brushSize)
    ? Math.min(Math.max(brushSize, 1), 10)
    : 1;
  const brushSizePercent = Math.round(1 + ((brushSizeSliderValue - 1) / 9) * 99);

  return (
    <div className={styles.selectionToolbarCluster}>
      <div className={styles.selectionToolbarMainViewport}>
        <Toolbar className={styles.floatingToolbar}>
          <ToolbarGroup>
            <SegmentedControl
              ariaLabel="Trace eraser edit mode"
              value={editMode}
              onChange={(value) => onEditModeChange(value as EraserEditMode)}
              options={[
                { label: "Brush", value: "brush" },
                { label: "Magic", value: "magic" },
              ]}
            />
            <ToolbarDivider />
            <SegmentedControl
              ariaLabel="Trace eraser mode"
              value={mode}
              onChange={(value) => onModeChange(value as EraserMode)}
              options={[
                { label: "Erase", value: "erase" },
                { label: "Restore", value: "restore", disabled: editMode === "magic" },
              ]}
            />
            {editMode === "brush" ? (
              <>
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
                        const nextBrushSize = Math.min(Math.max(nextSliderValue, 1), 10);

                        if (Math.abs(nextBrushSize - brushSizeSliderValue) < 0.001) {
                          return;
                        }

                        onBrushSizeChange(nextBrushSize);
                      }}
                      style={{ width: "100%", maxWidth: "none" }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <ToolbarDivider />
            )}
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
