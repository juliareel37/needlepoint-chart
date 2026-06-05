"use client";

import { typographyStyles } from "@/app/design-system/typography";
import {
  ButtonIcon,
} from "@/components/design-system";
import { useThemeMode } from "@/components/editor-v2/app/useThemeMode";
import { useAuthStatus } from "@/lib/auth/client";
import type {
  EditorStore,
} from "@/lib/editor-v2/editor/store";
import { CanvasAidsControls, SegmentedChoiceSetting } from "../CanvasAidsControls";
import styles from "../EditorV2Shell.module.css";

interface SettingsPanelPageProps {
  dispatch: EditorStore["dispatch"];
  previewMode: boolean;
  previewModeDisabled?: boolean;
  showGridlines: boolean;
  isBottomPanelLayout: boolean;
  showRuler: boolean;
  showSymbols: boolean;
  touchSnappingEnabled: boolean;
}

export function SettingsPanelPage({
  dispatch,
  previewMode,
  previewModeDisabled = false,
  showGridlines,
  isBottomPanelLayout,
  showRuler,
  showSymbols,
  touchSnappingEnabled,
}: SettingsPanelPageProps) {
  const { isSignedIn } = useAuthStatus();
  const { themeMode, setThemeMode } = useThemeMode();

  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        {!isSignedIn ? (
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
                      <span className={styles.screenReaderOnly}>Light</span>
                    </>
                  ),
                  value: "light",
                },
                {
                  label: (
                    <>
                      <ButtonIcon icon="/icons/lucide/monitor.svg" />
                      <span className={styles.screenReaderOnly}>System</span>
                    </>
                  ),
                  value: "system",
                },
                {
                  label: (
                    <>
                      <ButtonIcon icon="/icons/lucide/moon.svg" />
                      <span className={styles.screenReaderOnly}>Dark</span>
                    </>
                  ),
                  value: "dark",
                },
              ]}
              className={styles.themeControl}
              itemClassName={styles.themeControlItem}
              onChange={(nextValue) => setThemeMode(nextValue)}
            />
          </div>
        ) : null}

        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarCanvasAidsHeader}>
            <h3 style={typographyStyles.h5}>Canvas Aids</h3>
          </div>
          {isBottomPanelLayout ? (
            <CanvasAidsControls
              dispatch={dispatch}
              showGridlines={showGridlines}
              showRuler={showRuler}
              showSymbols={showSymbols}
              touchSnappingEnabled={touchSnappingEnabled}
            />
          ) : (
            <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
              Canvas aids moved to the on-canvas settings control next to zoom.
            </p>
          )}
          {/* <SegmentedChoiceSetting
            label="Mode"
            value={previewMode ? "preview" : "edit"}
            ariaLabel="Canvas mode"
            disabled={previewModeDisabled}
            options={[
              { label: "Edit", value: "edit" },
              { label: "Preview", value: "preview" },
            ]}
            onChange={(nextValue) =>
              dispatch(createSetPreviewModeCommand(nextValue === "preview"))
            }
          /> */}
        </div>
      </div>
    </section>
  );
}
