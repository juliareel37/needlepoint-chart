"use client";

import {
  CheckboxField,
} from "@/components/design-system";
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
  return (
    <div className={styles.sidebarSubsection}>
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
