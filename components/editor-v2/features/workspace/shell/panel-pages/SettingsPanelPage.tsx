"use client";

import {
  CheckboxField,
  Field,
  Toggle,
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
    <div className={styles.sidebarSubsection}>
      <Field
        // label="Appearance"
        // hint="Switch the editor chrome between light and dark."
      >
        <Toggle
          checked={themeMode === "dark"}
          aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
          label={themeMode === "dark" ? "Dark mode" : "Light mode"}
          onChange={(nextChecked) => setThemeMode(nextChecked ? "dark" : "light")}
        />
      </Field>
      <CheckboxField
        checked={previewMode}
        onChange={(event) =>
          dispatch(createSetPreviewModeCommand(event.target.checked))
        }
      >
        Preview mode
      </CheckboxField>
      <CheckboxField
        checked={showGridlines}
        onChange={(event) =>
          dispatch(createSetGridlinesVisibleCommand(event.target.checked))
        }
      >
        Show grid lines
      </CheckboxField>
      <CheckboxField
        checked={showRuler}
        onChange={(event) =>
          dispatch(createSetRulerVisibleCommand(event.target.checked))
        }
      >
        Show ruler
      </CheckboxField>
      <CheckboxField
        checked={showSymbols}
        onChange={(event) =>
          dispatch(createSetSymbolsVisibleCommand(event.target.checked))
        }
      >
        Show symbols
      </CheckboxField>
    </div>
  );
}
