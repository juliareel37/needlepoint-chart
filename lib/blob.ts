import { del } from "@vercel/blob";

/** Returns true if the URL is a Vercel Blob URL managed by this app. */
export function isBlobUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith("https://") && url.includes(".blob.vercel-storage.com/");
}

/** Extract trace image blob URL from a draft/version payload. */
export function extractBlobUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const trace = (data as Record<string, unknown>).trace;
  if (!trace || typeof trace !== "object") return null;
  const imageDataUrl = (trace as Record<string, unknown>).imageDataUrl;
  return typeof imageDataUrl === "string" && isBlobUrl(imageDataUrl) ? imageDataUrl : null;
}

/** Best-effort delete by URL. */
export async function deleteBlobIfExists(url: string | null | undefined): Promise<void> {
  if (!isBlobUrl(url)) return;
  try {
    await del(url);
  } catch {
    // Best-effort cleanup only.
  }
}
