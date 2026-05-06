"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { PositioningDragMode, PositioningRect } from "@/lib/editor-v2/editor/positioning";
import {
  getCenterSnappedPosition,
  getHandleLeft,
  getHandleTop,
  getResizeSnappedBounds,
  getSnappedRotationDegrees,
  getRotationSnapTarget,
  getRotationCss,
  POSITIONING_HANDLES,
  type PositioningMoveSnapState,
  type PositioningPinchState,
} from "@/lib/editor-v2/editor/positioning";
import type { WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getIconPlacementBounds,
  getIconPlacementTransformFromDrag,
  getIconPlacementTransformFromPinch,
  type IconPlacementDragState,
  type IconPlacementTransform,
} from "@/lib/editor-v2/editor/icons/iconPlacementGeometry";

interface IconPlacementBoxOverlayProps {
  ariaLabel: string;
  baseRect: PositioningRect;
  bounds: PositioningRect;
  interactionBounds?: PositioningRect;
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  onTransformCommit?: (
    transform: IconPlacementTransform,
    transactionKey: string,
  ) => void;
  onTransformPreview?: (transform: IconPlacementTransform) => void;
  snapContainerBounds?: PositioningRect;
  snapGuideContainerBounds?: PositioningRect;
  snapGuideZoom?: number;
  snapZoom?: number;
  projectBoundsForPreview?: (
    transform: IconPlacementTransform,
    baseRect: PositioningRect,
  ) => PositioningRect;
  touchSnappingEnabled?: boolean;
  transform: IconPlacementTransform;
  transactionKeyPrefix: string;
  zoom: number;
}

interface DragSession {
  pointerId: number;
  mode: PositioningDragMode;
  transactionKey: string;
  drag: IconPlacementDragState;
  dragThreshold: number;
  dragged: boolean;
  startClientX: number;
  startClientY: number;
  pendingClientX: number;
  pendingClientY: number;
  rafId: number | null;
  moveSnap: PositioningMoveSnapState;
  isTouchInteraction: boolean;
  rotationSnap: number | null;
  snappingModifierPressed: boolean;
}

interface HandleElements {
  hit: HTMLDivElement | null;
  visible: HTMLDivElement | null;
}

interface PinchSession {
  pinch: PositioningPinchState;
  pointerIds: [number, number];
  snappingEnabled: boolean;
  startTransform: IconPlacementTransform;
}

const DRAG_THRESHOLD = 4;
const TOUCH_HANDLE_TARGET_SIZE = 36;
const TOUCH_HANDLE_DRAG_THRESHOLD = 2;
const ROTATE_HANDLE_OFFSET = 24;

export function IconPlacementBoxOverlay({
  ariaLabel,
  baseRect,
  bounds,
  interactionBounds,
  getWorldPointFromClient,
  onTransformCommit,
  onTransformPreview,
  snapContainerBounds,
  snapGuideContainerBounds,
  snapGuideZoom = 1,
  snapZoom,
  projectBoundsForPreview,
  touchSnappingEnabled = true,
  transform,
  transactionKeyPrefix,
  zoom,
}: IconPlacementBoxOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const handleRefs = useRef<Record<string, HandleElements>>({});
  const rotateHandleRef = useRef<HandleElements>({ hit: null, visible: null });
  const dragSequenceRef = useRef(0);
  const dragSessionRef = useRef<DragSession | null>(null);
  const pinchSessionRef = useRef<PinchSession | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const touchPointsRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const [coarsePointer, setCoarsePointer] = useState(false);
  const latestBoundsRef = useRef(interactionBounds ?? bounds);
  const latestBaseRectRef = useRef(baseRect);
  const latestTransformRef = useRef(transform);
  const latestGetWorldPointFromClientRef = useRef(getWorldPointFromClient);
  const latestOnTransformPreviewRef = useRef(onTransformPreview);
  const latestOnTransformCommitRef = useRef(onTransformCommit);
  const latestProjectBoundsForPreviewRef = useRef(projectBoundsForPreview);
  const latestSnapContainerBoundsRef = useRef(snapContainerBounds);
  const latestTouchSnappingEnabledRef = useRef(touchSnappingEnabled);
  const resolvedSnapZoom = snapZoom ?? zoom;
  const latestSnapZoomRef = useRef(resolvedSnapZoom);
  const [activeMoveSnap, setActiveMoveSnap] = useState<PositioningMoveSnapState>({
    left: null,
    right: null,
    top: null,
    bottom: null,
    centerX: null,
    centerY: null,
  });
  const controlScale = zoom > 0 ? 1 / zoom : 1;
  const handleSize = 14 * controlScale;
  const handleHitSize = coarsePointer
    ? Math.max(handleSize, TOUCH_HANDLE_TARGET_SIZE)
    : handleSize;
  const outlineWidth = Math.max(1, 1.5 * controlScale);
  const handleBorderWidth = Math.max(1, 1.25 * controlScale);
  const guideThickness = Math.max(1, 1 / Math.max(snapGuideZoom, 0.0001));
  const edgeGuideInset = guideThickness;

  useEffect(() => {
    latestBaseRectRef.current = baseRect;
  }, [baseRect]);

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
    latestBoundsRef.current = interactionBounds ?? bounds;
    if (!dragSessionRef.current && !pinchSessionRef.current) {
      applyPreviewBounds(
        overlayRef.current,
        handleRefs.current,
        rotateHandleRef.current,
        bounds,
        transform.rotation,
        handleSize,
        handleHitSize,
      );
    }
  }, [bounds, handleHitSize, handleSize, interactionBounds]);

  useEffect(() => {
    latestTransformRef.current = transform;
    setActiveMoveSnap(emptyMoveSnap());
  }, [transform]);

  useEffect(() => {
    latestGetWorldPointFromClientRef.current = getWorldPointFromClient;
  }, [getWorldPointFromClient]);

  useEffect(() => {
    latestOnTransformPreviewRef.current = onTransformPreview;
  }, [onTransformPreview]);

  useEffect(() => {
    latestOnTransformCommitRef.current = onTransformCommit;
  }, [onTransformCommit]);

  useEffect(() => {
    latestProjectBoundsForPreviewRef.current = projectBoundsForPreview;
  }, [projectBoundsForPreview]);

  useEffect(() => {
    latestSnapContainerBoundsRef.current = snapContainerBounds;
  }, [snapContainerBounds]);

  useEffect(() => {
    latestTouchSnappingEnabledRef.current = touchSnappingEnabled;
  }, [touchSnappingEnabled]);

  useEffect(() => {
    latestSnapZoomRef.current = resolvedSnapZoom;
  }, [resolvedSnapZoom]);

  useEffect(() => {
    return () => {
      if (frameIdRef.current !== null) {
        window.cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleWindowPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" && touchPointsRef.current.has(event.pointerId)) {
        touchPointsRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }

      if (pinchSessionRef.current?.pointerIds.includes(event.pointerId)) {
        scheduleFrame();
        return;
      }

      const session = dragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      session.pendingClientX = event.clientX;
      session.pendingClientY = event.clientY;
      session.snappingModifierPressed = isSnappingModifierPressed(event);
      scheduleFrame();
    };

    const handleWindowPointerEnd = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        touchPointsRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }

      if (pinchSessionRef.current?.pointerIds.includes(event.pointerId)) {
        finalizePinch(event.pointerId);
        return;
      }

      if (event.pointerType === "touch") {
        touchPointsRef.current.delete(event.pointerId);
      }

      finalizePointerEnd(event.pointerId, event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, []);

  function scheduleFrame() {
    if (frameIdRef.current !== null) {
      return;
    }

    frameIdRef.current = window.requestAnimationFrame(() => {
      frameIdRef.current = null;

      const activeSession = dragSessionRef.current;
      if (activeSession) {
        flushPreview(activeSession);
        return;
      }

      flushPinchPreview();
    });
  }

  function flushPreview(session: DragSession): IconPlacementTransform {
    const nextClientX = session.pendingClientX;
    const nextClientY = session.pendingClientY;

    if (
      !session.dragged &&
      Math.hypot(nextClientX - session.startClientX, nextClientY - session.startClientY) >=
        session.dragThreshold
    ) {
      session.dragged = true;
      if ((session.mode === "move" || session.mode === "rotate") && overlayRef.current) {
        overlayRef.current.style.cursor = "grabbing";
      }
    }

    const worldPoint = latestGetWorldPointFromClientRef.current(nextClientX, nextClientY);
    if (!worldPoint) {
      return latestTransformRef.current;
    }

    let nextTransform = getIconPlacementTransformFromDrag(
      session.drag,
      worldPoint,
      latestBaseRectRef.current,
    );

    const snappingEnabled = isDragSnappingEnabled(
      session,
      session.mode,
      latestTouchSnappingEnabledRef.current,
    );

    if (session.mode === "rotate") {
      if (!snappingEnabled) {
        session.rotationSnap = null;
      } else {
        session.rotationSnap = getRotationSnapTarget(
          nextTransform.rotation,
          session.rotationSnap,
        );
        nextTransform = {
          ...nextTransform,
          rotation: getSnappedRotationDegrees(
            nextTransform.rotation,
            session.rotationSnap,
          ),
        };
      }
    }

    if (
      session.mode === "move" &&
      latestSnapContainerBoundsRef.current &&
      snappingEnabled
    ) {
      const rawBounds = getIconPlacementBounds(
        latestBaseRectRef.current,
        nextTransform,
      );
      const snappedPosition = getCenterSnappedPosition(
        rawBounds,
        latestSnapContainerBoundsRef.current,
        session.moveSnap,
        latestSnapZoomRef.current,
      );

      nextTransform = {
        ...nextTransform,
        offsetX: nextTransform.offsetX + snappedPosition.offsetX,
        offsetY: nextTransform.offsetY + snappedPosition.offsetY,
      };
      session.moveSnap = snappedPosition.snap;
      setActiveMoveSnap(snappedPosition.snap);
    } else if (
      session.dragged &&
      session.mode !== "move" &&
      session.mode !== "rotate" &&
      latestSnapContainerBoundsRef.current &&
      snappingEnabled
    ) {
      const rawBounds = getIconPlacementBounds(
        latestBaseRectRef.current,
        nextTransform,
      );
      const snappedBounds = getResizeSnappedBounds(
        session.drag.startBounds,
        rawBounds,
        session.mode,
        latestSnapContainerBoundsRef.current,
        session.moveSnap,
        latestSnapZoomRef.current,
      );

      nextTransform = {
        ...nextTransform,
        offsetX: snappedBounds.bounds.left - latestBaseRectRef.current.left,
        offsetY: snappedBounds.bounds.top - latestBaseRectRef.current.top,
        scaleX: snappedBounds.bounds.width / latestBaseRectRef.current.width,
        scaleY: snappedBounds.bounds.height / latestBaseRectRef.current.height,
      };
      session.moveSnap = snappedBounds.snap;
      setActiveMoveSnap(snappedBounds.snap);
    } else {
      session.moveSnap = emptyMoveSnap();
      setActiveMoveSnap(emptyMoveSnap());
    }

    const nextInteractionBounds = getIconPlacementBounds(
      latestBaseRectRef.current,
      nextTransform,
    );
    const nextBounds =
      latestProjectBoundsForPreviewRef.current?.(
        nextTransform,
        latestBaseRectRef.current,
      ) ?? nextInteractionBounds;

    latestTransformRef.current = nextTransform;
    latestBoundsRef.current = nextInteractionBounds;
    applyPreviewBounds(
      overlayRef.current,
      handleRefs.current,
      rotateHandleRef.current,
      nextBounds,
      nextTransform.rotation,
      handleSize,
      handleHitSize,
    );
    latestOnTransformPreviewRef.current?.(nextTransform);

    return nextTransform;
  }

  function flushPinchPreview(): IconPlacementTransform | null {
    const pinchSession = pinchSessionRef.current;
    if (!pinchSession) {
      return null;
    }

    const firstTouch = touchPointsRef.current.get(pinchSession.pointerIds[0]);
    const secondTouch = touchPointsRef.current.get(pinchSession.pointerIds[1]);
    if (!firstTouch || !secondTouch) {
      return latestTransformRef.current;
    }

    const centerClientX = (firstTouch.clientX + secondTouch.clientX) / 2;
    const centerClientY = (firstTouch.clientY + secondTouch.clientY) / 2;
    const worldCenter = latestGetWorldPointFromClientRef.current(centerClientX, centerClientY);
    if (!worldCenter) {
      return latestTransformRef.current;
    }

    const nextDistance = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );
    const nextAngle = Math.atan2(
      secondTouch.clientY - firstTouch.clientY,
      secondTouch.clientX - firstTouch.clientX,
    );
    const rawRotation =
      pinchSession.pinch.startTransform.rotation +
      ((nextAngle - pinchSession.pinch.startAngle) * 180) / Math.PI;
    pinchSession.pinch.snapRotation = pinchSession.snappingEnabled
      ? getRotationSnapTarget(rawRotation, pinchSession.pinch.snapRotation)
      : null;
    const nextTransform = getIconPlacementTransformFromPinch(
      pinchSession.pinch,
      worldCenter,
      nextDistance,
      nextAngle,
      latestBaseRectRef.current,
      pinchSession.startTransform,
    );
    const nextInteractionBounds = getIconPlacementBounds(
      latestBaseRectRef.current,
      nextTransform,
    );
    const nextBounds =
      latestProjectBoundsForPreviewRef.current?.(
        nextTransform,
        latestBaseRectRef.current,
      ) ?? nextInteractionBounds;

    latestTransformRef.current = nextTransform;
    latestBoundsRef.current = nextInteractionBounds;
    applyPreviewBounds(
      overlayRef.current,
      handleRefs.current,
      rotateHandleRef.current,
      nextBounds,
      nextTransform.rotation,
      handleSize,
      handleHitSize,
    );
    latestOnTransformPreviewRef.current?.(nextTransform);

    return nextTransform;
  }

  function beginPinch(overlayElement: HTMLDivElement) {
    const activeTouches = Array.from(touchPointsRef.current.entries());
    if (activeTouches.length < 2) {
      return;
    }

    const [[firstPointerId, firstTouch], [secondPointerId, secondTouch]] = activeTouches;
    const centerClientX = (firstTouch.clientX + secondTouch.clientX) / 2;
    const centerClientY = (firstTouch.clientY + secondTouch.clientY) / 2;
    const worldCenter = latestGetWorldPointFromClientRef.current(centerClientX, centerClientY);
    if (!worldCenter) {
      return;
    }

    const startBounds = latestBoundsRef.current;
    const width = Math.max(startBounds.width, 0.0001);
    const height = Math.max(startBounds.height, 0.0001);
    const startClientDistance = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );

    pinchSessionRef.current = {
      pinch: {
        anchorX: (worldCenter.x - startBounds.left) / width,
        anchorY: (worldCenter.y - startBounds.top) / height,
        startDistance: startClientDistance,
        startAngle: Math.atan2(
          secondTouch.clientY - firstTouch.clientY,
          secondTouch.clientX - firstTouch.clientX,
        ),
        snapRotation: latestTouchSnappingEnabledRef.current
          ? getRotationSnapTarget(latestTransformRef.current.rotation, null)
          : null,
        startTransform: {
          offsetX: latestTransformRef.current.offsetX,
          offsetY: latestTransformRef.current.offsetY,
          scale: 1,
          rotation: latestTransformRef.current.rotation,
        },
      },
      pointerIds: [firstPointerId, secondPointerId],
      snappingEnabled: latestTouchSnappingEnabledRef.current,
      startTransform: latestTransformRef.current,
    };

    const activeDragSession = dragSessionRef.current;
    if (frameIdRef.current !== null) {
      window.cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
    dragSessionRef.current = null;
    setActiveMoveSnap(emptyMoveSnap());
    overlayElement.style.cursor = "grab";
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>, mode: PositioningDragMode) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const worldPoint = latestGetWorldPointFromClientRef.current(event.clientX, event.clientY);
    if (!worldPoint) {
      return;
    }

    const overlayElement = overlayRef.current;
    if (!overlayElement) {
      return;
    }

    if (event.pointerType === "touch") {
      touchPointsRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (touchPointsRef.current.size === 2) {
        overlayElement.setPointerCapture(event.pointerId);
        beginPinch(overlayElement);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }

    dragSequenceRef.current += 1;
    if (mode !== "move") {
      setActiveMoveSnap(emptyMoveSnap());
    }
    const transactionKey = `${transactionKeyPrefix}-${dragSequenceRef.current}`;
    dragSessionRef.current = {
      pointerId: event.pointerId,
      mode,
      transactionKey,
      drag: {
        mode,
        startPoint: worldPoint,
        startTransform: latestTransformRef.current,
        startBounds: latestBoundsRef.current,
        transactionKey,
      },
      dragThreshold:
        event.pointerType === "touch" && mode !== "move"
          ? TOUCH_HANDLE_DRAG_THRESHOLD
          : DRAG_THRESHOLD,
      dragged: false,
      startClientX: event.clientX,
      startClientY: event.clientY,
      pendingClientX: event.clientX,
      pendingClientY: event.clientY,
      rafId: null,
      moveSnap: emptyMoveSnap(),
      isTouchInteraction: event.pointerType === "touch",
      rotationSnap:
        mode === "rotate" && event.pointerType !== "touch"
          ? getRotationSnapTarget(latestTransformRef.current.rotation, null)
          : null,
      snappingModifierPressed: isSnappingModifierPressed(event.nativeEvent),
    };

    overlayElement.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function finalizePointerEnd(pointerId: number, clientX: number, clientY: number) {
    const session = dragSessionRef.current;
    if (!session || pointerId !== session.pointerId) {
      return;
    }

    if (frameIdRef.current !== null) {
      window.cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }

    session.pendingClientX = clientX;
    session.pendingClientY = clientY;
    const committedTransform = flushPreview(session);

    if (session.dragged) {
      latestOnTransformCommitRef.current?.(committedTransform, session.transactionKey);
    }

    if (overlayRef.current) {
      overlayRef.current.style.cursor = session.mode === "rotate" ? "crosshair" : "grab";
    }

    dragSessionRef.current = null;
    setActiveMoveSnap(emptyMoveSnap());
    try {
      if (overlayRef.current?.hasPointerCapture(pointerId)) {
        overlayRef.current.releasePointerCapture(pointerId);
      }
    } catch {
      // Ignore release errors during teardown.
    }
  }

  function finalizePinch(pointerId: number) {
    const pinchSession = pinchSessionRef.current;
    if (!pinchSession || !pinchSession.pointerIds.includes(pointerId)) {
      return;
    }

    const committedTransform = flushPinchPreview();
    pinchSessionRef.current = null;
    touchPointsRef.current.clear();
    setActiveMoveSnap(emptyMoveSnap());
    try {
      if (overlayRef.current?.hasPointerCapture(pointerId)) {
        overlayRef.current.releasePointerCapture(pointerId);
      }
    } catch {
      // Ignore release errors during teardown.
    }

    if (committedTransform) {
      latestOnTransformCommitRef.current?.(
        committedTransform,
        `${transactionKeyPrefix}-pinch-${dragSequenceRef.current + 1}`,
      );
      dragSequenceRef.current += 1;
    }
  }

  return (
    <>
      {snapGuideContainerBounds &&
      (activeMoveSnap.centerY !== null ||
        activeMoveSnap.top !== null ||
        activeMoveSnap.bottom !== null) ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${snapGuideContainerBounds.left}px`,
            top: `${getHorizontalGuideTop(
              snapGuideContainerBounds,
              activeMoveSnap,
              guideThickness,
              edgeGuideInset,
            )}px`,
            width: `${snapGuideContainerBounds.width}px`,
            height: `${guideThickness}px`,
            background: "rgba(37, 99, 235, 0.95)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.72)",
            pointerEvents: "none",
            zIndex: 11,
          }}
        />
      ) : null}
      {snapGuideContainerBounds &&
      (activeMoveSnap.centerX !== null ||
        activeMoveSnap.left !== null ||
        activeMoveSnap.right !== null) ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${getVerticalGuideLeft(
              snapGuideContainerBounds,
              activeMoveSnap,
              guideThickness,
              edgeGuideInset,
            )}px`,
            top: `${snapGuideContainerBounds.top}px`,
            width: `${guideThickness}px`,
            height: `${snapGuideContainerBounds.height}px`,
            background: "rgba(37, 99, 235, 0.95)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.72)",
            pointerEvents: "none",
            zIndex: 11,
          }}
        />
      ) : null}
      <div
        ref={overlayRef}
        aria-label={ariaLabel}
        data-touch-gesture-scope="element"
        role="presentation"
        style={{
          position: "absolute",
          left: `${bounds.left}px`,
          top: `${bounds.top}px`,
          width: `${bounds.width}px`,
          height: `${bounds.height}px`,
          transform: getRotationCss(transform.rotation),
          transformOrigin: "center center",
          cursor: "grab",
          userSelect: "none",
          WebkitUserSelect: "none",
          pointerEvents: "auto",
          touchAction: "none",
        }}
        onPointerDown={(event) => beginDrag(event, "move")}
      >
      <div
        ref={(node) => {
          rotateHandleRef.current = { ...rotateHandleRef.current, hit: node };
        }}
        role="presentation"
        aria-hidden="true"
        onPointerDown={(event) => beginDrag(event, "rotate")}
        style={{
          position: "absolute",
          left: `${bounds.width / 2 - handleHitSize / 2}px`,
          top: `${-ROTATE_HANDLE_OFFSET * controlScale - handleHitSize / 2}px`,
          width: `${handleHitSize}px`,
          height: `${handleHitSize}px`,
          cursor: "crosshair",
          WebkitTapHighlightColor: "transparent",
          background: "transparent",
        }}
      />
      <div
        ref={(node) => {
          rotateHandleRef.current = { ...rotateHandleRef.current, visible: node };
        }}
        role="presentation"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: `${bounds.width / 2 - handleSize / 2}px`,
          top: `${-ROTATE_HANDLE_OFFSET * controlScale - handleSize / 2}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          borderRadius: "999px",
          backgroundColor: "#ffffff",
          backgroundImage: "url('/icons/lucide/rotate-cw.svg')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: `${Math.max(8, handleSize * 0.6)}px ${Math.max(8, handleSize * 0.6)}px`,
          border: `${handleBorderWidth}px solid #2563eb`,
          boxSizing: "border-box",
          cursor: "crosshair",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          border: `${outlineWidth}px solid rgba(37, 99, 235, 0.95)`,
          background: "transparent",
        }}
      />

      {POSITIONING_HANDLES.map((handle) => (
        <div key={handle.id}>
          <div
            ref={(node) => {
              const existing = handleRefs.current[handle.id] ?? {
                hit: null,
                visible: null,
              };
              handleRefs.current[handle.id] = { ...existing, hit: node };
            }}
            role="presentation"
            aria-hidden="true"
            onPointerDown={(event) => beginDrag(event, handle.id)}
            style={{
              position: "absolute",
              left: `${getHandleLeft(handle.id, bounds.width, handleSize) - (handleHitSize - handleSize) / 2}px`,
              top: `${getHandleTop(handle.id, bounds.height, handleSize) - (handleHitSize - handleSize) / 2}px`,
              width: `${handleHitSize}px`,
              height: `${handleHitSize}px`,
              cursor: handle.cursor,
              WebkitTapHighlightColor: "transparent",
              background: "transparent",
            }}
          />
          <div
            ref={(node) => {
              const existing = handleRefs.current[handle.id] ?? {
                hit: null,
                visible: null,
              };
              handleRefs.current[handle.id] = { ...existing, visible: node };
            }}
            role="presentation"
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${getHandleLeft(handle.id, bounds.width, handleSize)}px`,
              top: `${getHandleTop(handle.id, bounds.height, handleSize)}px`,
              width: `${handleSize}px`,
              height: `${handleSize}px`,
              borderRadius: handle.kind === "edge" ? `${4 * controlScale}px` : "999px",
              background: "#ffffff",
              border: `${handleBorderWidth}px solid #2563eb`,
              cursor: handle.cursor,
              pointerEvents: "none",
            }}
          />
        </div>
      ))}
      </div>
    </>
  );
}

function emptyMoveSnap(): PositioningMoveSnapState {
  return {
    left: null,
    right: null,
    top: null,
    bottom: null,
    centerX: null,
    centerY: null,
  };
}

function isSnappingModifierPressed(
  event: Pick<PointerEvent, "metaKey" | "ctrlKey">,
): boolean {
  return event.metaKey || event.ctrlKey;
}

function isDragSnappingEnabled(
  session: DragSession,
  mode: PositioningDragMode,
  touchSnappingEnabled: boolean,
): boolean {
  if (session.isTouchInteraction) {
    return mode === "rotate" ? false : touchSnappingEnabled;
  }

  return !session.snappingModifierPressed;
}

function getHorizontalGuideTop(
  bounds: PositioningRect,
  snap: PositioningMoveSnapState,
  guideThickness: number,
  edgeGuideInset: number,
): number {
  if (snap.top !== null) {
    return bounds.top + edgeGuideInset;
  }

  if (snap.bottom !== null) {
    return bounds.top + bounds.height - edgeGuideInset - guideThickness;
  }

  return bounds.top + bounds.height / 2 - guideThickness / 2;
}

function getVerticalGuideLeft(
  bounds: PositioningRect,
  snap: PositioningMoveSnapState,
  guideThickness: number,
  edgeGuideInset: number,
): number {
  if (snap.left !== null) {
    return bounds.left + edgeGuideInset;
  }

  if (snap.right !== null) {
    return bounds.left + bounds.width - edgeGuideInset - guideThickness;
  }

  return bounds.left + bounds.width / 2 - guideThickness / 2;
}

function applyPreviewBounds(
  overlayElement: HTMLDivElement | null,
  handleRefs: Record<string, HandleElements>,
  rotateHandle: HandleElements,
  bounds: PositioningRect,
  rotation: number,
  handleSize: number,
  handleHitSize: number,
) {
  if (!overlayElement) {
    return;
  }

  overlayElement.style.left = `${bounds.left}px`;
  overlayElement.style.top = `${bounds.top}px`;
  overlayElement.style.width = `${bounds.width}px`;
  overlayElement.style.height = `${bounds.height}px`;
  overlayElement.style.transform = getRotationCss(rotation);

  for (const handle of POSITIONING_HANDLES) {
    const handleElements = handleRefs[handle.id];
    const visibleElement = handleElements?.visible;
    const hitElement = handleElements?.hit;
    const visibleLeft = getHandleLeft(handle.id, bounds.width, handleSize);
    const visibleTop = getHandleTop(handle.id, bounds.height, handleSize);
    const hitInset = (handleHitSize - handleSize) / 2;

    if (visibleElement) {
      visibleElement.style.left = `${visibleLeft}px`;
      visibleElement.style.top = `${visibleTop}px`;
    }

    if (hitElement) {
      hitElement.style.left = `${visibleLeft - hitInset}px`;
      hitElement.style.top = `${visibleTop - hitInset}px`;
    }
  }

  const controlScale = handleSize / 14;
  const rotateVisibleTop = -ROTATE_HANDLE_OFFSET * controlScale - handleSize / 2;
  const rotateVisibleLeft = bounds.width / 2 - handleSize / 2;
  const rotateHitInset = (handleHitSize - handleSize) / 2;

  if (rotateHandle.visible) {
    rotateHandle.visible.style.left = `${rotateVisibleLeft}px`;
    rotateHandle.visible.style.top = `${rotateVisibleTop}px`;
  }

  if (rotateHandle.hit) {
    rotateHandle.hit.style.left = `${rotateVisibleLeft - rotateHitInset}px`;
    rotateHandle.hit.style.top = `${rotateVisibleTop - rotateHitInset}px`;
  }
}
