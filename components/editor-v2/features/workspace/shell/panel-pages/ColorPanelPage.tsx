"use client";

import {
  Button,
  CheckboxField,
} from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import type {
  EditorStore,
  PaletteColor,
} from "@/lib/editor-v2/editor/store";
import {
  createSetActiveColorCommand,
  createSetGridlinesVisibleCommand,
  createSetRulerVisibleCommand,
} from "../../workspaceCommands";
import { UsedColorsSummary } from "../UsedColorsSummary";
import styles from "../EditorV2Shell.module.css";

interface ColorPanelPageProps {
  activeColor: PaletteColor | null;
  activeColorId: string | null;
  colorsById: Record<string, PaletteColor>;
  dispatch: EditorStore["dispatch"];
  palette: PaletteColor[];
  showGridlines: boolean;
  showRuler: boolean;
  usedColors: Array<{ colorId: string; count: number }>;
}

export function ColorPanelPage({
  activeColor,
  activeColorId,
  colorsById,
  dispatch,
  palette,
  showGridlines,
  showRuler,
  usedColors,
}: ColorPanelPageProps) {
  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <div className={styles.sidebarSubsection}>
          <div className={styles.metaRow} style={typographyStyles.p2}>
            <span>Active:</span>
            <strong className={styles.activeColorValue}>
              {activeColor ? `${activeColor.name} (${activeColor.code})` : "None selected"}
            </strong>
          </div>
          <div className={styles.colorRow}>
            {palette.map((color) => {
              const selected = color.id === activeColorId;
              return (
                <Button
                  key={color.id}
                  type="button"
                  onClick={() => dispatch(createSetActiveColorCommand(color.id))}
                  variant="ghostV2"
                  size="sm"
                  active={selected}
                  inertWhenActive
                  className={styles.colorButton}
                >
                  <span
                    aria-hidden="true"
                    className={styles.swatch}
                    style={{ backgroundColor: color.hex }}
                  />
                  <span style={typographyStyles.p2}>{color.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className={styles.sidebarSubsection}>
          <UsedColorsSummary usedColors={usedColors} colorsById={colorsById} />
        </div>

        <div className={styles.sidebarSubsection}>
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
        </div>
      </div>
    </section>
  );
}
