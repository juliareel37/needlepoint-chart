export async function loadMaskableImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    if (/^https?:\/\//i.test(src)) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    image.src = src;
  });
}

export async function composeMaskedImageDataUrl(options: {
  sourceSrc: string;
  maskSrc: string | null;
  width: number;
  height: number;
}): Promise<string> {
  const width = Math.max(1, Math.round(options.width));
  const height = Math.max(1, Math.round(options.height));
  const sourceImage = await loadMaskableImage(options.sourceSrc);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    return options.sourceSrc;
  }

  context.clearRect(0, 0, width, height);
  context.globalCompositeOperation = "source-over";
  context.drawImage(sourceImage, 0, 0, width, height);

  if (options.maskSrc) {
    const maskImage = await loadMaskableImage(options.maskSrc);
    context.globalCompositeOperation = "destination-in";
    context.drawImage(maskImage, 0, 0, width, height);
    context.globalCompositeOperation = "source-over";
  }

  return canvas.toDataURL("image/png");
}
