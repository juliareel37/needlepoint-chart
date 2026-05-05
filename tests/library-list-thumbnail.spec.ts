import { expect, test } from "@playwright/test";

test("list thumbnail keeps painted content scaled within the canvas", async ({
  page,
}) => {
  await page.goto("/dev/library-thumbnail-preview?mode=list");

  const thumbnail = page.getByTestId("list-thumbnail-grid-preview-test-1");
  await expect(thumbnail).toBeVisible();

  const contentBounds = await thumbnail.locator("canvas").evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    const { width, height } = canvas;
    const pixels = context.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const alpha = pixels[offset + 3];
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const isNearWhite =
          red >= 245 && green >= 245 && blue >= 245 && alpha >= 245;

        if (alpha > 0 && !isNearWhite) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      return null;
    }

    return {
      width,
      height,
      contentWidth: maxX - minX + 1,
      contentHeight: maxY - minY + 1,
    };
  });

  expect(contentBounds).not.toBeNull();
  expect(contentBounds!.contentWidth / contentBounds!.width).toBeLessThan(0.5);
  expect(contentBounds!.contentHeight / contentBounds!.height).toBeLessThan(0.8);

  await page.locator("article").first().screenshot({
    path: "test-results/library-list-thumbnail-row.png",
  });
});
