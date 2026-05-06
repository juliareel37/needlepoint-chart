"use client";

import { useEffect, useState, type ReactNode } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { SegmentedControl } from "@/components/design-system";
import type { EditorStore } from "@/lib/editor-v2/editor/store";
import {
  createSetGridlinesVisibleCommand,
  createSetRulerVisibleCommand,
  createSetSymbolsVisibleCommand,
  createSetTouchSnappingEnabledCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

interface CanvasAidsControlsProps {
  dispatch: EditorStore["dispatch"];
  showGridlines: boolean;
  showRuler: boolean;
  showSymbols: boolean;
  touchSnappingEnabled: boolean;
}

export function CanvasAidsControls({
  dispatch,
  showGridlines,
  showRuler,
  showSymbols,
  touchSnappingEnabled,
}: CanvasAidsControlsProps) {
  const [touchPrimaryInput, setTouchPrimaryInput] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const coarsePointerQuery = window.matchMedia("(any-pointer: coarse)");
    const primaryCoarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const update = () => {
      const hasTouchPoints =
        typeof navigator !== "undefined" && (navigator.maxTouchPoints ?? 0) > 0;
      setTouchPrimaryInput(
        coarsePointerQuery.matches || primaryCoarsePointerQuery.matches || hasTouchPoints,
      );
    };

    update();

    const attach = (query: MediaQueryList) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
      }

      query.addListener(update);
      return () => query.removeListener(update);
    };

    const detachAny = attach(coarsePointerQuery);
    const detachPrimary = attach(primaryCoarsePointerQuery);
    return () => {
      detachAny();
      detachPrimary();
    };
  }, []);

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
      {touchPrimaryInput ? (
        <SegmentedBooleanSetting
          label="Snapping"
          value={touchSnappingEnabled}
          ariaLabel="Touch snapping"
          options={{ hide: "Off", show: "On" }}
          onChange={(nextChecked) =>
            dispatch(createSetTouchSnappingEnabledCommand(nextChecked))
          }
        />
      ) : null}
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
