import { describe, expect, it } from "vitest";
import {
  getCenterSnappedPosition,
  type PositioningMoveSnapState,
  type PositioningRect,
} from "./boxGeometry";

const CONTAINER: PositioningRect = {
  left: 0,
  top: 0,
  width: 100,
  height: 80,
};

describe("getCenterSnappedPosition", () => {
  it("snaps horizontally and vertically when the element center is within tolerance", () => {
    const bounds: PositioningRect = {
      left: 27,
      top: 17,
      width: 40,
      height: 50,
    };

    expect(
      getCenterSnappedPosition(bounds, CONTAINER, emptySnap(), 1),
    ).toEqual({
      offsetX: 3,
      offsetY: -2,
      snap: {
        centerX: 50,
        centerY: 40,
      },
    });
  });

  it("keeps a snapped axis latched until it moves beyond the unsnap threshold", () => {
    const snap: PositioningMoveSnapState = {
      centerX: 50,
      centerY: 40,
    };
    const bounds: PositioningRect = {
      left: 20,
      top: 4,
      width: 40,
      height: 50,
    };

    expect(getCenterSnappedPosition(bounds, CONTAINER, snap, 1)).toEqual({
      offsetX: 10,
      offsetY: 11,
      snap: {
        centerX: 50,
        centerY: 40,
      },
    });
  });

  it("does not snap when the element center is outside the tolerance", () => {
    const bounds: PositioningRect = {
      left: 10,
      top: 10,
      width: 40,
      height: 20,
    };

    expect(
      getCenterSnappedPosition(bounds, CONTAINER, emptySnap(), 1),
    ).toEqual({
      offsetX: 0,
      offsetY: 0,
      snap: {
        centerX: null,
        centerY: null,
      },
    });
  });
});

function emptySnap(): PositioningMoveSnapState {
  return {
    centerX: null,
    centerY: null,
  };
}
