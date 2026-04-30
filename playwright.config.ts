import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const shouldStartWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "1";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: shouldStartWebServer
    ? {
        command:
          "zsh -lc 'eval \"$(/opt/homebrew/bin/brew shellenv zsh)\"; NEXT_DIST_DIR=.next-playwright npm run dev -- --port 3100 --hostname 127.0.0.1'",
        url: `${baseURL}/dev/library-thumbnail-preview`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
