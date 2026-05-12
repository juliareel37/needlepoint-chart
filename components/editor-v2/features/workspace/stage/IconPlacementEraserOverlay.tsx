"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLocalPointWithinRotatedBounds } from "@/lib/editor-v2/editor/positioning";
import { loadMaskableImage } from "@/lib/editor-v2/editor/imageMasking";
import { isMaskCanvasFullyVisible } from "@/lib/editor-v2/editor/trace/mask";

const MIN_IMAGE_FRACTION = 0.01;
const MAX_IMAGE_FRACTION = 0.35;

function getBrushDiameter(
  sliderValue: number,
  dimensions: { width: number; height: number },
): number {
  const normalizedSliderValue = Number.isFinite(sliderValue)
    ? Math.min(Math.max(sliderValue, 1), 10)
    : 1;
  const normalizedPercent = (normalizedSliderValue - 1) / 9;
  const imageFraction =
    MIN_IMAGE_FRACTION + normalizedPercent * (MAX_IMAGE_FRACTION - MIN_IMAGE_FRACTION);
  const maxImageDimension = Math.max(dimensions.width, dimensions.height, 1);

  return Math.max(4, Math.round(maxImageDimension * imageFraction));
}

interface IconPlacementEraserOverlayProps {
  bounds: { left: number; top: number; width: number; height: number };
  brushPreviewVisible: boolean;
  brushSize: number;
  displaySrc: string;
  draftMaskUrl: string | null;
  draftRevision: number;
  imageOpacity: number;
  intrinsicHeight: number;
  intrinsicWidth: number;
  mode: "erase" | "restore";
  onMaskChange: (nextMaskUrl: string | null, isFullyVisible: boolean) => void;
  rotation: number;
  stageHeight: number;
  stageWidth: number;
}

export function IconPlacementEraserOverlay({
  bounds,
  brushPreviewVisible,
  brushSize,
  displaySrc,
  draftMaskUrl,
  draftRevision,
  imageOpacity,
  intrinsicHeight,
  intrinsicWidth,
  mode,
  onMaskChange,
  rotation,
  stageHeight,
  stageWidth,
}: IconPlacementEraserOverlayProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const composedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [maskSeeded, setMaskSeeded] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [brushPreviewPoint, setBrushPreviewPoint] = useState<{ x: number; y: number } | null>(null);

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
    let cancelled = false;

    void loadMaskableImage(displaySrc)
      .then((image) => {
        if (!cancelled) {
          sourceImageRef.current = image;
          renderOverlay();
        }
      })
      .catch(() => {
        if (!cancelled) {
          sourceImageRef.current = null;
        }
      });

    return () => {
      cancelled = true;
      sourceImageRef.current = null;
    };
  }, [displaySrc]);

  useEffect(() => {
    setMaskSeeded(false);
  }, [draftRevision]);

  const renderOverlay = useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const sourceImage = sourceImageRef.current;

    if (!overlayCanvas || !maskCanvas || !sourceImage) {
      return;
    }

    const context = overlayCanvas.getContext("2d");
    if (!context) {
      return;
    }

    const composedCanvas = composedCanvasRef.current ?? document.createElement("canvas");
    composedCanvasRef.current = composedCanvas;
    composedCanvas.width = Math.max(1, intrinsicWidth);
    composedCanvas.height = Math.max(1, intrinsicHeight);

    const composedContext = composedCanvas.getContext("2d");
    if (!composedContext) {
      return;
    }

    composedContext.clearRect(0, 0, intrinsicWidth, intrinsicHeight);
    composedContext.globalCompositeOperation = "source-over";
    composedContext.drawImage(sourceImage, 0, 0, intrinsicWidth, intrinsicHeight);
    composedContext.globalCompositeOperation = "destination-in";
    composedContext.drawImage(maskCanvas, 0, 0, intrinsicWidth, intrinsicHeight);
    composedContext.globalCompositeOperation = "source-over";

    const devicePixelRatio = window.devicePixelRatio || 1;
    const canvasWidth = Math.max(1, Math.round(stageWidth * devicePixelRatio));
    const canvasHeight = Math.max(1, Math.round(stageHeight * devicePixelRatio));

    if (overlayCanvas.width !== canvasWidth || overlayCanvas.height !== canvasHeight) {
      overlayCanvas.width = canvasWidth;
      overlayCanvas.height = canvasHeight;
      overlayCanvas.style.width = `${stageWidth}px`;
      overlayCanvas.style.height = `${stageHeight}px`;
    }

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, stageWidth, stageHeight);
    context.fillStyle = "rgba(190, 24, 24, 0.28)";
    context.fillRect(0, 0, stageWidth, stageHeight);

    context.save();
    context.globalCompositeOperation = "destination-out";
    context.translate(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.drawImage(
      composedCanvas,
      0,
      0,
      intrinsicWidth,
      intrinsicHeight,
      -bounds.width / 2,
      -bounds.height / 2,
      bounds.width,
      bounds.height,
    );
    context.restore();

    context.save();
    context.globalAlpha = Math.min(Math.max(imageOpacity, 0), 1);
    context.translate(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.drawImage(
      composedCanvas,
      0,
      0,
      intrinsicWidth,
      intrinsicHeight,
      -bounds.width / 2,
      -bounds.height / 2,
      bounds.width,
      bounds.height,
    );
    context.restore();
  }, [
    bounds.height,
    bounds.left,
    bounds.top,
    bounds.width,
    imageOpacity,
    intrinsicHeight,
    intrinsicWidth,
    rotation,
    stageHeight,
    stageWidth,
  ]);

  useEffect(() => {
    const maskCanvas = maskCanvasRef.current ?? document.createElement("canvas");
    maskCanvasRef.current = maskCanvas;
    maskCanvas.width = Math.max(1, intrinsicWidth);
    maskCanvas.height = Math.max(1, intrinsicHeight);

    const context = maskCanvas.getContext("2d");
    if (!context) {
      return;
    }

    if (!draftMaskUrl) {
      context.clearRect(0, 0, intrinsicWidth, intrinsicHeight);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, intrinsicWidth, intrinsicHeight);
      setMaskSeeded(true);
      renderOverlay();
      return;
    }

    let cancelled = false;
    void loadMaskableImage(draftMaskUrl)
      .then((image) => {
        if (cancelled) {
          return;
        }

        context.clearRect(0, 0, intrinsicWidth, intrinsicHeight);
        context.drawImage(image, 0, 0, intrinsicWidth, intrinsicHeight);
        setMaskSeeded(true);
        renderOverlay();
      })
      .catch(() => {
        if (!cancelled) {
          setMaskSeeded(true);
          renderOverlay();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [draftMaskUrl, intrinsicHeight, intrinsicWidth, renderOverlay]);

  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

  const commitDraft = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) {
      onMaskChange(null, true);
      return;
    }

    const isFullyVisible = isMaskCanvasFullyVisible(maskCanvas);
    onMaskChange(isFullyVisible ? null : maskCanvas.toDataURL("image/png"), isFullyVisible);
  }, [onMaskChange]);

  const drawAtClientPoint = useCallback(
    (clientX: number, clientY: number, connectFromLast: boolean) => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas || !maskSeeded) {
        return false;
      }

      const context = maskCanvas.getContext("2d");
      if (!context) {
        return false;
      }

      const localPoint = getLocalPointWithinRotatedBounds(
        { x: clientX, y: clientY },
        bounds,
        rotation,
      );

      if (
        localPoint.x < 0 ||
        localPoint.y < 0 ||
        localPoint.x > bounds.width ||
        localPoint.y > bounds.height
      ) {
        return false;
      }

      const scaleX = intrinsicWidth / Math.max(bounds.width, 1);
      const scaleY = intrinsicHeight / Math.max(bounds.height, 1);
      const point = {
        x: localPoint.x * scaleX,
        y: localPoint.y * scaleY,
      };
      const brushDiameter = getBrushDiameter(brushSize, {
        width: intrinsicWidth,
        height: intrinsicHeight,
      });
      const brushRadius = (brushDiameter * Math.max(scaleX, scaleY)) / 2;

      context.save();
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = Math.max(1, brushRadius * 2);
      context.strokeStyle = "#ffffff";
      context.fillStyle = "#ffffff";
      context.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";

      if (connectFromLast && lastPointRef.current) {
        context.beginPath();
        context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        context.lineTo(point.x, point.y);
        context.stroke();
      } else {
        context.beginPath();
        context.arc(point.x, point.y, Math.max(0.5, brushRadius), 0, Math.PI * 2);
        context.fill();
      }

      context.restore();
      lastPointRef.current = point;
      renderOverlay();
      return true;
    },
    [
      bounds,
      brushSize,
      intrinsicHeight,
      intrinsicWidth,
      maskSeeded,
      mode,
      renderOverlay,
      rotation,
    ],
  );

  const brushPreviewRadius = getBrushDiameter(brushSize, {
    width: intrinsicWidth,
    height: intrinsicHeight,
  }) / 2;

  return (
    <>
      <canvas
        ref={overlayCanvasRef}
        onPointerDown={(event) => {
          activePointerIdRef.current = event.pointerId;
          lastPointRef.current = null;
          setBrushPreviewPoint({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
          event.currentTarget.setPointerCapture(event.pointerId);
          drawAtClientPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY, false);
        }}
        onPointerMove={(event) => {
          setBrushPreviewPoint({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
          if (activePointerIdRef.current !== event.pointerId) {
            return;
          }

          drawAtClientPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY, true);
        }}
        onPointerEnter={(event) => {
          setBrushPreviewPoint({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
        }}
        onPointerLeave={() => {
          if (activePointerIdRef.current === null) {
            setBrushPreviewPoint(null);
          }
        }}
        onPointerUp={(event) => {
          if (activePointerIdRef.current !== event.pointerId) {
            return;
          }

          activePointerIdRef.current = null;
          lastPointRef.current = null;
          setBrushPreviewPoint({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
          event.currentTarget.releasePointerCapture(event.pointerId);
          commitDraft();
        }}
        onPointerCancel={(event) => {
          if (activePointerIdRef.current !== event.pointerId) {
            return;
          }

          activePointerIdRef.current = null;
          lastPointRef.current = null;
          setBrushPreviewPoint(null);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          commitDraft();
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 11,
          width: `${stageWidth}px`,
          height: `${stageHeight}px`,
          touchAction: "none",
          cursor: coarsePointer ? "url('/paint-brush-cursor.cur') 0 24, crosshair" : "none",
        }}
      />
      {!coarsePointer && brushPreviewPoint ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${brushPreviewPoint.x}px`,
            top: `${brushPreviewPoint.y}px`,
            width: `${brushPreviewRadius * 2}px`,
            height: `${brushPreviewRadius * 2}px`,
            transform: "translate(-50%, -50%)",
            borderRadius: "999px",
            border: "1.5px solid rgba(255, 255, 255, 0.96)",
            boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.42)",
            background: "rgba(255, 255, 255, 0.08)",
            pointerEvents: "none",
            zIndex: 12,
          }}
        />
      ) : null}
      {brushPreviewVisible ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${brushPreviewRadius * 2}px`,
            height: `${brushPreviewRadius * 2}px`,
            transform: "translate(-50%, -50%)",
            borderRadius: "999px",
            border: "2px solid rgba(255, 255, 255, 0.98)",
            boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.52)",
            background: "rgba(255, 255, 255, 0.12)",
            pointerEvents: "none",
            zIndex: 13,
          }}
        />
      ) : null}
    </>
  );
}
