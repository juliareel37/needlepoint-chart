export function renderTextPlacementPreview(options: {
  text: string;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  underline: boolean;
  color: string;
}): string {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(options.width));
  canvas.height = Math.max(1, Math.ceil(options.height));

  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  const lines = options.text.split("\n");
  const lineHeight = options.fontSize * 1.1;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const firstLineY = centerY - ((lines.length - 1) * lineHeight) / 2;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = options.color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `${options.fontWeight} ${options.fontStyle} ${options.fontSize}px ${options.fontFamily}, sans-serif`;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const y = firstLineY + index * lineHeight;
    context.fillText(line, centerX, y);

    if (options.underline) {
      const textMetrics = context.measureText(line);
      const underlineWidth = Math.max(0, textMetrics.width);
      const underlineLeft = centerX - underlineWidth / 2;
      const underlineY = y + options.fontSize * 0.42;
      context.beginPath();
      context.moveTo(underlineLeft, underlineY);
      context.lineTo(underlineLeft + underlineWidth, underlineY);
      context.lineWidth = Math.max(1, options.fontSize * 0.06);
      context.strokeStyle = options.color;
      context.stroke();
    }
  }

  return canvas.toDataURL();
}
