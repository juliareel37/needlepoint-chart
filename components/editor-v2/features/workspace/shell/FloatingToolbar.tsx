"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import {
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
  createCancelMirrorCommand,
  createBeginTraceRepositionCommand,
  createBeginMirrorFromSelectionCommand,
  createClearCanvasCommand,
  createClearSelectionCommand,
  createEraseCellsCommand,
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
import {
  getToolbarPopoverMeasuredWidth,
  getToolbarPopoverHorizontalPosition,
  TOOLBAR_POPOVER_VIEWPORT_PADDING,
} from "./toolbarPopoverPosition";
import styles from "./EditorV2Shell.module.css";

function FloatingToolbarPortalPopover({
  anchorRef,
  align = "start",
  children,
  clampToViewport = true,
  dockedToBottom = false,
  ignoreRefs = [],
  onRequestClose,
  subtoolbar = false,
  ...props
}: React.ComponentProps<typeof ToolbarPopover> & {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  align?: "start" | "center";
  clampToViewport?: boolean;
  dockedToBottom?: boolean;
  ignoreRefs?: Array<React.RefObject<HTMLElement | null>>;
  onRequestClose?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number | "auto";
    right: number | "auto";
    transform: string;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    if (dockedToBottom) {
      setPosition({
        top: 0,
        left: 0,
        right: 0,
        transform: "none",
      });
      return;
    }

    const anchor = anchorRef.current;

    if (!anchor) {
      setPosition(null);
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const popoverWidth = getToolbarPopoverMeasuredWidth(popoverRef.current);
    const viewportPadding = TOOLBAR_POPOVER_VIEWPORT_PADDING;
    const horizontalPosition = clampToViewport
      ? getToolbarPopoverHorizontalPosition({
          align,
          anchorRect: rect,
          popoverWidth,
          viewportPadding,
        })
      : {
          left: align === "center" ? rect.left + rect.width / 2 : rect.left - 12,
          right: "auto" as const,
          transform: align === "center" ? "translateX(-50%)" : "none",
        };

    setPosition({
      top: rect.bottom + 8,
      left: horizontalPosition.left,
      right: horizontalPosition.right,
      transform: horizontalPosition.transform,
    });
  }, [align, anchorRef, clampToViewport, dockedToBottom]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) {
      return;
    }

    updatePosition();
  }, [mounted, updatePosition, children]);

  useEffect(() => {
    if (!mounted || typeof ResizeObserver === "undefined") {
      return;
    }

    const popover = popoverRef.current;
    const anchor = anchorRef.current;

    if (!popover || !anchor) {
      return;
    }

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(updatePosition);
    });

    observer.observe(popover);

    return () => observer.disconnect();
  }, [anchorRef, mounted, updatePosition]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, updatePosition]);

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

      if (ignoreRefs.some((ref) => ref.current?.contains(target))) {
        return;
      }

      onRequestClose?.();
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [anchorRef, ignoreRefs, mounted, onRequestClose]);

  if (!mounted) {
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
        top: dockedToBottom ? "auto" : (position?.top ?? 0),
        bottom: dockedToBottom
          ? "calc(env(safe-area-inset-bottom, 0px) + 12px)"
          : "auto",
        left: dockedToBottom ? "50%" : (position?.left ?? 0),
        right: dockedToBottom ? "auto" : (position?.right ?? "auto"),
        zIndex: 230,
        transform: dockedToBottom
          ? "translateX(-50%)"
          : (position?.transform ?? "none"),
        width: dockedToBottom ? "fit-content" : undefined,
        maxWidth: dockedToBottom
          ? "calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 24px)"
          : `calc(100vw - ${TOOLBAR_POPOVER_VIEWPORT_PADDING * 2}px)`,
        overflowX: subtoolbar ? "auto" : undefined,
        overflowY: subtoolbar ? "hidden" : undefined,
        visibility: position ? "visible" : "hidden",
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
  featuredColorIds: string[];
  selectionBounds: GridRect | null;
  selectionCommitted: boolean;
  selectionMode: SelectionState["mode"];
  selectionShape: SelectionState["shape"];
  trace: TraceDocument | null;
  mirrorSessionActive: boolean;
  isBottomPanelLayout: boolean;
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
  featuredColorIds,
  selectionBounds,
  selectionCommitted,
  selectionMode,
  selectionShape,
  trace,
  mirrorSessionActive,
  isBottomPanelLayout,
}: FloatingToolbarProps) {
  const [activeTooltip, setActiveTooltip] = useState<{
    label: string;
    left: number;
    top: number;
    target: HTMLButtonElement;
  } | null>(null);
  const [colorLibraryOpen, setColorLibraryOpen] = useState(false);
  const [drawPopoverTool, setDrawPopoverTool] = useState<"paint" | "erase" | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [brushSizeTooltipVisible, setBrushSizeTooltipVisible] = useState(false);
  const [brushSizeSliderValue, setBrushSizeSliderValue] = useState(1);
  const [brushSizeSliderDragging, setBrushSizeSliderDragging] = useState(false);
  const [touchPrimaryInput, setTouchPrimaryInput] = useState(false);
  const [clearCanvasModalOpen, setClearCanvasModalOpen] = useState(false);
  const colorAnchorRef = useRef<HTMLDivElement | null>(null);
  const paintAnchorRef = useRef<HTMLDivElement | null>(null);
  const eraseAnchorRef = useRef<HTMLDivElement | null>(null);
  const imageAnchorRef = useRef<HTMLDivElement | null>(null);
  const selectAnchorRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const selectionTraceOpacityRestoreRef = useRef<number | null>(null);
  const drawOpen = drawPopoverTool !== null;

  const normalizedBrushSize = Number.isFinite(brushSize)
    ? Math.min(Math.max(Math.round(brushSize), 1), 10)
    : 1;
  const brushFootprintSize = normalizedBrushSize;
  const brushFootprintLabel = `${brushFootprintSize}x${brushFootprintSize}`;
  const brushSizeTooltipPercent =
    ((brushSizeSliderValue - 1) / 9) * 100;
  const activeSwatchColor = activeColor?.hex ?? "var(--neutral-400)";
  const selectionVisible = Boolean(selectionBounds) || activeTool === "lasso";
  const canMirrorSelection = selectionCommitted && selectionMode === "rect";
  const canEraseSelection = Boolean(selectionCommitted && selectionBounds);
  const mobileSelectionDocked = isBottomPanelLayout && (selectionVisible || selectOpen);
  const selectionToolSessionActive = Boolean(selectionBounds) || selectOpen;
  const toolbarTooltipsEnabled = !isBottomPanelLayout;

  const updateTooltipPosition = useCallback((target: HTMLButtonElement) => {
    if (!toolbarTooltipsEnabled) {
      setActiveTooltip(null);
      return;
    }

    const label = target.dataset.tooltip;

    if (!label) {
      setActiveTooltip(null);
      return;
    }

    const rect = target.getBoundingClientRect();

    setActiveTooltip({
      label,
      left: rect.left + rect.width / 2,
      top: rect.top,
      target,
    });
  }, [toolbarTooltipsEnabled]);

  function buildSelectionCandidateCells(bounds: GridRect): GridPoint[] {
    const cells: GridPoint[] = [];

    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        cells.push({ x, y });
      }
    }

    return cells;
  }

  useEffect(() => {
    if (brushSizeSliderDragging) {
      return;
    }

    setBrushSizeSliderValue(normalizedBrushSize);
  }, [brushSizeSliderDragging, normalizedBrushSize]);

  useEffect(() => {
    if (!activeTooltip) {
      return;
    }

    const update = () => {
      if (!document.body.contains(activeTooltip.target)) {
        setActiveTooltip(null);
        return;
      }

      updateTooltipPosition(activeTooltip.target);
    };

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [activeTooltip, updateTooltipPosition]);

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
    if (toolbarTooltipsEnabled) {
      return;
    }

    setActiveTooltip(null);
  }, [toolbarTooltipsEnabled]);

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
      setBrushSizeSliderDragging(false);
      setBrushSizeTooltipVisible(false);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [brushSizeTooltipVisible]);

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
  }

  function closeDrawMenu(): void {
    setDrawPopoverTool(null);
    setBrushSizeSliderDragging(false);
    setBrushSizeTooltipVisible(false);
  }

  function closeColorLibrary(): void {
    setColorLibraryOpen(false);
  }

  function closeSelectMenu(): void {
    setSelectOpen(false);
  }

  function handleSelectionButtonClick() {
    closeColorLibrary();
    closeDrawMenu();
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
    closeSelectMenu();
  }

  function handleNewSelection() {
    dispatch(createClearSelectionCommand());
    dispatch(createSetToolCommand("lasso"));
    setSelectOpen(true);
  }

  const selectionToolbarControls = (
    <>
      <ToolbarGroup>
        <ToolbarButton
          type="button"
          active={selectionShape === "rect"}
          aria-pressed={selectionShape === "rect"}
          onClick={() => dispatch(createSetSelectionShapeCommand("rect"))}
        >
          <ToolbarIcon icon="/icons/lucide/selection.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={selectionShape === "circle"}
          aria-pressed={selectionShape === "circle"}
          onClick={() => dispatch(createSetSelectionShapeCommand("circle"))}
        >
          <ToolbarIcon icon="/icons/lucide/selection-circle.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={selectionShape === "freehand"}
          aria-pressed={selectionShape === "freehand"}
          onClick={() => dispatch(createSetSelectionShapeCommand("freehand"))}
        >
          <ToolbarIcon icon="/icons/lucide/lasso.svg" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          type="button"
          labelled
          active={mirrorSessionActive}
          aria-pressed={mirrorSessionActive}
          disabled={!canMirrorSelection}
          onClick={() => {
            if (!canMirrorSelection) {
              return;
            }

            if (mirrorSessionActive) {
              dispatch(createCancelMirrorCommand());
              dispatch(createSetToolCommand("lasso"));
              return;
            }

            dispatch(createBeginMirrorFromSelectionCommand());
          }}
        >
          <ToolbarIcon icon="/icons/flip.svg" />
          <ToolbarLabel>Mirror</ToolbarLabel>
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarButton
        type="button"
        labelled
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
        <ToolbarLabel>Erase all</ToolbarLabel>
      </ToolbarButton>
    </>
  );

  return (
    <>
      <div
        ref={toolbarRef}
        className={styles.floatingToolbarViewport}
        onMouseOver={(event) => {
          if (!toolbarTooltipsEnabled) {
            return;
          }

          const target = event.target instanceof Element
            ? event.target.closest("button[data-tooltip]")
            : null;

          if (!(target instanceof HTMLButtonElement)) {
            return;
          }

          updateTooltipPosition(target);
        }}
        onMouseOut={(event) => {
          if (!toolbarTooltipsEnabled) {
            return;
          }

          const relatedTarget = event.relatedTarget;

          if (
            relatedTarget instanceof Node &&
            event.currentTarget.contains(relatedTarget)
          ) {
            return;
          }

          setActiveTooltip((current) => (current?.target.matches(":focus-visible") ? current : null));
        }}
        onFocusCapture={(event) => {
          if (!toolbarTooltipsEnabled) {
            return;
          }

          const target = event.target instanceof Element
            ? event.target.closest("button[data-tooltip]")
            : null;

          if (!(target instanceof HTMLButtonElement)) {
            return;
          }

          updateTooltipPosition(target);
        }}
        onBlurCapture={(event) => {
          if (!toolbarTooltipsEnabled) {
            return;
          }

          const relatedTarget = event.relatedTarget;

          if (
            relatedTarget instanceof Node &&
            event.currentTarget.contains(relatedTarget)
          ) {
            return;
          }

          setActiveTooltip(null);
        }}
      >
      <Toolbar className={styles.floatingToolbar}>
      <ToolbarGroup>
        <ToolbarAnchor ref={colorAnchorRef}>
          <ToolbarButton
            type="button"
            swatch
            active={colorLibraryOpen}
            aria-pressed={colorLibraryOpen}
            aria-label="Open color library"
            // data-tooltip="Open color library"
            title="Open color library"
            className={styles.libraryPopoverSwatchTrigger}
            onClick={() => {
              setColorLibraryOpen((current) => !current);
              closeDrawMenu();
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
                featuredColorIds={featuredColorIds}
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



      <ToolbarGroup>
      <ToolbarDivider />
        <ToolbarButton
          type="button"
          active={activeTool === "eyedropper"}
          aria-pressed={activeTool === "eyedropper"}
          aria-label="Eyedropper"
          data-tooltip="Eyedropper"
          title="Eyedropper"
          onClick={() => {
            closeColorLibrary();
            closeDrawMenu();
            closeImageMenu();
            dispatch(createSetToolCommand("eyedropper"));
          }}
        >
          <ToolbarIcon icon="/icons/lucide/dropper.svg" />
        </ToolbarButton>


        {touchPrimaryInput ? null : (
          <ToolbarButton
            type="button"
            active={activeTool === "pan"}
            inertWhenActive
            aria-pressed={activeTool === "pan"}
            aria-label="Pan"
            data-tooltip="Pan"
            title="Pan"
            onClick={() => {
              closeColorLibrary();
              closeDrawMenu();
              closeImageMenu();
              dispatch(createSetToolCommand("pan"));
            }}
          >
            <ToolbarIcon icon="/icons/lucide/pan.svg" />
          </ToolbarButton>
        )}
   <ToolbarAnchor ref={selectAnchorRef}>
          <ToolbarButton
            type="button"
            active={selectionVisible || selectOpen}
            aria-pressed={selectionVisible || selectOpen}
            aria-label="Select"
            data-tooltip="Select"
            title="Select"
            onClick={handleSelectionButtonClick}
          >
            <ToolbarIcon icon="/icons/lucide/selection.svg" />
          </ToolbarButton>

          {selectOpen ? (
            <FloatingToolbarPortalPopover
              align="center"
              anchorRef={selectAnchorRef}
              clampToViewport
              dockedToBottom={mobileSelectionDocked}
              ignoreRefs={[toolbarRef]}
              subtoolbar
              role="dialog"
              aria-label="Selection tools"
              className={[
                styles.selectionToolbarPopover,
                mobileSelectionDocked ? styles.selectionToolbarPopoverDocked : null,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className={styles.selectionToolbarCluster}>
                {/* <div className={styles.selectionToolbarCloseViewport}>
                  <Toolbar className={[styles.floatingToolbar, styles.selectionToolbarCloseBar].join(" ")}>
                    <ToolbarButton
                      type="button"
                      variant="ghost"
                      iconOnly
                      className={styles.selectionToolbarCloseButton}
                      onClick={handleExitSelection}
                    >
                      <ToolbarIcon icon="/icons/lucide/x.svg" />
                    </ToolbarButton>
                  </Toolbar>
                </div> */}

                <div className={styles.selectionToolbarMainViewport}>
                  <Toolbar className={styles.floatingToolbar}>
                    {selectionToolbarControls}
                  </Toolbar>
                </div>

                <div className={styles.selectionToolbarCloseViewport}>
                  <Toolbar className={[styles.floatingToolbar, styles.selectionToolbarCloseBar].join(" ")}>
                    <ToolbarButton
                      type="button"
                      variant="ghost"
                      iconOnly
                      className={styles.selectionToolbarCloseButton}
                      onClick={handleExitSelection}
                    >
                      <ToolbarIcon icon="/icons/lucide/x.svg" />
                    </ToolbarButton>
                  </Toolbar>
                </div>
              </div>
            </FloatingToolbarPortalPopover>
          ) : null}
        </ToolbarAnchor>

        <ToolbarButton
          type="button"
          active={activeTool === "fill"}
          aria-pressed={activeTool === "fill"}
          aria-label="Fill"
          data-tooltip="Fill"
          title="Fill"
          onClick={() => {
            if (activeTool === "fill") {
              return;
            }
            closeColorLibrary();
            closeDrawMenu();
            closeImageMenu();
            dispatch(createSetToolCommand("fill"));
          }}
        >
          <ToolbarIcon icon="/icons/lucide/paint_bucket.svg" />
        </ToolbarButton>

        <ToolbarAnchor ref={paintAnchorRef}>
          <ToolbarButton
            type="button"
            active={activeTool === "paint"}
            aria-pressed={activeTool === "paint"}
            aria-label="Brush"
            data-tooltip="Brush"
            title="Brush"
            onClick={() => {
              closeColorLibrary();
              closeImageMenu();
              if (activeTool === "paint") {
                setDrawPopoverTool((current) => (current === "paint" ? null : "paint"));
                return;
              }

              dispatch(createSetToolCommand("paint"));
              if (!selectionToolSessionActive) {
                setDrawPopoverTool("paint");
              } else {
                closeDrawMenu();
              }
            }}
          >
            <ToolbarIcon icon="/icons/lucide/brush_thick.svg" />
          </ToolbarButton>
        </ToolbarAnchor>

        <ToolbarAnchor ref={eraseAnchorRef}>
          <ToolbarButton
            type="button"
            active={activeTool === "erase"}
            aria-pressed={activeTool === "erase"}
            aria-label="Erase"
            data-tooltip="Erase"
            title="Erase"
            onClick={() => {
              closeColorLibrary();
              closeImageMenu();
              if (activeTool === "erase") {
                setDrawPopoverTool((current) => (current === "erase" ? null : "erase"));
                return;
              }

              dispatch(createSetToolCommand("erase"));
              if (!selectionToolSessionActive) {
                setDrawPopoverTool("erase");
              } else {
                closeDrawMenu();
              }
            }}
          >
            <ToolbarIcon icon="/icons/lucide/eraser.svg" />
          </ToolbarButton>

          {drawOpen ? (
            <FloatingToolbarPortalPopover
              align="center"
              anchorRef={drawPopoverTool === "erase" ? eraseAnchorRef : paintAnchorRef}
              onRequestClose={closeDrawMenu}
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
                  <ToolbarIcon icon="/icons/other/stroke-width.svg" />
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
                      step={0.05}
                      value={brushSizeSliderValue}
                      aria-label="Brush size"
                      aria-valuetext={`${brushFootprintLabel} paint area`}
                      onPointerDown={() => {
                        setBrushSizeSliderDragging(true);
                        setBrushSizeTooltipVisible(true);
                      }}
                      onBlur={() => {
                        setBrushSizeSliderDragging(false);
                        setBrushSizeTooltipVisible(false);
                      }}
                      onChange={(e) => {
                        const nextSliderValue = Number(e.currentTarget.value);
                        setBrushSizeSliderValue(nextSliderValue);
                        const newSize = Math.min(Math.max(Math.round(nextSliderValue), 1), 10);

                        if (newSize === normalizedBrushSize) {
                          return;
                        }

                        dispatch(
                          createSetBrushSizeCommand(
                            newSize,
                            drawPopoverTool ?? "paint",
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

      </ToolbarGroup>

      {/* <ToolbarGroup> */}
     
      {/* </ToolbarGroup> */}

      {/* <ToolbarDivider /> */}
 
      <ToolbarGroup>
        <ToolbarAnchor ref={imageAnchorRef}>
          <ToolbarButton
            type="button"
          active={imageOpen}
          aria-pressed={imageOpen}
          aria-label="Image"
          data-tooltip="Image"
          title="Image"
          disabled={Boolean(selectionCommitted && selectionBounds)}
          onClick={() => {
              closeColorLibrary();
              if (imageOpen) {
                closeImageMenu();
              } else {
                setImageOpen(true);
              }
              closeDrawMenu();
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
              onRequestClose={closeImageMenu}
              role="dialog"
              aria-label="Image tools"
            >
              {trace ? (
                <>
                  <ToolbarButton
                  labelled
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


                  <ToolbarButton
                    type="button"
                    labelled
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
                  </ToolbarButton>

                </>
              ) : (

                  <ToolbarButton
                    type="button"
                    // variant="secondary"
                    labelled
                    onClick={() => {
                      openSidebarSection("trace");
                      closeImageMenu();
                    }}
                  >
                    <ToolbarIcon icon="/icons/lucide/image.svg" />
                    Upload image
                  </ToolbarButton>
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
          data-tooltip="Undo"
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
          data-tooltip="Redo"
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
          data-tooltip="Clear canvas"
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
      </div>

      {toolbarTooltipsEnabled && activeTooltip
        ? createPortal(
            <div
              className={styles.floatingToolbarTooltip}
              style={{
                left: activeTooltip.left,
                top: activeTooltip.top,
              }}
            >
              {activeTooltip.label}
            </div>,
            document.body,
          )
        : null}

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
