"use client";

import { useState } from "react";
import {
  Button,
  Field,
  FieldSelect,
} from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import type {
  EditorStore,
  PaletteColor,
} from "@/lib/editor-v2/editor/store";
import {
  createSetActiveColorCommand,
  createSwapPaletteColorCommand,
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
  const [swapFromColorId, setSwapFromColorId] = useState("");
  const [swapToColorId, setSwapToColorId] = useState("");
  const canSwap =
    swapFromColorId !== "" &&
    swapToColorId !== "" &&
    swapFromColorId !== swapToColorId;

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
                  variant="ghost"
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
                  {/* <span style={typographyStyles.p2}>{color.name}</span> */}
                </Button>
              );
            })}
          </div>
        </div>

        <div className={styles.sidebarSubsection}>
          <UsedColorsSummary usedColors={usedColors} colorsById={colorsById} />
        </div>

        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Swap color</h3>
            <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
              Change painted cells from one used color to a library color.
            </p>
          </div>
          <Field label="Used color">
            <FieldSelect
              value={swapFromColorId}
              onChange={(event) => setSwapFromColorId(event.target.value)}
              disabled={usedColors.length === 0}
            >
              <option value="">Choose used color</option>
              {usedColors.map((entry) => {
                const color = colorsById[entry.colorId];

                return (
                  <option key={entry.colorId} value={entry.colorId}>
                    {color ? `${color.name} (${color.code})` : entry.colorId} - {entry.count}
                  </option>
                );
              })}
            </FieldSelect>
          </Field>
          <Field label="Library color">
            <FieldSelect
              value={swapToColorId}
              onChange={(event) => setSwapToColorId(event.target.value)}
              disabled={palette.length === 0}
            >
              <option value="">Choose library color</option>
              {palette.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name} ({color.code})
                </option>
              ))}
            </FieldSelect>
          </Field>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!canSwap}
            onClick={() => {
              if (!canSwap) {
                return;
              }

              dispatch(createSwapPaletteColorCommand(swapFromColorId, swapToColorId));
              setSwapFromColorId("");
              setSwapToColorId("");
            }}
          >
            Swap color
          </Button>
        </div>
      </div>
    </section>
  );
}
