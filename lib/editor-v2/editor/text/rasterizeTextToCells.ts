import type { GridPoint } from "../store/state";

export interface RasterizeTextToCellsOptions {
  text: string;
  gridWidth: number;
  gridHeight: number;
  origin: GridPoint;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fontStyle: "normal" | "italic";
}

export function rasterizeTextToCells({
  text,
  gridWidth,
  gridHeight,
  origin,
  fontSize,
  fontFamily,
  fontWeight,
  fontStyle,
}: RasterizeTextToCellsOptions): GridPoint[] {
  const normalizedText = text.trim();

  if (
    normalizedText.length === 0 ||
    gridWidth <= 0 ||
    gridHeight <= 0 ||
    fontSize <= 0 ||
    typeof document === "undefined"
  ) {
    return [];
  }

  const canvas = document.createElement("canvas");
  canvas.width = gridWidth;
  canvas.height = gridHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return [];
  }

  context.clearRect(0, 0, gridWidth, gridHeight);
  context.fillStyle = "#000";
  context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  context.textAlign = "left";
  context.textBaseline = "top";

  const lineHeight = Math.ceil(fontSize * 1.2);
  const lines = normalizedText.split(/\r?\n/);

  lines.forEach((line, index) => {
    context.fillText(line || " ", origin.x, origin.y + index * lineHeight);
  });

  const imageData = context.getImageData(0, 0, gridWidth, gridHeight).data;
  const cells: GridPoint[] = [];

  for (let y = 0; y < gridHeight; y += 1) {
    for (let x = 0; x < gridWidth; x += 1) {
      const alpha = imageData[(y * gridWidth + x) * 4 + 3];

      if (alpha > 32) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}
