"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EditorStore, TextPlacementSession } from "@/lib/editor-v2/editor/store";
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
  previewColor: string;
  zoom: number;
}

export function TextPlacementLayer({
  dispatch,
  getWorldPointFromClient,
  metrics,
  placement,
  previewColor,
  zoom,
}: TextPlacementLayerProps) {
  const [isEditing, setIsEditing] = useState(true);
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
  const previewTextRef = useRef<HTMLDivElement | null>(null);
  const textareaPreviewRef = useRef<HTMLTextAreaElement | null>(null);
  const handleTransformPreview = useCallback((nextTransform: typeof transform) => {
    const nextStyle = getPositioningTransformCss(nextTransform);
    if (previewTextRef.current) {
      previewTextRef.current.style.transform = nextStyle;
    }
    if (textareaPreviewRef.current) {
      textareaPreviewRef.current.style.transform = nextStyle;
    }
  }, []);
  const handleTransformCommit = useCallback(
    (nextTransform: typeof transform) => {
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
    const length = textarea.value.length;
    textarea.setSelectionRange(length, length);
  }, [isEditing]);

  return (
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
  );
}
