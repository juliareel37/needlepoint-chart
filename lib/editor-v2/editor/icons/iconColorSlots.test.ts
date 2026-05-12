import { describe, expect, it } from "vitest";
import {
  extractIconColorSlotsFromSvg,
  findNearestIconColorSlot,
} from "./iconColorSlots";
import { extractIconColorSlotsFromRaster } from "./iconRasterColorSlots.server";

describe("extractIconColorSlotsFromSvg", () => {
  it("collects unique fill and stroke colors and normalizes rgb values", () => {
    const svg = `
      <svg viewBox="0 0 24 24">
        <path fill="#fc0" d="M0 0h10v10H0z" />
        <path style="fill: rgb(0, 128, 0); stroke: rgba(255, 255, 255, 0.8)" d="M12 0h10v10H12z" />
        <path fill="#ffcc00" stroke="none" d="M0 12h10v10H0z" />
      </svg>
    `;

    const slots = extractIconColorSlotsFromSvg(svg);

    expect(slots.map((slot) => slot.sourceHex)).toEqual([
      "#ffcc00",
      "#008000",
      "#ffffff",
    ]);
    expect(slots.every((slot) => typeof slot.paletteColorId === "string")).toBe(true);
  });

  it("ignores unsupported paint values", () => {
    const svg = `
      <svg viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" d="M0 0h10v10H0z" />
        <path style="fill: url(#gradient); stroke: transparent" d="M12 0h10v10H12z" />
      </svg>
    `;

    expect(extractIconColorSlotsFromSvg(svg)).toEqual([]);
  });
});

describe("findNearestIconColorSlot", () => {
  it("finds the closest source color for a sampled pixel", () => {
    const slot = findNearestIconColorSlot(
      [
        { id: "slot-1", sourceHex: "#ffcc00", paletteColorId: "dmc-973" },
        { id: "slot-2", sourceHex: "#008000", paletteColorId: "dmc-699" },
      ],
      { r: 10, g: 140, b: 20 },
    );

    expect(slot?.id).toBe("slot-2");
  });
});

describe("extractIconColorSlotsFromRaster", () => {
  it("extracts dominant visible raster colors", async () => {
    const sharpModule = await import("sharp");
    const sharp = "default" in sharpModule ? sharpModule.default : sharpModule;
    const rgbaPixels = Uint8Array.from([
      255, 0, 0, 255,
      255, 0, 0, 255,
      0, 0, 255, 255,
      0, 0, 255, 255,
    ]);

    const buffer = await sharp(rgbaPixels, {
      raw: {
        width: 2,
        height: 2,
        channels: 4,
      },
    })
      .png()
      .toBuffer();

    const slots = await extractIconColorSlotsFromRaster(buffer, 4);

    expect(slots.map((slot) => slot.sourceHex)).toEqual(
      expect.arrayContaining(["#ff0000", "#0000ff"]),
    );
    expect(slots.every((slot) => typeof slot.paletteColorId === "string")).toBe(true);
  });
});
