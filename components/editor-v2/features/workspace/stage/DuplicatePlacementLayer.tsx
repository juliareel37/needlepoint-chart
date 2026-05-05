"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarIcon,
} from "@/components/design-system";
import type {
  DuplicatePlacementSession,
  EditorStore,
  PaletteColor,
  ViewportState,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  createCancelDuplicatePlacementCommand,
  createCommitDuplicatePlacementCommand,
} from "../workspaceCommands";
import styles from "../shell/EditorV2Shell.module.css";

interface DuplicatePlacementLayerProps {
  colorsById: Record<string, PaletteColor>;
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  metrics: GridWorldMetrics;
  portalHost?: HTMLElement | null;
  session: DuplicatePlacementSession;
  stageBounds: { left: number; top: number; width: number; height: number };
  viewport: ViewportState;
  worldBounds: { left: number; top: number; width: number; height: number };
}

interface DragSession {
  pointerId: number;
  startOffset: { x: number; y: number };
  startPoint: WorldPoint;
}

export function DuplicatePlacementLayer({
  colorsById,
  dispatch,
  getWorldPointFromClient,
  metrics,
  portalHost = null,
  session,
  stageBounds,
  viewport,
  worldBounds,
}: DuplicatePlacementLayerProps) {
  const pitch = metrics.cellSize + metrics.cellGap;
  const [offsetCells, setOffsetCells] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragSessionRef = useRef<DragSession | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bounds = useMemo(() => {
    return {
      left: (session.sourceRect.x + offsetCells.x) * pitch,
      top: (session.sourceRect.y + offsetCells.y) * pitch,
      width:
        session.sourceRect.width * metrics.cellSize +
        Math.max(0, session.sourceRect.width - 1) * metrics.cellGap,
      height:
        session.sourceRect.height * metrics.cellSize +
        Math.max(0, session.sourceRect.height - 1) * metrics.cellGap,
    };
  }, [
    metrics.cellGap,
    metrics.cellSize,
    offsetCells.x,
    offsetCells.y,
    pitch,
    session.sourceRect.height,
    session.sourceRect.width,
    session.sourceRect.x,
    session.sourceRect.y,
  ]);
  const floatingBarPosition = useMemo(() => {
    const stageLeft = worldBounds.left - stageBounds.left + bounds.left * viewport.zoom;
    const stageTop = worldBounds.top - stageBounds.top + bounds.top * viewport.zoom;

    return {
      left: stageLeft + (bounds.width * viewport.zoom) / 2,
      top: stageTop - 40,
    };
  }, [
    bounds.height,
    bounds.left,
    bounds.top,
    bounds.width,
    stageBounds.left,
    stageBounds.top,
    viewport.zoom,
    worldBounds.left,
    worldBounds.top,
  ]);

  useEffect(() => {
    setOffsetCells({ x: 0, y: 0 });
    setIsDragging(false);
  }, [session]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);

    for (const cell of session.cells) {
      const color = colorsById[cell.colorId];

      if (!color) {
        continue;
      }

      context.fillStyle = color.hex;
      context.fillRect(
        cell.x * pitch,
        cell.y * pitch,
        metrics.cellSize,
        metrics.cellSize,
      );
    }
  }, [bounds.height, bounds.width, colorsById, metrics.cellSize, pitch, session.cells]);

  useEffect(() => {
    function handleWindowPointerMove(event: PointerEvent) {
      const dragSession = dragSessionRef.current;

      if (!dragSession || dragSession.pointerId !== event.pointerId) {
        return;
      }

      const point = getWorldPointFromClient(event.clientX, event.clientY);

      if (!point) {
        return;
      }

      setOffsetCells({
        x: dragSession.startOffset.x + Math.round((point.x - dragSession.startPoint.x) / pitch),
        y: dragSession.startOffset.y + Math.round((point.y - dragSession.startPoint.y) / pitch),
      });
    }

    function handleWindowPointerEnd(event: PointerEvent) {
      if (dragSessionRef.current?.pointerId !== event.pointerId) {
        return;
      }

      dragSessionRef.current = null;
      setIsDragging(false);
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [getWorldPointFromClient, pitch]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: `${bounds.left}px`,
          top: `${bounds.top}px`,
          width: `${bounds.width}px`,
          height: `${bounds.height}px`,
          zIndex: 8,
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 && event.pointerType === "mouse") {
            return;
          }

          const point = getWorldPointFromClient(event.clientX, event.clientY);

          if (!point) {
            return;
          }

          dragSessionRef.current = {
            pointerId: event.pointerId,
            startOffset: offsetCells,
            startPoint: point,
          };
          setIsDragging(true);

          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            imageRendering: "pixelated",
            opacity: 0.92,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            border: "2px solid rgba(37, 99, 235, 0.95)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.72)",
            pointerEvents: "none",
          }}
        />
      </div>

      {portalHost
        ? createPortal(
            <div
              style={{
                position: "absolute",
                left: floatingBarPosition.left,
                top: floatingBarPosition.top,
                transform: "translateX(-50%)",
                zIndex: 12,
              }}
            >
              <Toolbar className={styles.floatingToolbar}>
                <ToolbarGroup>
                  <ToolbarButton
                    type="button"
                    variant="ghost"
                    iconOnly
                    aria-label="Cancel duplicate placement"
                    title="Cancel duplicate placement"
                    onClick={() => {
                      dispatch(createCancelDuplicatePlacementCommand());
                    }}
                  >
                    <ToolbarIcon icon="/icons/lucide/x.svg" />
                  </ToolbarButton>

                  <ToolbarButton
                    type="button"
                    variant="primary"
                    iconOnly
                    aria-label="Place duplicate"
                    title="Place duplicate"
                    onClick={() => {
                      dispatch(
                        createCommitDuplicatePlacementCommand(
                          offsetCells.x,
                          offsetCells.y,
                        ),
                      );
                    }}
                  >
                    <ToolbarIcon icon="/icons/lucide/check.svg" />
                  </ToolbarButton>
                </ToolbarGroup>
              </Toolbar>
            </div>,
            portalHost,
          )
        : null}
    </>
  );
}
