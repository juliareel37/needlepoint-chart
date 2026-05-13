import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

const GRID_ASPECT_RATIO = 104 / 208;
const TEST_THUMBNAIL_ID = "grid-thumbnail-grid-preview-test-1";

async function getThumbnailMetrics(thumbnail: Locator) {
  return thumbnail.evaluate((frame) => {
    const frameRect = frame.getBoundingClientRect();
    const canvas = frame.querySelector("canvas");

    return {
      frameWidth: frameRect.width,
      frameHeight: frameRect.height,
      bitmapWidth: canvas instanceof HTMLCanvasElement ? canvas.width : 0,
      bitmapHeight: canvas instanceof HTMLCanvasElement ? canvas.height : 0,
    };
  });
}

test("grid thumbnail preserves the canvas aspect ratio for tall designs", async ({
  page,
}) => {
  await page.goto("/dev/library-thumbnail-preview");

  const thumbnail = page.getByTestId(TEST_THUMBNAIL_ID);
  await expect(thumbnail).toBeVisible();

  const box = await thumbnail.boundingBox();
  expect(box).not.toBeNull();

  const ratio = box ? box.width / box.height : 0;
  expect(Math.abs(ratio - GRID_ASPECT_RATIO)).toBeLessThan(0.03);

  await page.locator("article").first().screenshot({
    path: "test-results/library-grid-thumbnail-card.png",
  });
});

test("grid thumbnail rerenders after viewport resize without a refresh", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 1200 });
  await page.goto("/dev/library-thumbnail-preview");

  const thumbnail = page.getByTestId(TEST_THUMBNAIL_ID);
  await expect(thumbnail).toBeVisible();

  const initialMetrics = await getThumbnailMetrics(thumbnail);

  await page.setViewportSize({ width: 430, height: 1200 });

  await expect
    .poll(async () => {
      const metrics = await getThumbnailMetrics(thumbnail);
      const frameHeightChanged =
        Math.abs(metrics.frameHeight - initialMetrics.frameHeight) > 10;
      const bitmapHeightChanged =
        Math.abs(metrics.bitmapHeight - initialMetrics.bitmapHeight) > 10;

      return frameHeightChanged && bitmapHeightChanged;
    })
    .toBe(true);

  const resizedMetrics = await getThumbnailMetrics(thumbnail);
  const ratio =
    resizedMetrics.frameHeight > 0
      ? resizedMetrics.frameWidth / resizedMetrics.frameHeight
      : 0;
  expect(Math.abs(ratio - GRID_ASPECT_RATIO)).toBeLessThan(0.03);
});
