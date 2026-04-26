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
        left: null,
        right: null,
        top: null,
        bottom: null,
        centerX: 50,
        centerY: 40,
      },
    });
  });

  it("keeps a snapped axis latched until it moves beyond the unsnap threshold", () => {
    const snap: PositioningMoveSnapState = {
      left: null,
      right: null,
      top: null,
      bottom: null,
      centerX: 50,
      centerY: 40,
    };
    const bounds: PositioningRect = {
      left: 20,
      top: 19,
      width: 40,
      height: 20,
    };

    expect(getCenterSnappedPosition(bounds, CONTAINER, snap, 1)).toEqual({
      offsetX: 10,
      offsetY: 11,
      snap: {
        left: null,
        right: null,
        top: null,
        bottom: null,
        centerX: 50,
        centerY: 40,
      },
    });
  });

  it("snaps to the left and top canvas edges when the element is within tolerance", () => {
    const bounds: PositioningRect = {
      left: 6,
      top: 4,
      width: 20,
      height: 10,
    };

    expect(
      getCenterSnappedPosition(bounds, CONTAINER, emptySnap(), 1),
    ).toEqual({
      offsetX: -6,
      offsetY: -4,
      snap: {
        left: 0,
        right: null,
        top: 0,
        bottom: null,
        centerX: null,
        centerY: null,
      },
    });
  });

  it("snaps to the right and bottom canvas edges when the element is within tolerance", () => {
    const bounds: PositioningRect = {
      left: 73,
      top: 64,
      width: 20,
      height: 10,
    };

    expect(
      getCenterSnappedPosition(bounds, CONTAINER, emptySnap(), 1),
    ).toEqual({
      offsetX: 7,
      offsetY: 6,
      snap: {
        left: null,
        right: 100,
        top: null,
        bottom: 80,
        centerX: null,
        centerY: null,
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
        left: null,
        right: null,
        top: null,
        bottom: null,
        centerX: null,
        centerY: null,
      },
    });
  });
});

function emptySnap(): PositioningMoveSnapState {
  return {
    left: null,
    right: null,
    top: null,
    bottom: null,
    centerX: null,
    centerY: null,
  };
}
