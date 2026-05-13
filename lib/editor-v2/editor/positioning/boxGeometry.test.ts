import { describe, expect, it } from "vitest";
import {
  getCenterSnappedPosition,
  getPinchSnappedBounds,
  getRotationSnapTarget,
  getSnappedRotationDegrees,
  getResizeSnappedBounds,
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

describe("getResizeSnappedBounds", () => {
  it("snaps an east resize to the right canvas edge", () => {
    const startBounds: PositioningRect = {
      left: 10,
      top: 20,
      width: 40,
      height: 20,
    };
    const resizedBounds: PositioningRect = {
      left: 10,
      top: 18,
      width: 85,
      height: 42.5,
    };

    expect(
      getResizeSnappedBounds(startBounds, resizedBounds, "e", CONTAINER, emptySnap(), 1),
    ).toEqual({
      bounds: {
        left: 10,
        top: 7.5,
        width: 90,
        height: 45,
      },
      snap: {
        left: null,
        right: 100,
        top: null,
        bottom: null,
        centerX: null,
        centerY: null,
      },
    });
  });

  it("snaps a south resize to the bottom canvas edge", () => {
    const startBounds: PositioningRect = {
      left: 30,
      top: 40,
      width: 20,
      height: 10,
    };
    const resizedBounds: PositioningRect = {
      left: -7,
      top: 40,
      width: 74,
      height: 37,
    };

    expect(
      getResizeSnappedBounds(startBounds, resizedBounds, "s", CONTAINER, emptySnap(), 1),
    ).toEqual({
      bounds: {
        left: 0,
        top: 40,
        width: 80,
        height: 40,
      },
      snap: {
        left: null,
        right: null,
        top: null,
        bottom: 80,
        centerX: null,
        centerY: null,
      },
    });
  });

  it("snaps a resize handle to the canvas midline", () => {
    const startBounds: PositioningRect = {
      left: 10,
      top: 20,
      width: 20,
      height: 10,
    };
    const resizedBounds: PositioningRect = {
      left: 10,
      top: 6,
      width: 76,
      height: 38,
    };

    expect(
      getResizeSnappedBounds(startBounds, resizedBounds, "e", CONTAINER, emptySnap(), 1),
    ).toEqual({
      bounds: {
        left: 10,
        top: 5,
        width: 80,
        height: 40,
      },
      snap: {
        left: null,
        right: null,
        top: null,
        bottom: null,
        centerX: 50,
        centerY: null,
      },
    });
  });

  it("keeps a resize snap latched until it moves beyond the unsnap threshold", () => {
    const startBounds: PositioningRect = {
      left: 10,
      top: 20,
      width: 40,
      height: 20,
    };
    const resizedBounds: PositioningRect = {
      left: 10,
      top: 19,
      width: 78,
      height: 39,
    };
    const snap: PositioningMoveSnapState = {
      left: null,
      right: 100,
      top: null,
      bottom: null,
      centerX: null,
      centerY: null,
    };

    expect(
      getResizeSnappedBounds(startBounds, resizedBounds, "e", CONTAINER, snap, 1),
    ).toEqual({
      bounds: {
        left: 10,
        top: 7.5,
        width: 90,
        height: 45,
      },
      snap: {
        left: null,
        right: 100,
        top: null,
        bottom: null,
        centerX: null,
        centerY: null,
      },
    });
  });

  it("does not snap to an edge when resizing away from it", () => {
    const startBounds: PositioningRect = {
      left: 10,
      top: 20,
      width: 88,
      height: 44,
    };
    const resizedBounds: PositioningRect = {
      left: 10,
      top: 24.5,
      width: 66,
      height: 33,
    };

    expect(
      getResizeSnappedBounds(startBounds, resizedBounds, "e", CONTAINER, emptySnap(), 1),
    ).toEqual({
      bounds: resizedBounds,
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

describe("getPinchSnappedBounds", () => {
  it("snaps pinch-resized bounds to the nearest canvas edge", () => {
    const bounds: PositioningRect = {
      left: 73,
      top: 14,
      width: 20,
      height: 20,
    };

    expect(getPinchSnappedBounds(bounds, CONTAINER, emptySnap(), 1)).toEqual({
      bounds: {
        left: 80,
        top: 14,
        width: 20,
        height: 20,
      },
      snap: {
        left: null,
        right: 100,
        top: null,
        bottom: null,
        centerX: null,
        centerY: null,
      },
    });
  });

  it("snaps pinch-resized bounds to the canvas midline", () => {
    const bounds: PositioningRect = {
      left: 28,
      top: 18,
      width: 40,
      height: 20,
    };

    expect(getPinchSnappedBounds(bounds, CONTAINER, emptySnap(), 1)).toEqual({
      bounds: {
        left: 30,
        top: 18,
        width: 40,
        height: 20,
      },
      snap: {
        left: null,
        right: null,
        top: null,
        bottom: null,
        centerX: 50,
        centerY: null,
      },
    });
  });

  it("keeps a pinch snap latched until it moves beyond the unsnap threshold", () => {
    const bounds: PositioningRect = {
      left: 20,
      top: 19,
      width: 40,
      height: 20,
    };
    const snap: PositioningMoveSnapState = {
      left: null,
      right: null,
      top: null,
      bottom: null,
      centerX: 50,
      centerY: 40,
    };

    expect(getPinchSnappedBounds(bounds, CONTAINER, snap, 1)).toEqual({
      bounds: {
        left: 30,
        top: 30,
        width: 40,
        height: 20,
      },
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
});

describe("rotation snapping", () => {
  it("snaps rotations that move within the snap tolerance of a quarter turn", () => {
    const snap = getRotationSnapTarget(88, null);

    expect(snap).toBe(90);
    expect(getSnappedRotationDegrees(88, snap)).toBe(90);
  });

  it("keeps a snapped quarter turn latched until leaving the unsnap threshold", () => {
    expect(getRotationSnapTarget(94, 90)).toBe(90);
    expect(getRotationSnapTarget(96, 90)).toBeNull();
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
