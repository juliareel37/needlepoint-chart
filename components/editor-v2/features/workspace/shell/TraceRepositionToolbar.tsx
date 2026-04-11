"use client";

import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { Button, ButtonIcon, Slider, Toolbar, ToolbarButton, ToolbarDivider, ToolbarGroup, ToolbarIcon, ToolbarLabel } from "@/components/design-system";
import type { EditorStore, TraceDocument } from "@/lib/editor-v2/editor/store";
import {
  createCancelTraceRepositionCommand,
  createCommitTraceRepositionCommand,
  createUpdateTraceCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

interface TraceRepositionToolbarProps {
  dispatch: EditorStore["dispatch"];
  trace: TraceDocument;
}

export function TraceRepositionToolbar({
  dispatch,
  trace,
}: TraceRepositionToolbarProps) {
  const [opacityTooltipVisible, setOpacityTooltipVisible] = useState(false);

  const normalizedImageOpacity = Math.min(Math.max(trace.opacity, 0), 1);
  const imageOpacityLabel = `${Math.round(normalizedImageOpacity * 100)}%`;

  usePointerUpDismiss(opacityTooltipVisible, setOpacityTooltipVisible);

  return (
    <Toolbar className={styles.floatingToolbar}>
      <ToolbarGroup>
        <ToolbarButton
          type="button"
          onClick={() => {
            dispatch(
              createUpdateTraceCommand(
                { visible: !trace.visible },
                { history: { mode: "skip" } },
              ),
            );
          }}
        >
          <ToolbarIcon
            icon={trace.visible ? "/icons/eye.svg" : "/icons/eye_off.svg"}
          />
          <ToolbarLabel>{trace.visible ? "Visible" : "Hidden"}</ToolbarLabel>
        </ToolbarButton>

        <ToolbarDivider />

        <TraceToolbarSliderField
          ariaLabel="Image opacity"
          disabled={!trace.visible}
          icon="/icons/lucide/blend.svg"
          label="Opacity"
          labelMuted={!trace.visible}
          tooltipLabel={imageOpacityLabel}
          tooltipLeftPercent={normalizedImageOpacity * 100}
          tooltipVisible={opacityTooltipVisible && trace.visible}
          value={normalizedImageOpacity}
          min="0"
          max="1"
          step="0.05"
          valueText={`${imageOpacityLabel} image opacity`}
          onTooltipVisibleChange={setOpacityTooltipVisible}
          onChange={(event) => {
            dispatch(
              createUpdateTraceCommand(
                { opacity: Number(event.currentTarget.value) },
                { history: { mode: "skip" } },
              ),
            );
          }}
        />

        <ToolbarDivider />

       
<div
style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "nowrap",
        padding: "6px 8px",
      }}>
        <Button 
            type="button" 
            variant="primary" 
            onClick={() => dispatch(createCommitTraceRepositionCommand())}>
          Done
        </Button>
        <Button style={{padding:"6px",}}
            type="button" 
            variant="ghost" 
            onClick={() => dispatch(createCancelTraceRepositionCommand())}>
          <ButtonIcon
            icon="/icons/lucide/x.svg"
          />
        </Button>
        
       
</div>
         

      </ToolbarGroup>
    </Toolbar>
  );
}

function usePointerUpDismiss(
  isOpen: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerUp() {
      setOpen(false);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [isOpen, setOpen]);
}

function TraceToolbarSliderField({
  ariaLabel,
  disabled = false,
  icon,
  label,
  labelMuted = false,
  max,
  min,
  onChange,
  onTooltipVisibleChange,
  step,
  tooltipLabel,
  tooltipLeftPercent,
  tooltipVisible,
  value,
  valueText,
}: {
  ariaLabel: string;
  disabled?: boolean;
  icon?: string;
  label: string;
  labelMuted?: boolean;
  max: number | string;
  min: number | string;
  onChange: ComponentProps<typeof Slider>["onChange"];
  onTooltipVisibleChange: Dispatch<SetStateAction<boolean>>;
  step: number | string;
  tooltipLabel: string;
  tooltipLeftPercent: number;
  tooltipVisible: boolean;
  value: number | string;
  valueText?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "nowrap",
        padding: "6px 8px",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          color: labelMuted ? "var(--text-secondary)" : "inherit",
          opacity: labelMuted ? 0.45 : 1,
        }}
      >
        {icon ? <ToolbarIcon icon={icon} /> : null}
        <ToolbarLabel>{label}</ToolbarLabel>
      </span>
      <div
        className={styles.traceSliderTooltipWrap}
        style={{ width: 80, flexShrink: 0 }}
      >
        <div
          className={[
            styles.traceSliderTooltip,
            tooltipVisible ? styles.traceSliderTooltipVisible : null,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
          style={{ left: `${tooltipLeftPercent}%` }}
        >
          {tooltipLabel}
        </div>
        <Slider
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-valuetext={valueText}
          onPointerDown={() => onTooltipVisibleChange(true)}
          onChange={onChange}
          className={styles.traceSliderFullWidth}
        />
      </div>
    </div>
  );
}
