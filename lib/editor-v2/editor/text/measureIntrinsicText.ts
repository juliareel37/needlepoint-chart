"use client";

export function measureIntrinsicText(
  text: string,
  options: {
    baseFontSize: number;
    fontFamily: string;
    fontStyle: "normal" | "italic";
    fontWeight: number;
  },
): { width: number; height: number } | null {
  if (!text.trim()) return null;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.font = `${options.fontWeight} ${options.fontStyle} ${options.baseFontSize}px ${options.fontFamily}, sans-serif`;

  const lines = text.split("\n");
  let maxWidth = 0;
  for (const line of lines) {
    const width = context.measureText(line).width;
    maxWidth = Math.max(maxWidth, width);
  }

  const height = Math.max(1, lines.length) * options.baseFontSize * 1.1;
  return {
    width: Math.max(1, Math.ceil(maxWidth + options.baseFontSize * 0.6)),
    height: Math.max(1, Math.ceil(height + options.baseFontSize * 0.4)),
  };
}
