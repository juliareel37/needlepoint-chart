"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  EditorStore,
  TextPlacementSession,
  ViewportState,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getContainedRect,
  getPositionedBounds,
  getPositioningTransformCss,
} from "@/lib/editor-v2/editor/positioning";
import { measureIntrinsicText } from "@/lib/editor-v2/editor/text/measureIntrinsicText";
import {
  createUpdateTextPlacementCommand,
} from "../workspaceCommands";
import { PositioningBoxOverlay } from "./overlays/PositioningBoxOverlay";

interface TextPlacementLayerProps {
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  metrics: GridWorldMetrics;
  placement: TextPlacementSession;
  portalHost?: HTMLElement | null;
  previewColor: string;
  stageBounds: { left: number; top: number; width: number; height: number };
  viewport: ViewportState;
  worldBounds: { left: number; top: number; width: number; height: number };
  zoom: number;
}

export function TextPlacementLayer({
  dispatch,
  getWorldPointFromClient,
  metrics,
  placement,
  portalHost = null,
  previewColor,
  stageBounds,
  viewport,
  worldBounds,
  zoom,
}: TextPlacementLayerProps) {
  const [isEditing, setIsEditing] = useState(true);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [mobilePreviewTransform, setMobilePreviewTransform] = useState<
    typeof transform | null
  >(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const baseRect = useMemo(
    () =>
      getContainedRect(
        placement.intrinsicWidth,
        placement.intrinsicHeight,
        metrics.surfaceWidth,
        metrics.surfaceHeight,
      ),
    [
      metrics.surfaceHeight,
      metrics.surfaceWidth,
      placement.intrinsicHeight,
      placement.intrinsicWidth,
    ],
  );
  const baseFontScale = baseRect.width / Math.max(placement.intrinsicWidth, 1);
  const fontSize = placement.baseFontSize * baseFontScale;
  const lineHeight = fontSize * 1.1;
  const lineCount = Math.max(1, placement.text.split("\n").length);
  const textBlockHeight = lineCount * lineHeight;
  const verticalPadding = Math.max(6, (baseRect.height - textBlockHeight) / 2);
  const transform = useMemo(
    () => ({
      offsetX: placement.offsetX,
      offsetY: placement.offsetY,
      scale: placement.scale,
    }),
    [placement.offsetX, placement.offsetY, placement.scale],
  );
  const bounds = useMemo(
    () => getPositionedBounds(baseRect, transform),
    [baseRect, transform],
  );
  const displayTransform = mobilePreviewTransform ?? transform;
  const displayBounds = useMemo(
    () => getPositionedBounds(baseRect, displayTransform),
    [baseRect, displayTransform],
  );
  const mobileDisplayStageBounds = useMemo(
    () => ({
      left: worldBounds.left + displayBounds.left * viewport.zoom,
      top: worldBounds.top + displayBounds.top * viewport.zoom,
      width: displayBounds.width * viewport.zoom,
      height: displayBounds.height * viewport.zoom,
    }),
    [displayBounds, viewport.zoom, worldBounds.left, worldBounds.top],
  );
  const mobileOverlayBounds = useMemo(
    () => ({
      left: mobileDisplayStageBounds.left - stageBounds.left,
      top: mobileDisplayStageBounds.top - stageBounds.top,
      width: mobileDisplayStageBounds.width,
      height: mobileDisplayStageBounds.height,
    }),
    [mobileDisplayStageBounds, stageBounds.left, stageBounds.top],
  );
  const previewTextRef = useRef<HTMLDivElement | null>(null);
  const textareaPreviewRef = useRef<HTMLTextAreaElement | null>(null);
  const handleTransformPreview = useCallback((nextTransform: typeof transform) => {
    if (coarsePointer && !isEditing) {
      setMobilePreviewTransform(nextTransform);
      return;
    }

    const nextStyle = getPositioningTransformCss(nextTransform);
    if (previewTextRef.current) {
      previewTextRef.current.style.transform = nextStyle;
    }
    if (textareaPreviewRef.current) {
      textareaPreviewRef.current.style.transform = nextStyle;
    }
  }, [coarsePointer, isEditing]);
  const handleTransformCommit = useCallback(
    (nextTransform: typeof transform) => {
      setMobilePreviewTransform(nextTransform);
      dispatch(
        createUpdateTextPlacementCommand({
          offsetX: nextTransform.offsetX,
          offsetY: nextTransform.offsetY,
          scale: nextTransform.scale,
        }),
      );
    },
    [dispatch],
  );
  const projectMobileStageBounds = useCallback(
    (
      nextTransform: typeof transform,
      nextBaseRect: typeof baseRect,
    ) => {
      const nextBounds = getPositionedBounds(nextBaseRect, nextTransform);

      return {
        left: worldBounds.left - stageBounds.left + nextBounds.left * viewport.zoom,
        top: worldBounds.top - stageBounds.top + nextBounds.top * viewport.zoom,
        width: nextBounds.width * viewport.zoom,
        height: nextBounds.height * viewport.zoom,
      };
    },
    [
      stageBounds.left,
      stageBounds.top,
      viewport.zoom,
      worldBounds.left,
      worldBounds.top,
    ],
  );
  const commitTextUpdate = useCallback(
    (nextText: string) => {
      const measured = measureIntrinsicText(nextText, {
        baseFontSize: placement.baseFontSize,
        fontFamily: placement.fontFamily,
        fontStyle: placement.fontStyle,
        fontWeight: placement.fontWeight,
      });

      dispatch(
        createUpdateTextPlacementCommand({
          text: nextText,
          intrinsicWidth: measured?.width ?? placement.intrinsicWidth,
          intrinsicHeight: measured?.height ?? placement.intrinsicHeight,
        }),
      );
    },
    [
      dispatch,
      placement.baseFontSize,
      placement.fontFamily,
      placement.fontStyle,
      placement.fontWeight,
      placement.intrinsicHeight,
      placement.intrinsicWidth,
    ],
  );

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.focus();

    const frame = window.requestAnimationFrame(() => {
      textarea.select();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isEditing]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(mediaQuery.matches);

    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  useEffect(() => {
    setMobilePreviewTransform(null);
  }, [transform]);

  const showMobilePositioning = coarsePointer && !isEditing && portalHost;
  const mobileOverlay = showMobilePositioning
    ? createPortal(
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: `${mobileOverlayBounds.left}px`,
              top: `${mobileOverlayBounds.top}px`,
              width: `${mobileOverlayBounds.width}px`,
              height: `${mobileOverlayBounds.height}px`,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: `${placement.fontFamily}, sans-serif`,
              fontWeight: placement.fontWeight,
              fontStyle: placement.fontStyle,
              fontSize: `${fontSize * displayTransform.scale * viewport.zoom}px`,
              lineHeight: 1.1,
              textAlign: "center",
              color: previewColor,
              textShadow: "0 1px 0 rgba(255,255,255,0.55)",
              textDecoration: placement.underline ? "underline" : "none",
              padding: `${6 * viewport.zoom}px`,
              boxSizing: "border-box",
              whiteSpace: "pre-wrap",
              overflow: "hidden",
            }}
          >
            {placement.text}
          </div>
          <PositioningBoxOverlay
            ariaLabel="Text placement controls"
            baseRect={baseRect}
            bounds={mobileOverlayBounds}
            interactionBounds={displayBounds}
            getWorldPointFromClient={getWorldPointFromClient}
            onClick={() => setIsEditing(true)}
            onTransformCommit={handleTransformCommit}
            onTransformPreview={handleTransformPreview}
            projectBoundsForPreview={projectMobileStageBounds}
            transactionKeyPrefix="text-drag"
            transform={transform}
            zoom={1}
          />
        </div>,
        portalHost,
      )
    : null;

  return (
    <>
      {mobileOverlay}
      {!showMobilePositioning ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            overflow: "visible",
            pointerEvents: "auto",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          <div
            ref={previewTextRef}
            aria-hidden={isEditing ? "true" : undefined}
            style={{
              position: "absolute",
              top: `${baseRect.top}px`,
              left: `${baseRect.left}px`,
              width: `${baseRect.width}px`,
              height: `${baseRect.height}px`,
              transform: getPositioningTransformCss(transform),
              transformOrigin: "top left",
              willChange: "transform",
              pointerEvents: isEditing ? "none" : "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: `${placement.fontFamily}, sans-serif`,
              fontWeight: placement.fontWeight,
              fontStyle: placement.fontStyle,
              fontSize: `${fontSize}px`,
              lineHeight: 1.1,
              textAlign: "center",
              color: previewColor,
              textShadow: "0 1px 0 rgba(255,255,255,0.55)",
              textDecoration: placement.underline ? "underline" : "none",
              padding: 6,
              boxSizing: "border-box",
              whiteSpace: "pre-wrap",
              overflow: "hidden",
            }}
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsEditing(true);
            }}
          >
            {isEditing ? null : placement.text}
          </div>

          {isEditing ? (
            <>
              <PositioningBoxOverlay
                ariaLabel="Text placement outline"
                baseRect={baseRect}
                bounds={bounds}
                getWorldPointFromClient={getWorldPointFromClient}
                interactive={false}
                showHandles={false}
                transactionKeyPrefix="text-drag"
                transform={transform}
                zoom={zoom}
              />

              <textarea
                ref={(node) => {
                  textareaRef.current = node;
                  textareaPreviewRef.current = node;
                }}
                value={placement.text}
                aria-label="Edit text"
                onChange={(event) => {
                  commitTextUpdate(event.target.value);
                }}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setIsEditing(false);
                  }

                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    setIsEditing(false);
                  }
                }}
                style={{
                  position: "absolute",
                  top: `${baseRect.top}px`,
                  left: `${baseRect.left}px`,
                  width: `${baseRect.width}px`,
                  height: `${baseRect.height}px`,
                  transform: getPositioningTransformCss(transform),
                  transformOrigin: "top left",
                  willChange: "transform",
                  resize: "none",
                  border: "none",
                  background: "transparent",
                  color: previewColor,
                  textShadow: "0 1px 0 rgba(255,255,255,0.55)",
                  fontFamily: `${placement.fontFamily}, sans-serif`,
                  fontWeight: placement.fontWeight,
                  fontStyle: placement.fontStyle,
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.1,
                  textAlign: "center",
                  textDecoration: placement.underline ? "underline" : "none",
                  paddingTop: verticalPadding,
                  paddingBottom: verticalPadding,
                  paddingLeft: 6,
                  paddingRight: 6,
                  boxSizing: "border-box",
                  overflow: "hidden",
                  outline: "none",
                  whiteSpace: "pre-wrap",
                  caretColor: "#2563eb",
                  cursor: "text",
                  caretShape: "bar",
                }}
              />
            </>
          ) : null}

          {isEditing ? null : (
            <PositioningBoxOverlay
              ariaLabel="Text placement controls"
              baseRect={baseRect}
              bounds={bounds}
              getWorldPointFromClient={getWorldPointFromClient}
              onClick={() => setIsEditing(true)}
              onTransformCommit={handleTransformCommit}
              onTransformPreview={handleTransformPreview}
              transactionKeyPrefix="text-drag"
              transform={transform}
              zoom={zoom}
            />
          )}
        </div>
      ) : null}
    </>
  );
}
