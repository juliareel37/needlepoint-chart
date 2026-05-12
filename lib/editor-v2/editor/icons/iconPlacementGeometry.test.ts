import { describe, expect, it } from "vitest";
import { getIconPlacementTransformFromDrag } from "./iconPlacementGeometry";

describe("getIconPlacementTransformFromDrag", () => {
  it("lets side handles resize freely when aspect ratio is not locked", () => {
    const transform = getIconPlacementTransformFromDrag(
      {
        mode: "e",
        startPoint: { x: 100, y: 50 },
        startTransform: {
          offsetX: 0,
          offsetY: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          lockAspectRatio: false,
          freeCornerResize: false,
        },
        startBounds: {
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        },
        transactionKey: "test-side-handle",
      },
      { x: 150, y: 50 },
      {
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      },
    );

    expect(transform.scaleX).toBe(1.5);
    expect(transform.scaleY).toBe(1);
  });

  it("keeps corner handles uniform when freeCornerResize is disabled", () => {
    const transform = getIconPlacementTransformFromDrag(
      {
        mode: "se",
        startPoint: { x: 100, y: 100 },
        startTransform: {
          offsetX: 0,
          offsetY: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          lockAspectRatio: false,
          freeCornerResize: false,
        },
        startBounds: {
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        },
        transactionKey: "test-corner-handle",
      },
      { x: 150, y: 120 },
      {
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      },
    );

    expect(transform.scaleX).toBe(1.5);
    expect(transform.scaleY).toBe(1.5);
  });
});
