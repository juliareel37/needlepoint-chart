"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import {
  Button,
  ButtonIcon,
  Modal,
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
  ActiveTool,
  EditorStore,
  GridPoint,
  GridRect,
  PaletteColor,
  SelectionState,
  TraceDocument,
} from "@/lib/editor-v2/editor/store";
import {
  createBeginTraceRepositionCommand,
  createClearCanvasCommand,
  createClearSelectionCommand,
  createEraseCellsCommand,
  createPaintCellsCommand,
  createRedoCommand,
  createSetActiveColorCommand,
  createSetActiveSidebarSectionCommand,
  createSetSidebarCollapsedCommand,
  createSetSelectionShapeCommand,
  createSetToolCommand,
  createSetToolWithColorCommand,
  createSetBrushSizeCommand,
  createUndoCommand,
  createUpdateTraceCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

function FloatingToolbarPortalPopover({
  anchorRef,
  align = "start",
  children,
  clampToViewport = false,
  onRequestClose,
  subtoolbar = false,
  ...props
}: React.ComponentProps<typeof ToolbarPopover> & {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  align?: "start" | "center";
  clampToViewport?: boolean;
  onRequestClose?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    transform: string;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

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
      const popoverWidth = popoverRef.current?.offsetWidth ?? 0;
      const viewportPadding = 12;
      const centeredLeft = rect.left + rect.width / 2;
      const startLeft = rect.left - 12;

      let left = align === "center" ? centeredLeft : startLeft;
      let transform = align === "center" ? "translateX(-50%)" : "none";

      if (clampToViewport && popoverWidth > 0) {
        const desiredLeft =
          align === "center" ? centeredLeft - popoverWidth / 2 : startLeft;
        const maxLeft = Math.max(
          viewportPadding,
          window.innerWidth - viewportPadding - popoverWidth,
        );
        left = Math.min(Math.max(desiredLeft, viewportPadding), maxLeft);
        transform = "none";
      }

      setPosition({
        top: rect.bottom + 8,
        left,
        transform,
      });
    }

    updatePosition();

    const frame = window.requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, anchorRef, clampToViewport, mounted]);

  useEffect(() => {
    if (!mounted || !onRequestClose) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (popoverRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return;
      }

      onRequestClose?.();
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [anchorRef, mounted, onRequestClose]);

  if (!mounted || !position) {
    return null;
  }

  return createPortal(
    <ToolbarPopover
      {...props}
      ref={popoverRef}
      subtoolbar={subtoolbar}
      style={{
        ...props.style,
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 40,
        transform: position.transform,
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
  activeTool: ActiveTool;
  brushSize: number;
  canRedo: boolean;
  canUndo: boolean;
  dispatch: EditorStore["dispatch"];
  hasPaintedCells: boolean;
  palette: PaletteColor[];
  selectionBounds: GridRect | null;
  selectionCommitted: boolean;
  selectionShape: SelectionState["shape"];
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
  selectionBounds,
  selectionCommitted,
  selectionShape,
  trace,
}: FloatingToolbarProps) {
  const [colorLibraryOpen, setColorLibraryOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [brushSizeTooltipVisible, setBrushSizeTooltipVisible] = useState(false);
  const [imageOpacityTooltipVisible, setImageOpacityTooltipVisible] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [touchPrimaryInput, setTouchPrimaryInput] = useState(false);
  const [clearCanvasModalOpen, setClearCanvasModalOpen] = useState(false);
  const colorAnchorRef = useRef<HTMLDivElement | null>(null);
  const drawAnchorRef = useRef<HTMLDivElement | null>(null);
  const imageAnchorRef = useRef<HTMLDivElement | null>(null);
  const selectAnchorRef = useRef<HTMLDivElement | null>(null);
  const selectionTraceOpacityRestoreRef = useRef<number | null>(null);

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
  const canStartNewSelection = Boolean(selectionBounds) || activeTool === "lasso";
  const canEraseSelection = Boolean(selectionCommitted && selectionBounds);
  const selectionVisible = Boolean(selectionBounds) || activeTool === "lasso";
  const selectionLockedToolsDisabled = Boolean(selectionCommitted && selectionBounds);

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
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const coarsePointerQuery = window.matchMedia("(any-pointer: coarse)");
    const hoverPointerQuery = window.matchMedia("(any-hover: hover)");
    const primaryCoarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const primaryHoverQuery = window.matchMedia("(hover: hover)");

    const update = () => {
      const hasTouchPoints =
        typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
      const hasCoarsePointer =
        coarsePointerQuery.matches || primaryCoarsePointerQuery.matches || hasTouchPoints;
      const hasHoverPointer =
        hoverPointerQuery.matches || primaryHoverQuery.matches;

      setTouchPrimaryInput(hasCoarsePointer && !hasHoverPointer);
    };

    update();

    const queries = [
      coarsePointerQuery,
      hoverPointerQuery,
      primaryCoarsePointerQuery,
      primaryHoverQuery,
    ];

    const addListener = (query: MediaQueryList) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
      }

      query.addListener(update);
      return () => query.removeListener(update);
    };

    const cleanups = queries.map(addListener);
    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    if (!touchPrimaryInput || activeTool !== "pan") {
      return;
    }

    dispatch(createSetToolCommand("paint"));
  }, [activeTool, dispatch, touchPrimaryInput]);

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

  useEffect(() => {
    if (!selectionVisible) {
      setSelectOpen(false);
    }
  }, [selectionVisible]);

  useEffect(() => {
    if (!trace) {
      selectionTraceOpacityRestoreRef.current = null;
      return;
    }

    const overrideActive = selectionTraceOpacityRestoreRef.current !== null;
    const shouldTemporarilyReduceTraceOpacity =
      selectOpen &&
      trace.visible &&
      trace.blendMode === "crossfade";

    if (!shouldTemporarilyReduceTraceOpacity) {
      if (!overrideActive) {
        return;
      }

      const restoreOpacity = selectionTraceOpacityRestoreRef.current;
      if (restoreOpacity === null) {
        return;
      }

      dispatch(
        createUpdateTraceCommand(
          { opacity: restoreOpacity },
          { history: { mode: "skip" } },
        ),
      );
      selectionTraceOpacityRestoreRef.current = null;
      return;
    }

    if (!overrideActive) {
      if (trace.opacity < 0.7) {
        return;
      }

      selectionTraceOpacityRestoreRef.current = trace.opacity;
    }

    if (Math.abs(trace.opacity - 0.5) > 0.0001) {
      dispatch(
        createUpdateTraceCommand(
          { opacity: 0.5 },
          { history: { mode: "skip" } },
        ),
      );
    }
  }, [dispatch, selectOpen, trace]);

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

  function closeSelectMenu(): void {
    setSelectOpen(false);
  }

  function buildSelectionCandidateCells(bounds: GridRect): GridPoint[] {
    const cells: GridPoint[] = [];

    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        cells.push({ x, y });
      }
    }

    return cells;
  }

  function handleSelectionButtonClick() {
    closeColorLibrary();
    setDrawOpen(false);
    closeImageMenu();

    if (activeTool === "lasso") {
      if (selectOpen) {
        handleExitSelection();
        return;
      }

      setSelectOpen(true);
      return;
    }

    dispatch(createSetToolCommand("lasso"));
    setSelectOpen(true);
  }

  function handleExitSelection() {
    dispatch(createClearSelectionCommand());
    dispatch(createSetToolCommand("pan"));
    closeSelectMenu();
  }

  function handleDoneSelection() {
    handleExitSelection();
  }

  function handleNewSelection() {
    dispatch(createClearSelectionCommand());
    dispatch(createSetToolCommand("lasso"));
    setSelectOpen(true);
  }

  return (
    <>
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
            className={styles.libraryPopoverSwatchTrigger}
            onClick={() => {
              setColorLibraryOpen((current) => !current);
              setDrawOpen(false);
              closeImageMenu();
            }}
          >
            <ToolbarSwatch
              color={activeSwatchColor}
              className={styles.libraryPopoverSwatch}
            />
          </ToolbarButton>

          {colorLibraryOpen ? (
            <FloatingToolbarPortalPopover
              anchorRef={colorAnchorRef}
              onRequestClose={closeColorLibrary}
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
                  dispatch(
                    selectionVisible
                      ? createSetToolWithColorCommand(activeTool, colorId)
                      : createSetActiveColorCommand(colorId),
                  );
                  closeColorLibrary();
                }}
              />
            </FloatingToolbarPortalPopover>
          ) : null}
        </ToolbarAnchor>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        {touchPrimaryInput ? null : (
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
        )}

        <ToolbarButton
          type="button"
          active={activeTool === "eyedropper"}
          aria-pressed={activeTool === "eyedropper"}
          aria-label="Eyedropper"
          title="Eyedropper"
          disabled={selectionLockedToolsDisabled}
          onClick={() => {
            closeColorLibrary();
            closeImageMenu();
            dispatch(createSetToolCommand("eyedropper"));
          }}
        >
          <ToolbarIcon icon="/icons/lucide/dropper.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={activeTool === "fill"}
          aria-pressed={activeTool === "fill"}
          aria-label="Fill"
          title="Fill"
          onClick={() => {
            closeColorLibrary();
            closeImageMenu();
            dispatch(
              createSetToolCommand(
                activeTool === "fill"
                  ? selectionVisible
                    ? "lasso"
                    : "pan"
                  : "fill",
              ),
            );
          }}
        >
          <ToolbarIcon icon="/icons/lucide/paint_bucket.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={activeTool === "paint"}
          aria-pressed={activeTool === "paint"}
          aria-label="Brush"
          title="Brush"
          disabled={selectionLockedToolsDisabled}
          onClick={() => {
            closeColorLibrary();
            closeImageMenu();
            dispatch(createSetToolCommand(activeTool === "paint" ? "pan" : "paint"));
          }}
        >
          <ToolbarIcon icon="/icons/lucide/brush_thick.svg" />
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
            dispatch(
              createSetToolCommand(
                activeTool === "erase"
                  ? selectionVisible
                    ? "lasso"
                    : "pan"
                  : "erase",
              ),
            );
          }}
        >
          <ToolbarIcon icon="/icons/lucide/eraser.svg" />
        </ToolbarButton>

        <ToolbarAnchor ref={drawAnchorRef}>
          <ToolbarButton
            type="button"
            active={drawOpen}
            aria-pressed={drawOpen}
            aria-label="Brush size"
            title="Brush size"
            disabled={selectionLockedToolsDisabled}
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
              align="center"
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

        <ToolbarButton
          type="button"
          active={activeTool === "mirror"}
          aria-pressed={activeTool === "mirror"}
          aria-label="Mirror"
          title="Mirror"
          disabled={selectionLockedToolsDisabled}
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
        <ToolbarAnchor ref={selectAnchorRef}>
          <ToolbarButton
            type="button"
            active={selectionVisible || selectOpen}
            aria-pressed={selectionVisible || selectOpen}
            aria-label="Select"
            title="Select"
            onClick={handleSelectionButtonClick}
          >
            <ToolbarIcon icon="/icons/lucide/lasso.svg" />
          </ToolbarButton>

          {selectOpen ? (
            <FloatingToolbarPortalPopover
              align="center"
              anchorRef={selectAnchorRef}
              clampToViewport
              subtoolbar
              role="dialog"
              aria-label="Selection tools"
            >
              {/* <ToolbarButton
                type="button"
                active={selectionShape === "freehand"}
                aria-pressed={selectionShape === "freehand"}
                onClick={() => dispatch(createSetSelectionShapeCommand("freehand"))}
              >
                <ToolbarIcon icon="/icons/lucide/lasso-select.svg" />
                <ToolbarLabel>Lasso</ToolbarLabel>
              </ToolbarButton> */}

              <Button
                type="button"
                variant="ghostV2"
                active={selectionShape === "freehand"}
                aria-pressed={selectionShape === "freehand"}
                onClick={() => dispatch(createSetSelectionShapeCommand("freehand"))}
              >
                <ToolbarIcon icon="/icons/lucide/lasso.svg" />
                <ToolbarLabel>Lasso</ToolbarLabel>
              </Button>
      
              <Button
                type="button"
                variant="ghostV2"
                active={selectionShape === "rect"}
                aria-pressed={selectionShape === "rect"}
                onClick={() => dispatch(createSetSelectionShapeCommand("rect"))}
              >
                <ToolbarIcon icon="/icons/lucide/selection.svg" />
                <ToolbarLabel>Rectangle</ToolbarLabel>
              </Button>
              {/* <ToolbarButton
                type="button"
                active={selectionShape === "rect"}
                aria-pressed={selectionShape === "rect"}
                onClick={() => dispatch(createSetSelectionShapeCommand("rect"))}
              >
                <ToolbarIcon icon="/icons/lucide/square-mouse-pointer.svg" />
                <ToolbarLabel>Rectangle</ToolbarLabel>
              </ToolbarButton> */}

              <ToolbarDivider />

              <Button
                type="button"
                variant="secondary"
                disabled={!selectionCommitted}
                onClick={handleNewSelection}
              >
                Unselect
                {/* <ButtonIcon icon="/icons/lucide/x.svg" /> */}
              </Button>

              <ToolbarDivider />
{/* 
              <ToolbarButton
                type="button"
                disabled={!canEraseSelection}
                onClick={() => {
                  if (!selectionBounds) {
                    return;
                  }

                  dispatch(
                    createEraseCellsCommand(
                      buildSelectionCandidateCells(selectionBounds),
                    ),
                  );
                }}
              >
                <ToolbarIcon icon="/icons/lucide/eraser.svg" />
                <ToolbarLabel>Erase</ToolbarLabel>
              </ToolbarButton> */}

              {/* <ToolbarDivider /> */}

              {/* <Button
                type="button"
                variant="secondary"
                onClick={handleExitSelection}
              >
                Cancel
              </Button> */}

              {/* <Button
                type="button"
                variant="primary"
                onClick={handleDoneSelection}
              >
                Done
              </Button> */}

               <Button
                type="button"
                variant="toolbarX"
                onClick={handleExitSelection}
              >
                <ButtonIcon icon="/icons/lucide/x.svg" />
              </Button>

            </FloatingToolbarPortalPopover>
          ) : null}
        </ToolbarAnchor>
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
          disabled={selectionLockedToolsDisabled}
          onClick={() => {
              closeColorLibrary();
              if (imageOpen) {
                closeImageMenu();
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
              align="center"
              anchorRef={imageAnchorRef}
              clampToViewport
              subtoolbar
              role="dialog"
              aria-label="Image tools"
            >
              {trace ? (
                <>
                  {isCompactViewport ? (
                    <>
                      <ToolbarButton
                        type="button"
                        onClick={() => {
                          openSidebarSection("trace");
                          closeImageMenu();
                        }}
                      >
                        <ToolbarIcon icon="/icons/lucide/sliders-horizontal.svg" />
                        <ToolbarLabel>Display settings</ToolbarLabel>
                      </ToolbarButton>

                      <ToolbarDivider />
                    </>
                  ) : (
                    <>

                      <Button
                        type="button"
                        variant="ghostV2"
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

                      </Button>

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
                    </>
                  )}

                  <Button
                    type="button"
                    variant="ghostV2"
                    aria-label="Reposition trace"
                    title="Reposition trace"
                    onClick={() => {
                      openSidebarSection("trace");
                      closeImageMenu();
                      dispatch(
                        createBeginTraceRepositionCommand("toolbar"),
                      );
                    }}
                  >
                    <ToolbarIcon icon="/icons/lucide/vector_square.svg" />
                    Reposition
                  </Button>

                  {/*
                  <ToolbarButton type="button" disabled>
                    <ToolbarIcon icon="/icons/lucide/crop.svg" />
                    <ToolbarLabel>Crop</ToolbarLabel>
                  </ToolbarButton>
                  */}
                </>
              ) : (
                // <ToolbarButton
                //   type="button"
                //   primary
                //   onClick={() => {
                //     openSidebarSection("trace");
                //     closeImageMenu();
                //   }}
                // >
                //   <ToolbarIcon icon="/icons/lucide/image.svg" />
                //   <ToolbarLabel>Add image</ToolbarLabel>
                //   </ToolbarButton>

                  <Button 
                    type="button" 
                    variant="ghostV2" 
                    onClick={() => {
                      openSidebarSection("trace");
                      closeImageMenu();
                    }}                  >
                    <ButtonIcon icon="/icons/lucide/image.svg" />
                    Upload image
                  </Button>
                )}
            </FloatingToolbarPortalPopover>
          ) : null}
        </ToolbarAnchor>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup style={{"gap": 4}}>
        <ToolbarButton
          type="button"
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo"
          className={[styles.historyButton, styles.toolbarHistoryControl].join(" ")}
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
          className={[styles.historyButton, styles.toolbarHistoryControl].join(" ")}
          onClick={() => {
            closeColorLibrary();
            dispatch(createRedoCommand());
          }}
        >
          <ToolbarIcon icon="/icons/lucide/redo.svg" />
        </ToolbarButton>

        <ToolbarDivider
          className={[styles.historyDivider, styles.toolbarHistoryDivider].join(" ")}
        />

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
            setClearCanvasModalOpen(true);
          }}
        >
          <ToolbarIcon icon="/icons/lucide/trash2.svg" />
        </ToolbarButton>
      </ToolbarGroup>
      </Toolbar>

      <Modal
        isOpen={clearCanvasModalOpen}
        title="Clear canvas?"
        description="This will remove all painted stitches."
        tone="fail"
        dismissLabel="Cancel"
        confirmLabel="Clear canvas"
        confirmVariant="destructive"
        onDismiss={() => setClearCanvasModalOpen(false)}
        onConfirm={() => {
          setClearCanvasModalOpen(false);
          dispatch(createClearCanvasCommand());
        }}
      />
    </>
  );
}
