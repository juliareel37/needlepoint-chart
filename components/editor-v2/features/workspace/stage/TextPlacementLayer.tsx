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
  getRotationCss,
} from "@/lib/editor-v2/editor/positioning";
import { renderCellSampledPlacementPreview } from "@/lib/editor-v2/editor/icons/convertIconPlacementToCells";
import { measureIntrinsicText } from "@/lib/editor-v2/editor/text/measureIntrinsicText";
import { renderTextPlacementPreview } from "@/lib/editor-v2/editor/text/renderTextPlacementPreview";
import {
  createUpdateTextPlacementCommand,
} from "../workspaceCommands";
import { SHOW_CELL_SAMPLED_PLACEMENT_PREVIEW } from "./placementPreviewMode";
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
  const useCellSampledPreview = SHOW_CELL_SAMPLED_PLACEMENT_PREVIEW;
  const [isEditing, setIsEditing] = useState(true);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [previewTransform, setPreviewTransform] = useState<
    typeof transform | null
  >(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
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
      rotation: placement.rotation,
    }),
    [placement.offsetX, placement.offsetY, placement.rotation, placement.scale],
  );
  const bounds = useMemo(
    () => getPositionedBounds(baseRect, transform),
    [baseRect, transform],
  );
  const displayTransform = previewTransform ?? transform;
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
    setPreviewTransform(nextTransform);

    const nextBounds = getPositionedBounds(baseRect, nextTransform);
    if (previewTextRef.current) {
      applyTextPreviewBox(previewTextRef.current, nextBounds, nextTransform.rotation);
    }
    if (textareaPreviewRef.current) {
      applyTextPreviewBox(textareaPreviewRef.current, nextBounds, nextTransform.rotation);
    }
  }, [baseRect, coarsePointer, isEditing]);
  const handleTransformCommit = useCallback(
    (nextTransform: typeof transform) => {
      setPreviewTransform(nextTransform);
      dispatch(
        createUpdateTextPlacementCommand({
          offsetX: nextTransform.offsetX,
          offsetY: nextTransform.offsetY,
          scale: nextTransform.scale,
          rotation: nextTransform.rotation,
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
    setPreviewTransform(null);
  }, [transform]);

  useEffect(() => {
    let cancelled = false;

    async function buildPreview() {
      if (!useCellSampledPreview) {
        setPreviewSrc(null);
        return;
      }

      const basePreviewSrc = renderTextPlacementPreview({
        text: placement.text,
        width: displayBounds.width,
        height: displayBounds.height,
        fontSize: fontSize * displayTransform.scale,
        fontFamily: placement.fontFamily,
        fontWeight: placement.fontWeight,
        fontStyle: placement.fontStyle,
        underline: placement.underline,
        color: previewColor,
      });

      if (!basePreviewSrc) {
        if (!cancelled) {
          setPreviewSrc(null);
        }
        return;
      }

      try {
        const nextPreviewSrc = await renderCellSampledPlacementPreview({
          src: basePreviewSrc,
          bounds: displayBounds,
          metrics,
        });

        if (!cancelled) {
          setPreviewSrc(nextPreviewSrc);
        }
      } catch {
        if (!cancelled) {
          setPreviewSrc(basePreviewSrc);
        }
      }
    }

    void buildPreview();

    return () => {
      cancelled = true;
    };
  }, [
    displayBounds,
    displayTransform.scale,
    fontSize,
    metrics,
    placement.fontFamily,
    placement.fontStyle,
    placement.fontWeight,
    placement.text,
    placement.underline,
    previewColor,
    useCellSampledPreview,
  ]);

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
              transform: getRotationCss(displayTransform.rotation),
              transformOrigin: "center center",
              overflow: "hidden",
            }}
          >
            {useCellSampledPreview && previewSrc ? (
              <img
                src={previewSrc}
                alt=""
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
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
                  padding: `${6 * displayTransform.scale * viewport.zoom}px`,
                  boxSizing: "border-box",
                  whiteSpace: "pre-wrap",
                  overflow: "hidden",
                }}
              >
                {placement.text}
              </div>
            )}
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
              top: `${bounds.top}px`,
              left: `${bounds.left}px`,
              width: `${bounds.width}px`,
              height: `${bounds.height}px`,
              transform: getRotationCss(transform.rotation),
              transformOrigin: "center center",
              willChange: "left, top, width, height, transform",
              overflow: "hidden",
              pointerEvents: isEditing ? "none" : "auto",
            }}
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsEditing(true);
            }}
          >
            {useCellSampledPreview && previewSrc ? (
              <img
                src={previewSrc}
                alt=""
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: `${placement.fontFamily}, sans-serif`,
                  fontWeight: placement.fontWeight,
                  fontStyle: placement.fontStyle,
                  fontSize: `${fontSize * displayTransform.scale}px`,
                  lineHeight: 1.1,
                  textAlign: "center",
                  color: previewColor,
                  textShadow: "0 1px 0 rgba(255,255,255,0.55)",
                  textDecoration: placement.underline ? "underline" : "none",
                  padding: `${6 * displayTransform.scale}px`,
                  boxSizing: "border-box",
                  whiteSpace: "pre-wrap",
                  overflow: "hidden",
                }}
              >
                {useCellSampledPreview ? placement.text : isEditing ? null : placement.text}
              </div>
            )}
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
                  top: `${displayBounds.top}px`,
                  left: `${displayBounds.left}px`,
                  width: `${displayBounds.width}px`,
                  height: `${displayBounds.height}px`,
                  transform: getRotationCss(displayTransform.rotation),
                  transformOrigin: "center center",
                  willChange: "left, top, width, height, transform",
                  resize: "none",
                  border: "none",
                  background: "transparent",
                  color: useCellSampledPreview ? "transparent" : previewColor,
                  textShadow: useCellSampledPreview
                    ? "none"
                    : "0 1px 0 rgba(255,255,255,0.55)",
                  fontFamily: `${placement.fontFamily}, sans-serif`,
                  fontWeight: placement.fontWeight,
                  fontStyle: placement.fontStyle,
                  fontSize: `${fontSize * displayTransform.scale}px`,
                  lineHeight: 1.1,
                  textAlign: "center",
                  textDecoration: placement.underline ? "underline" : "none",
                  paddingTop: verticalPadding * displayTransform.scale,
                  paddingBottom: verticalPadding * displayTransform.scale,
                  paddingLeft: 6 * displayTransform.scale,
                  paddingRight: 6 * displayTransform.scale,
                  boxSizing: "border-box",
                  overflow: "hidden",
                  outline: "none",
                  whiteSpace: "pre-wrap",
                  caretColor: "#2563eb",
                  cursor: "text",
                  caretShape: "bar",
                  WebkitTextFillColor: useCellSampledPreview ? "transparent" : previewColor,
                }}
              />
            </>
          ) : null}

          {isEditing ? null : (
            <PositioningBoxOverlay
              ariaLabel="Text placement controls"
              baseRect={baseRect}
              bounds={displayBounds}
              getWorldPointFromClient={getWorldPointFromClient}
              onClick={() => setIsEditing(true)}
              onTransformCommit={handleTransformCommit}
              onTransformPreview={handleTransformPreview}
              transactionKeyPrefix="text-drag"
              transform={displayTransform}
              zoom={zoom}
            />
          )}
        </div>
      ) : null}
    </>
  );
}

function applyTextPreviewBox(
  element: HTMLElement,
  bounds: { left: number; top: number; width: number; height: number },
  rotation: number,
): void {
  element.style.left = `${bounds.left}px`;
  element.style.top = `${bounds.top}px`;
  element.style.width = `${bounds.width}px`;
  element.style.height = `${bounds.height}px`;
  element.style.transform = getRotationCss(rotation);
}
