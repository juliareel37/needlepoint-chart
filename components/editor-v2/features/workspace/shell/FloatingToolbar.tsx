"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import {
  Button,
  ButtonIcon,
  Slider,
  Toolbar,
  ToolbarAnchor,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarIcon,
  ToolbarLabel,
  ToolbarPopover,
  ToolbarSubtoolGroup,
  ToolbarSwatch,
} from "@/components/design-system";
import type {
  EditorStore,
  PaletteColor,
  TraceDocument,
} from "@/lib/editor-v2/editor/store";
import {
  createBeginTraceRepositionCommand,
  createClearCanvasCommand,
  createRedoCommand,
  createSetActiveColorCommand,
  createSetActiveSidebarSectionCommand,
  createSetSidebarCollapsedCommand,
  createSetToolCommand,
  createSetBrushSizeCommand,
  createUndoCommand,
  createUpdateTraceCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

function FloatingToolbarPortalPopover({
  anchorRef,
  children,
  subtoolbar = false,
  ...props
}: React.ComponentProps<typeof ToolbarPopover> & {
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    function updatePosition() {
      const anchor = anchorRef.current;

      if (!anchor) {
        setPosition(null);
        return;
      }

      const rect = anchor.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, mounted]);

  if (!mounted || !position) {
    return null;
  }

  return createPortal(
    <ToolbarPopover
      {...props}
      subtoolbar={subtoolbar}
      style={{
        ...props.style,
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 40,
      }}
    >
      {children}
    </ToolbarPopover>,
    document.body,
  );
}

interface FloatingToolbarProps {
  activeColor: PaletteColor | null;
  activeColorId: string | null;
  activeTool: "paint" | "erase" | string;
  brushSize: number;
  canRedo: boolean;
  canUndo: boolean;
  dispatch: EditorStore["dispatch"];
  hasPaintedCells: boolean;
  palette: PaletteColor[];
  trace: TraceDocument | null;
}

export function FloatingToolbar({
  activeColor,
  activeColorId,
  activeTool,
  brushSize,
  canRedo,
  canUndo,
  dispatch,
  hasPaintedCells,
  palette,
  trace,
}: FloatingToolbarProps) {
  const [colorLibraryOpen, setColorLibraryOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [brushSizeTooltipVisible, setBrushSizeTooltipVisible] = useState(false);
  const [imageOpacityTooltipVisible, setImageOpacityTooltipVisible] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const colorAnchorRef = useRef<HTMLDivElement | null>(null);
  const drawAnchorRef = useRef<HTMLDivElement | null>(null);
  const imageAnchorRef = useRef<HTMLDivElement | null>(null);

  const normalizedBrushSize = Number.isFinite(brushSize)
    ? Math.min(Math.max(Math.round(brushSize), 1), 10)
    : 1;
  const brushFootprintSize = normalizedBrushSize;
  const brushFootprintLabel = `${brushFootprintSize}x${brushFootprintSize}`;
  const brushSizeTooltipPercent =
    ((normalizedBrushSize - 1) / 9) * 100;
  const normalizedImageOpacity = trace
    ? Math.min(Math.max(trace.opacity, 0), 1)
    : 0;
  const imageOpacityLabel = `${Math.round(normalizedImageOpacity * 100)}%`;

  const activeSwatchColor = activeColor?.hex ?? "var(--neutral-400)";
  const useImageToolbarReplacement =
    isCompactViewport && Boolean(trace) && imageOpen;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 1080px)");
    const update = () => setIsCompactViewport(mediaQuery.matches);

    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  useEffect(() => {
    if (!brushSizeTooltipVisible) {
      return;
    }

    function handlePointerUp() {
      setBrushSizeTooltipVisible(false);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [brushSizeTooltipVisible]);

  useEffect(() => {
    if (!imageOpacityTooltipVisible) {
      return;
    }

    function handlePointerUp() {
      setImageOpacityTooltipVisible(false);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [imageOpacityTooltipVisible]);

  function openSidebarSection(section: "color" | "trace") {
    dispatch(createSetActiveSidebarSectionCommand(section));
    dispatch(createSetSidebarCollapsedCommand(false));
  }

  function closeImageMenu(): void {
    setImageOpen(false);
    setImageOpacityTooltipVisible(false);
  }

  function closeColorLibrary(): void {
    setColorLibraryOpen(false);
  }

  if (useImageToolbarReplacement && trace) {
    return (
      <Toolbar
        className={[styles.floatingToolbar, styles.floatingToolbarContextual]
          .filter(Boolean)
          .join(" ")}
      >
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
                color: trace.visible ? "inherit" : "var(--text-secondary)",
                opacity: trace.visible ? 1 : 0.45,
              }}
            >
              <ToolbarIcon icon="/icons/lucide/blend.svg" />
              <ToolbarLabel>Opacity</ToolbarLabel>
            </span>
            <div
              className={styles.traceSliderTooltipWrap}
              style={{ width: 80, flexShrink: 0 }}
            >
              <div
                className={[
                  styles.traceSliderTooltip,
                  imageOpacityTooltipVisible && trace.visible
                    ? styles.traceSliderTooltipVisible
                    : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden="true"
                style={{ left: `${normalizedImageOpacity * 100}%` }}
              >
                {imageOpacityLabel}
              </div>
              <Slider
                min="0"
                max="1"
                step="0.05"
                value={normalizedImageOpacity}
                disabled={!trace.visible}
                aria-label="Image opacity"
                aria-valuetext={`${imageOpacityLabel} image opacity`}
                onPointerDown={() => setImageOpacityTooltipVisible(true)}
                onBlur={() => setImageOpacityTooltipVisible(false)}
                onChange={(event) =>
                  dispatch(
                    createUpdateTraceCommand(
                      {
                        opacity: Number(event.currentTarget.value),
                      },
                      { history: { mode: "skip" } },
                    ),
                  )
                }
                style={{ width: "100%", maxWidth: "none" }}
              />
            </div>
          </div>

          <ToolbarDivider />

          <ToolbarButton
            type="button"
            aria-label="Reposition trace"
            title="Reposition trace"
            onClick={() => {
              openSidebarSection("trace");
              closeImageMenu();
              dispatch(createBeginTraceRepositionCommand());
            }}
          >
            <ToolbarIcon icon="/icons/lucide/crop.svg" />
            <ToolbarLabel>Reposition</ToolbarLabel>
          </ToolbarButton>

          <ToolbarDivider />

          <Button
            type="button"
            variant="primary"
            onClick={() => closeImageMenu()}
          >
            Done
          </Button>
{/* 
          <Button
            type="button"
            variant="ghost"
            aria-label="Close image toolbar"
            onClick={() => closeImageMenu()}
          >
            <ButtonIcon icon="/icons/lucide/x.svg" />
          </Button> */}



        </ToolbarGroup>
      </Toolbar>
    );
  }

  return (
    <Toolbar className={styles.floatingToolbar}>
      <ToolbarGroup>
        <ToolbarAnchor ref={colorAnchorRef}>
          <ToolbarButton
            type="button"
            swatch
            active={colorLibraryOpen}
            aria-pressed={colorLibraryOpen}
            aria-label="Open color library"
            title="Open color library"
            onClick={() => {
              setColorLibraryOpen((current) => !current);
              setDrawOpen(false);
              closeImageMenu();
            }}
          >
            <ToolbarSwatch color={activeSwatchColor} />
          </ToolbarButton>

          {colorLibraryOpen ? (
            <FloatingToolbarPortalPopover
              anchorRef={colorAnchorRef}
              role="dialog"
              aria-label="Color library"
              className={styles.colorLibraryPopover}
              style={{ whiteSpace: "normal" }}
            >
              <ColorLibrary
                activeColorId={activeColorId}
                className={styles.toolbarColorLibrary}
                colors={palette}
                onColorSelect={(colorId) => {
                  dispatch(createSetActiveColorCommand(colorId));
                  closeColorLibrary();
                }}
              />
            </FloatingToolbarPortalPopover>
          ) : null}
        </ToolbarAnchor>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          type="button"
          active={activeTool === "pan"}
          inertWhenActive
          aria-pressed={activeTool === "pan"}
          aria-label="Pan"
          title="Pan"
          onClick={() => {
            closeColorLibrary();
            setDrawOpen(false);
            closeImageMenu();
            dispatch(createSetToolCommand("pan"));
          }}
        >
          <ToolbarIcon icon="/icons/lucide/pan.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={activeTool === "paint"}
          aria-pressed={activeTool === "paint"}
          aria-label="Brush"
          title="Brush"
          onClick={() => {
            closeColorLibrary();
            closeImageMenu();
            dispatch(createSetToolCommand(activeTool === "paint" ? "pan" : "paint"));
          }}
        >
          <ToolbarIcon icon="/icons/lucide/brush_thin.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={activeTool === "erase"}
          aria-pressed={activeTool === "erase"}
          aria-label="Erase"
          title="Erase"
          onClick={() => {
            closeColorLibrary();
            closeImageMenu();
            dispatch(createSetToolCommand(activeTool === "erase" ? "pan" : "erase"));
          }}
        >
          <ToolbarIcon icon="/icons/lucide/eraser.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={activeTool === "eyedropper"}
          aria-pressed={activeTool === "eyedropper"}
          aria-label="Eyedropper"
          title="Eyedropper"
          onClick={() => {
            closeColorLibrary();
            closeImageMenu();
            dispatch(createSetToolCommand("eyedropper"));
          }}
        >
          <ToolbarIcon icon="/icons/lucide/dropper.svg" />
        </ToolbarButton>

        <ToolbarAnchor ref={drawAnchorRef}>
          <ToolbarButton
            type="button"
            active={drawOpen}
            aria-pressed={drawOpen}
            aria-label="Brush size"
            title="Brush size"
            onClick={() => {
              setDrawOpen((current) => !current);
              closeColorLibrary();
              closeImageMenu();
            }}
          >
            <ToolbarIcon icon="/icons/other/stroke-width.svg" />
          </ToolbarButton>

          {drawOpen ? (
            <FloatingToolbarPortalPopover
              anchorRef={drawAnchorRef}
              role="dialog"
              aria-label="Draw size"
            >
              <ToolbarSubtoolGroup>
                <div
                  style={{
                    display: "flex",
                    gap: 15,
                    alignItems: "center",
                    flexWrap: "nowrap",
                    padding: "6px 8px",
                  }}
                >
                  <ToolbarLabel>Size</ToolbarLabel>
                  <div
                    className={styles.traceSliderTooltipWrap}
                    style={{ width: 80, flexShrink: 0 }}
                  >
                    <div
                      className={[
                        styles.traceSliderTooltip,
                        brushSizeTooltipVisible
                          ? styles.traceSliderTooltipVisible
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-hidden="true"
                      style={{ left: `${brushSizeTooltipPercent}%` }}
                    >
                      {brushFootprintLabel}
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={normalizedBrushSize}
                      aria-label="Brush size"
                      aria-valuetext={`${brushFootprintLabel} paint area`}
                      onPointerDown={() => setBrushSizeTooltipVisible(true)}
                      onBlur={() => setBrushSizeTooltipVisible(false)}
                      onChange={(e) => {
                        const newSize = Number(e.currentTarget.value);
                        dispatch(
                          createSetBrushSizeCommand(
                            newSize,
                            activeTool === "paint" || activeTool === "erase"
                              ? activeTool
                              : "pan",
                          ),
                        );
                      }}
                      style={{ width: "100%", maxWidth: "none" }}
                    />
                  </div>
                </div>
              </ToolbarSubtoolGroup>
            </FloatingToolbarPortalPopover>
          ) : null}
        </ToolbarAnchor>

        <ToolbarDivider />

        {/*
        <ToolbarButton type="button" disabled>
          <ToolbarIcon icon="/icons/lucide/paint_bucket.svg" />
          <ToolbarLabel>Fill</ToolbarLabel>
        </ToolbarButton>
        */}

        <ToolbarButton
          type="button"
          active={activeTool === "mirror"}
          aria-pressed={activeTool === "mirror"}
          aria-label="Mirror"
          title="Mirror"
          onClick={() => {
            closeColorLibrary();
            setDrawOpen(false);
            closeImageMenu();
            dispatch(createSetToolCommand(activeTool === "mirror" ? "pan" : "mirror"));
          }}
        >
          <ToolbarIcon icon="/icons/flip.svg" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          type="button"
          active={activeTool === "lasso"}
          aria-pressed={activeTool === "lasso"}
          aria-label="Select"
          title="Select"
          onClick={() => {
            closeColorLibrary();
            setDrawOpen(false);
            closeImageMenu();
            dispatch(createSetToolCommand("lasso"));
          }}
        >
          <ToolbarIcon icon="/icons/lucide/vector_square.svg" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarAnchor ref={imageAnchorRef}>
          <ToolbarButton
            type="button"
          active={imageOpen}
          aria-pressed={imageOpen}
          aria-label="Image"
          title="Image"
          onClick={() => {
              closeColorLibrary();
              if (imageOpen) {
                closeImageMenu();
              } else if (isCompactViewport && trace) {
                setImageOpen(true);
              } else {
                setImageOpen(true);
              }
              setDrawOpen(false);
            }}
          >
            <ToolbarIcon icon="/icons/lucide/image.svg" />
          </ToolbarButton>

          {imageOpen ? (
            <FloatingToolbarPortalPopover
              anchorRef={imageAnchorRef}
              subtoolbar
              role="dialog"
              aria-label="Image tools"
            >
              {trace ? (
                <>
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
                    <ToolbarLabel>
                      {trace.visible ? "Visible" : "Hidden"}
                    </ToolbarLabel>
                  </ToolbarButton>

                  <ToolbarDivider />

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
                        color: trace.visible ? "inherit" : "var(--text-secondary)",
                        opacity: trace.visible ? 1 : 0.45,
                      }}
                    >
                      <ToolbarIcon icon="/icons/lucide/blend.svg" />
                      <ToolbarLabel>Opacity</ToolbarLabel>
                    </span>
                    <div
                      className={styles.traceSliderTooltipWrap}
                      style={{ width: 80, flexShrink: 0 }}
                    >
                      <div
                        className={[
                          styles.traceSliderTooltip,
                          imageOpacityTooltipVisible && trace.visible
                            ? styles.traceSliderTooltipVisible
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-hidden="true"
                        style={{ left: `${normalizedImageOpacity * 100}%` }}
                      >
                        {imageOpacityLabel}
                      </div>
                      <Slider
                        min="0"
                        max="1"
                        step="0.05"
                        value={normalizedImageOpacity}
                        disabled={!trace.visible}
                        aria-label="Image opacity"
                        aria-valuetext={`${imageOpacityLabel} image opacity`}
                        onPointerDown={() => setImageOpacityTooltipVisible(true)}
                        onBlur={() => setImageOpacityTooltipVisible(false)}
                        onChange={(event) =>
                          dispatch(
                            createUpdateTraceCommand(
                              {
                                opacity: Number(event.currentTarget.value),
                              },
                              { history: { mode: "skip" } },
                            ),
                          )
                        }
                        style={{ width: "100%", maxWidth: "none" }}
                      />
                    </div>
                  </div>

                  <ToolbarButton
                    type="button"
                    aria-label="Reposition trace"
                    title="Reposition trace"
                    onClick={() => {
                      openSidebarSection("trace");
                      closeImageMenu();
                      dispatch(
                        createBeginTraceRepositionCommand(),
                      );
                    }}
                  >
                    <ToolbarIcon icon="/icons/lucide/crop.svg" />
                    <ToolbarLabel>Reposition</ToolbarLabel>
                  </ToolbarButton>

                  {/*
                  <ToolbarButton type="button" disabled>
                    <ToolbarIcon icon="/icons/lucide/crop.svg" />
                    <ToolbarLabel>Crop</ToolbarLabel>
                  </ToolbarButton>
                  */}
                </>
              ) : (
                <ToolbarButton
                  type="button"
                  primary
                  onClick={() => {
                    openSidebarSection("trace");
                    closeImageMenu();
                  }}
                >
                  <ToolbarIcon icon="/icons/lucide/image.svg" />
                  <ToolbarLabel>Add image</ToolbarLabel>
                  </ToolbarButton>
                )}
            </FloatingToolbarPortalPopover>
          ) : null}
        </ToolbarAnchor>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          type="button"
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo"
          className={styles.historyButton}
          onClick={() => {
            closeColorLibrary();
            dispatch(createUndoCommand());
          }}
        >
          <ToolbarIcon icon="/icons/lucide/undo.svg" />
        </ToolbarButton>
        <ToolbarButton
          type="button"
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo"
          className={styles.historyButton}
          onClick={() => {
            closeColorLibrary();
            dispatch(createRedoCommand());
          }}
        >
          <ToolbarIcon icon="/icons/lucide/redo.svg" />
        </ToolbarButton>

        <ToolbarDivider className={styles.historyDivider} />

        <ToolbarButton
          type="button"
          disabled={!hasPaintedCells}
          aria-label="Clear canvas"
          title="Clear canvas"
          onClick={() => {
            closeColorLibrary();
            if (!hasPaintedCells) {
              return;
            }

            if (!window.confirm("Clear the entire canvas?")) {
              return;
            }

            dispatch(createClearCanvasCommand());
          }}
        >
          <ToolbarIcon icon="/icons/lucide/trash2.svg" />
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
}
