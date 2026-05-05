"use client";

import type { ReactNode } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { SegmentedControl } from "@/components/design-system";
import type { EditorStore } from "@/lib/editor-v2/editor/store";
import {
  createSetGridlinesVisibleCommand,
  createSetRulerVisibleCommand,
  createSetSymbolsVisibleCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

interface CanvasAidsControlsProps {
  dispatch: EditorStore["dispatch"];
  showGridlines: boolean;
  showRuler: boolean;
  showSymbols: boolean;
}

export function CanvasAidsControls({
  dispatch,
  showGridlines,
  showRuler,
  showSymbols,
}: CanvasAidsControlsProps) {
  return (
    <>
      <SegmentedBooleanSetting
        label="Grid lines"
        value={showGridlines}
        ariaLabel="Grid lines visibility"
        onChange={(nextChecked) => dispatch(createSetGridlinesVisibleCommand(nextChecked))}
      />
      <SegmentedBooleanSetting
        label="Ruler"
        value={showRuler}
        ariaLabel="Ruler visibility"
        onChange={(nextChecked) => dispatch(createSetRulerVisibleCommand(nextChecked))}
      />
      <SegmentedBooleanSetting
        label="Color symbols"
        value={showSymbols}
        ariaLabel="Symbols visibility"
        onChange={(nextChecked) => dispatch(createSetSymbolsVisibleCommand(nextChecked))}
      />
    </>
  );
}

function SegmentedBooleanSetting({
  ariaLabel,
  label,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  label: string;
  onChange: (next: boolean) => void;
  options?: {
    hide: ReactNode;
    show: ReactNode;
  };
  value: boolean;
}) {
  return (
    <SegmentedChoiceSetting
      label={label}
      value={value ? "show" : "hide"}
      ariaLabel={ariaLabel}
      options={[
        { label: options?.show ?? "Show", value: "show" },
        { label: options?.hide ?? "Hide", value: "hide" },
      ]}
      onChange={(nextValue) => onChange(nextValue === "show")}
    />
  );
}

export function SegmentedChoiceSetting<T extends string>({
  ariaLabel,
  disabled = false,
  label,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  disabled?: boolean;
  label: ReactNode;
  onChange: (next: T) => void;
  options: { label: ReactNode; value: T }[];
  value: T;
}) {
  return (
    <div className={styles.settingsControlGroup}>
      <span className={styles.settingsControlLabel} style={typographyStyles.p2}>
        {label}
      </span>
      <SegmentedControl
        ariaLabel={ariaLabel}
        disabled={disabled}
        options={options}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
