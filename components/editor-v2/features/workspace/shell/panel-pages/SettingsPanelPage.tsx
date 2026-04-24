"use client";

import type { ReactNode } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import {
  ButtonIcon,
  SegmentedControl,
} from "@/components/design-system";
import { useThemeMode } from "@/components/editor-v2/app/useThemeMode";
import type {
  EditorStore,
} from "@/lib/editor-v2/editor/store";
import {
  createSetGridlinesVisibleCommand,
  createSetPreviewModeCommand,
  createSetRulerVisibleCommand,
  createSetSymbolsVisibleCommand,
} from "../../workspaceCommands";
import styles from "../EditorV2Shell.module.css";

interface SettingsPanelPageProps {
  dispatch: EditorStore["dispatch"];
  previewMode: boolean;
  showGridlines: boolean;
  showRuler: boolean;
  showSymbols: boolean;
}

export function SettingsPanelPage({
  dispatch,
  previewMode,
  showGridlines,
  showRuler,
  showSymbols,
}: SettingsPanelPageProps) {
  const { themeMode, setThemeMode } = useThemeMode();

  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
             <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>App Theme</h3>
          </div>
          <SegmentedChoiceSetting
            label="Theme"
            value={themeMode}
            ariaLabel="Application theme"
            options={[
              {
                label: (
                  <>
                    <ButtonIcon icon="/icons/lucide/sun.svg" />
                    Light
                  </>
                ),
                value: "light",
              },
              {
                label: (
                  <>
                    <ButtonIcon icon="/icons/lucide/moon.svg" />
                    Dark
                  </>
                ),
                value: "dark",
              },
            ]}
            onChange={(nextValue) => setThemeMode(nextValue)}
          />
        </div>
      </div>
        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Canvas Aids</h3>
          </div>
          {/* <SegmentedBooleanSetting
            label="Preview mode"
            value={previewMode}
            ariaLabel="Preview mode"
            onChange={(nextChecked) => dispatch(createSetPreviewModeCommand(nextChecked))}
          /> */}
          <SegmentedBooleanSetting
            label="Grid lines"
            value={showGridlines}
            ariaLabel="Grid lines visibility"
            options={{
              show: (
                <>
                  <ButtonIcon icon="/icons/other/noun-grid.svg" />
                  Show
                </>
              ),
              hide: (
                <>
                  <ButtonIcon icon="/icons/other/noun-grid-off.svg" />
                  Hide
                </>
              ),
            }}
            onChange={(nextChecked) => dispatch(createSetGridlinesVisibleCommand(nextChecked))}
          />
          <SegmentedBooleanSetting
            label="Ruler"
            value={showRuler}
            ariaLabel="Ruler visibility"
                        options={{
              show: (
                <>
                  <ButtonIcon icon="/icons/lucide/ruler.svg" />
                  Show
                </>
              ),
              hide: (
                <>
                  <ButtonIcon icon="/icons/other/ruler-off.svg" />
                  Hide
                </>
              ),
            }}
            onChange={(nextChecked) => dispatch(createSetRulerVisibleCommand(nextChecked))}
          />
        {/* </div>

        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Colors</h3>
          </div> */}
          <SegmentedBooleanSetting
            label="Color Symbol Key"
            value={showSymbols}
            ariaLabel="Symbols visibility"
            options={{
              show: (
                <>
                  <ButtonIcon icon="/icons/other/glyphs2.svg" />
                  Show
                </>
              ),
              hide: (
                <>
                  <ButtonIcon icon="/icons/other/glyphs2-off.svg" />
                  Hide
                </>
              ),
            }}
            onChange={(nextChecked) => dispatch(createSetSymbolsVisibleCommand(nextChecked))}
          />
        </div>

   
    </section>
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

function SegmentedChoiceSetting<T extends string>({
  ariaLabel,
  label,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
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
        options={options}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
