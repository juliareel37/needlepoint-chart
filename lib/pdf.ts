import jsPDF from "jspdf";
import type { Color } from "./grid";
import { idx } from "./grid";
import { symbolForColorId } from "./symbols";

const AXIS_STEP = 5;
const STITCHES_PER_SKEIN = 1600;
const MAJOR_LINE_RGB = { r: 64, g: 64, b: 64 };
const MINOR_LINE_RGB = { r: 170, g: 170, b: 170 };
const RULER_TEXT_RGB = { r: 31, g: 41, b: 55 };

export function exportPatternPdf(opts: {
  title: string;
  threadView?: boolean;
  usedColors: { color: Color; count: number }[];
  grid: Uint16Array;
  paletteById: Map<number, Color>;
  symbolMap?: Map<number, string>;
  width: number;
  height: number;
  cellSize: number;
}) {
  const { title, threadView = false, usedColors, grid, paletteById, symbolMap, width, height, cellSize } = opts;
  void threadView;

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 36;

  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2 - 18;

  const titleText = title || "Needlepoint Pattern";
  drawVectorChartPage({
    pdf,
    pageTitle: titleText,
    width,
    height,
    cellSize,
    grid,
    paletteById,
    symbolMap,
    margin,
    maxW,
    maxH,
    threadView: true,
    showGridlines: false,
    showRuler: false,
    symbolsOnly: false,
  });

  pdf.addPage();
  drawVectorChartPage({
    pdf,
    pageTitle: titleText,
    width,
    height,
    cellSize,
    grid,
    paletteById,
    symbolMap,
    margin,
    maxW,
    maxH,
    threadView: false,
    showGridlines: true,
    showRuler: true,
    symbolsOnly: false,
  });

  pdf.addPage();
  drawLegendTablePages({ pdf, titleText, usedColors, symbolMap, margin });

  pdf.addPage();
  drawVectorChartPage({
    pdf,
    pageTitle: `${titleText} (Symbols Only)`,
    width,
    height,
    cellSize,
    grid,
    paletteById,
    symbolMap,
    margin,
    maxW,
    maxH,
    threadView: false,
    showGridlines: true,
    showRuler: true,
    symbolsOnly: true,
  });

  pdf.save(`${sanitizeFilename(title || "needlepoint-pattern")}.pdf`);
}

function drawLegendTablePages(opts: {
  pdf: jsPDF;
  titleText: string;
  usedColors: { color: Color; count: number }[];
  symbolMap?: Map<number, string>;
  margin: number;
}) {
  const { pdf, titleText, usedColors, symbolMap, margin } = opts;
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const tableW = pageW - margin * 2;
  const pageBottom = pageH - margin;
  const headerH = 22;
  const rowH = 20;

  const colColor = 70;
  const colNumber = 70;
  const colStitches = 70;
  const colSkeins = 70;
  const colName = tableW - colColor - colNumber - colStitches - colSkeins;
  const columns = [
    { label: "Color", width: colColor, align: "left" as const },
    { label: "Name", width: colName, align: "left" as const },
    { label: "Number", width: colNumber, align: "center" as const },
    { label: "Stitches", width: colStitches, align: "center" as const },
    { label: "Skeins", width: colSkeins, align: "center" as const },
  ];

  const fitText = (text: string, maxWidth: number) => {
    if (!text) return "";
    if (pdf.getTextWidth(text) <= maxWidth) return text;
    const ellipsis = "...";
    let next = text;
    while (next.length > 0 && pdf.getTextWidth(`${next}${ellipsis}`) > maxWidth) {
      next = next.slice(0, -1);
    }
    return next ? `${next}${ellipsis}` : ellipsis;
  };

  let y = 0;
  const drawLegendHeader = (continuation: boolean) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(continuation ? `${titleText} (Legend, continued)` : `${titleText} (Legend)`, margin, margin);

    y = margin + 18;
    pdf.setDrawColor(190, 190, 190);
    pdf.setLineWidth(0.6);
    pdf.rect(margin, y, tableW, headerH);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    let x = margin;
    for (const col of columns) {
      pdf.line(x, y, x, y + headerH);
      const textX = col.align === "center" ? x + col.width / 2 : x + 6;
      pdf.text(col.label, textX, y + headerH / 2, {
        align: col.align === "center" ? "center" : "left",
        baseline: "middle",
      });
      x += col.width;
    }
    pdf.line(margin + tableW, y, margin + tableW, y + headerH);
    y += headerH;
  };

  drawLegendHeader(false);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  for (const { color, count } of usedColors) {
    if (y + rowH > pageBottom) {
      pdf.addPage();
      drawLegendHeader(true);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    }

    pdf.setDrawColor(215, 215, 215);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, y, tableW, rowH);

    let x = margin;
    for (const col of columns) {
      pdf.line(x, y, x, y + rowH);
      x += col.width;
    }
    pdf.line(margin + tableW, y, margin + tableW, y + rowH);

    const swatchSize = rowH - 8;
    const swatchX = margin + 6;
    const swatchY = y + (rowH - swatchSize) / 2;
    const rgb = hexToRgb(color.hex);
    if (rgb) {
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.rect(swatchX, swatchY, swatchSize, swatchSize, "F");
      pdf.setDrawColor(125, 125, 125);
      pdf.setLineWidth(0.25);
      pdf.rect(swatchX, swatchY, swatchSize, swatchSize);
    }
    const symbol = symbolForColorId(color.id, symbolMap);
    if (symbol) {
      const textColor = rgb ? contrastForRgb(rgb.r, rgb.g, rgb.b) : { r: 0, g: 0, b: 0 };
      pdf.setTextColor(textColor.r, textColor.g, textColor.b);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.text(symbol, swatchX + swatchSize / 2, y + rowH / 2, { align: "center", baseline: "middle" });
    }

    const nameX = margin + colColor + 6;
    const numberX = margin + colColor + colName + colNumber / 2;
    const stitchesX = margin + colColor + colName + colNumber + colStitches / 2;
    const skeinsX = margin + colColor + colName + colNumber + colStitches + colSkeins / 2;

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(fitText(color.name || "", colName - 12), nameX, y + rowH / 2, { align: "left", baseline: "middle" });
    pdf.text(color.code ? String(color.code) : "", numberX, y + rowH / 2, { align: "center", baseline: "middle" });
    pdf.text(String(count), stitchesX, y + rowH / 2, { align: "center", baseline: "middle" });
    pdf.text(String(estimateSkeinCount(count)), skeinsX, y + rowH / 2, {
      align: "center",
      baseline: "middle",
    });

    y += rowH;
  }
}

function drawVectorChartPage(opts: {
  pdf: jsPDF;
  pageTitle: string;
  grid: Uint16Array;
  paletteById: Map<number, Color>;
  symbolMap?: Map<number, string>;
  width: number;
  height: number;
  cellSize: number;
  margin: number;
  maxW: number;
  maxH: number;
  threadView: boolean;
  showGridlines: boolean;
  showRuler: boolean;
  symbolsOnly: boolean;
}) {
  const {
    pdf,
    pageTitle,
    grid,
    paletteById,
    symbolMap,
    width,
    height,
    cellSize,
    margin,
    maxW,
    maxH,
    threadView,
    showGridlines,
    showRuler,
    symbolsOnly,
  } = opts;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(pageTitle, margin, margin);

  const rulerPad = Math.max(18, Math.round(cellSize + 4));
  const gridOffsetX = rulerPad;
  const gridOffsetY = rulerPad;
  const gridCanvasW = width * cellSize;
  const gridCanvasH = height * cellSize;
  const logicalCanvasW = gridCanvasW + gridOffsetX * 2;
  const logicalCanvasH = gridCanvasH + gridOffsetY * 2;
  const ratio = Math.min(maxW / logicalCanvasW, maxH / logicalCanvasH);
  const chartX = margin;
  const chartY = margin + 18;
  const lineMinor = Math.max(0.2, ratio);
  const lineMajor = Math.max(lineMinor, ratio * 1.6);
  const symbolFontSize = Math.max(3.5, Math.min(14, cellSize * 0.38 * ratio));
  const rulerFontSize = Math.max(8.5, 12 * ratio);

  const toX = (logicalX: number) => chartX + logicalX * ratio;
  const toY = (logicalY: number) => chartY + logicalY * ratio;
  const toW = (logicalW: number) => logicalW * ratio;
  const toH = (logicalH: number) => logicalH * ratio;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(chartX, chartY, logicalCanvasW * ratio, logicalCanvasH * ratio, "F");

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const colorId = grid[idx(x, y, width)];
      if (colorId === 0) continue;
      const color = paletteById.get(colorId);
      if (!color) continue;

      const x0 = gridOffsetX + x * cellSize;
      const y0 = gridOffsetY + y * cellSize;

      if (threadView && !symbolsOnly) {
        pdf.setFillColor(107, 114, 128);
        pdf.rect(toX(x0), toY(y0), toW(cellSize), toH(cellSize), "F");
        const rgb = hexToRgb(color.hex);
        const stitchInset = cellSize * 0.2;
        const stitchWidth = Math.max(0.6, cellSize * 0.62 * ratio);
        if (rgb) {
          pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
          pdf.setLineCap(1);
          pdf.setLineWidth(stitchWidth);
          pdf.line(
            toX(x0 + stitchInset),
            toY(y0 + cellSize - stitchInset),
            toX(x0 + cellSize - stitchInset),
            toY(y0 + stitchInset)
          );
        }
      } else if (!symbolsOnly) {
        const rgb = hexToRgb(color.hex);
        if (rgb) {
          pdf.setFillColor(rgb.r, rgb.g, rgb.b);
          pdf.rect(toX(x0), toY(y0), toW(cellSize), toH(cellSize), "F");
        }
      }

      const shouldDrawSymbols = !threadView || symbolsOnly;
      if (!shouldDrawSymbols) continue;
      const symbol = symbolForColorId(color.id, symbolMap);
      if (!symbol) continue;

      const symbolX = toX(x0 + cellSize / 2);
      const symbolY = toY(y0 + cellSize / 2);

      if (symbolsOnly) {
        pdf.setTextColor(0, 0, 0);
      } else {
        const rgb = hexToRgb(color.hex);
        const textColor = rgb ? contrastForRgb(rgb.r, rgb.g, rgb.b) : { r: 0, g: 0, b: 0 };
        pdf.setTextColor(textColor.r, textColor.g, textColor.b);
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(symbolFontSize);
      pdf.text(symbol, symbolX, symbolY, { align: "center", baseline: "middle" });
    }
  }

  if (showGridlines) {
    for (let x = 0; x <= width; x++) {
      const isMajor = x % AXIS_STEP === 0;
      const px = gridOffsetX + x * cellSize;
      pdf.setDrawColor(
        isMajor ? MAJOR_LINE_RGB.r : MINOR_LINE_RGB.r,
        isMajor ? MAJOR_LINE_RGB.g : MINOR_LINE_RGB.g,
        isMajor ? MAJOR_LINE_RGB.b : MINOR_LINE_RGB.b
      );
      pdf.setLineWidth(isMajor ? lineMajor : lineMinor);
      pdf.line(toX(px), toY(gridOffsetY), toX(px), toY(gridOffsetY + gridCanvasH));
    }

    for (let y = 0; y <= height; y++) {
      const isMajor = y % AXIS_STEP === 0;
      const py = gridOffsetY + y * cellSize;
      pdf.setDrawColor(
        isMajor ? MAJOR_LINE_RGB.r : MINOR_LINE_RGB.r,
        isMajor ? MAJOR_LINE_RGB.g : MINOR_LINE_RGB.g,
        isMajor ? MAJOR_LINE_RGB.b : MINOR_LINE_RGB.b
      );
      pdf.setLineWidth(isMajor ? lineMajor : lineMinor);
      pdf.line(toX(gridOffsetX), toY(py), toX(gridOffsetX + gridCanvasW), toY(py));
    }
  }

  if (showRuler) {
    pdf.setTextColor(RULER_TEXT_RGB.r, RULER_TEXT_RGB.g, RULER_TEXT_RGB.b);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(rulerFontSize);
    const topLabelY = gridOffsetY - 6;
    const bottomLabelY = gridOffsetY + gridCanvasH + 6;
    const leftLabelX = gridOffsetX - 6;
    const rightLabelX = gridOffsetX + gridCanvasW + 6;
    pdf.text("0", toX(leftLabelX), toY(topLabelY), { align: "right", baseline: "bottom" });

    for (let x = AXIS_STEP; x <= width; x += AXIS_STEP) {
      const px = gridOffsetX + x * cellSize;
      const label = String(x);
      pdf.text(label, toX(px), toY(topLabelY), { align: "center", baseline: "bottom" });
      pdf.text(label, toX(px), toY(bottomLabelY), { align: "center", baseline: "top" });
    }

    for (let y = AXIS_STEP; y <= height; y += AXIS_STEP) {
      const py = gridOffsetY + y * cellSize;
      const label = String(y);
      pdf.text(label, toX(leftLabelX), toY(py), { align: "right", baseline: "middle" });
      pdf.text(label, toX(rightLabelX), toY(py), { align: "left", baseline: "middle" });
    }
  }
}

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function contrastForRgb(r: number, g: number, b: number) {
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
}

function sanitizeFilename(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function estimateSkeinCount(stitchCount: number) {
  return Math.max(1, Math.ceil(stitchCount / STITCHES_PER_SKEIN));
}
