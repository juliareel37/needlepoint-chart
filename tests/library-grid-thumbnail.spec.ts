import { expect, test } from "@playwright/test";

const GRID_ASPECT_RATIO = 104 / 208;

test("grid thumbnail preserves the canvas aspect ratio for tall designs", async ({
  page,
}) => {
  await page.goto("/dev/library-thumbnail-preview");

  const thumbnail = page.getByTestId("grid-thumbnail-grid-preview-test");
  await expect(thumbnail).toBeVisible();

  const box = await thumbnail.boundingBox();
  expect(box).not.toBeNull();

  const ratio = box ? box.width / box.height : 0;
  expect(Math.abs(ratio - GRID_ASPECT_RATIO)).toBeLessThan(0.03);

  await page.locator("article").first().screenshot({
    path: "test-results/library-grid-thumbnail-card.png",
  });
});
