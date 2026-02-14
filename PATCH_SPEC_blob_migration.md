# Patch Spec: Migrate Trace Images from Postgres to Vercel Blob Storage

## Problem

Trace images are stored as base64 `data:image/png;base64,...` strings inside the `data` JSON column of `PatternDraft` and `PatternVersion`. Every autosave ships megabytes of base64 through the API and into Postgres. This is expensive in bandwidth, serverless compute, and DB storage.

## Solution

Upload trace images to Vercel Blob Storage on file select with an optimistic local preview. Store the resulting `https://` URL in the same JSON field where the `data:` URL lived. Keep version history safe by never deleting blobs on draft overwrite, and add a periodic blob GC for true orphans. No Prisma schema changes.

---

## 0. Vercel Blob Configuration

**Vercel Dashboard:**
1. Go to project → Storage → Create → Blob Store
2. Connect the store to the project (creates `BLOB_READ_WRITE_TOKEN` automatically)

**Local development:**
- Copy `BLOB_READ_WRITE_TOKEN` from Vercel dashboard into `.env.local`
- Set `BLOB_GC_SECRET` in `.env.local` (used by scheduled blob GC route)

---

## 1. New Dependency

**`package.json`** — add:
```
"@vercel/blob": "^1.0.0"
```

---

## 2. New File: `app/api/upload-trace/route.ts`

Token generation endpoint for Vercel Blob client uploads.

```typescript
import { handleUpload, type HandleUploadBody } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
      maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB
      tokenPayload: JSON.stringify({ userId }),
    }),
    onUploadCompleted: async () => {
      // No-op — URL is persisted by the client via the existing save flow
    },
  });

  return NextResponse.json(jsonResponse);
}
```

**Purpose:** Vercel Blob client uploads require a server-side token endpoint. The client SDK calls this automatically. We gate it behind Clerk auth so only signed-in users can upload.

---

## 3. New File: `lib/blob.ts`

Shared utility for upload and cleanup.

```typescript
import { del } from "@vercel/blob";

/** Returns true if the string is a Vercel Blob URL we manage. */
export function isBlobUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("https://") && url.includes(".blob.vercel-storage.com/");
}

/** Extract blob URL from a draft data payload, if present. */
export function extractBlobUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const trace = (data as Record<string, unknown>).trace;
  if (!trace || typeof trace !== "object") return null;
  const url = (trace as Record<string, unknown>).imageDataUrl;
  return typeof url === "string" && isBlobUrl(url) ? url : null;
}

/** Delete a Vercel Blob by URL. Swallows errors (best-effort cleanup). */
export async function deleteBlobIfExists(url: string | null | undefined): Promise<void> {
  if (!url || !isBlobUrl(url)) return;
  try {
    await del(url);
  } catch {
    // Best-effort: blob may already be deleted or URL invalid
  }
}
```

---

## 4. Modified: `components/pattern-editor/PatternEditor.tsx`

### 4a. Add upload and preview state refs

**REPLACE** old `traceUrlRef` with:
```typescript
const tracePreviewObjectUrlRef = useRef<string | null>(null);
const traceUploadSeqRef = useRef(0);
const [traceUploadState, setTraceUploadState] = useState<"idle" | "uploading" | "error">("idle");
```

**Why:**  
- `tracePreviewObjectUrlRef`: revoke local object URLs reliably (memory cleanup)  
- `traceUploadSeqRef`: prevent stale upload completion from overwriting a newer selection  
- `traceUploadState`: allow save logic to block unsafe saves while upload/migration is pending or failed

### 4b. `handleTraceFileSelected` — race-safe upload + optimistic preview

**REPLACE WITH:**
```typescript
async function handleTraceFileSelected(file: File) {
  const seq = ++traceUploadSeqRef.current;
  setTraceUploadState("uploading");

  if (tracePreviewObjectUrlRef.current) {
    URL.revokeObjectURL(tracePreviewObjectUrlRef.current);
    tracePreviewObjectUrlRef.current = null;
  }

  const localPreview = URL.createObjectURL(file);
  tracePreviewObjectUrlRef.current = localPreview;

  setTraceImageUrl(localPreview);
  setTraceFileName(file.name);
  setTraceLocked(false);
  setTraceOpacity(0.5);

  try {
    const { upload } = await import("@vercel/blob/client");
    const uploadName = `trace-${Date.now()}-${crypto.randomUUID()}-${file.name}`;
    const uploaded = await upload(uploadName, file, {
      access: "public",
      handleUploadUrl: "/api/upload-trace",
    });

    // Ignore stale completions from earlier selections
    if (seq !== traceUploadSeqRef.current) return;

    if (tracePreviewObjectUrlRef.current === localPreview) {
      URL.revokeObjectURL(localPreview);
      tracePreviewObjectUrlRef.current = null;
    }
    setTraceImageUrl(uploaded.url);
    setTraceUploadState("idle");
  } catch {
    if (seq !== traceUploadSeqRef.current) return;
    // Keep local preview visible, but mark upload failed for save validation.
    setTraceUploadState("error");
  }
}
```

### 4c. `clearTraceImage` — invalidate in-flight upload + revoke preview

**REPLACE WITH:**
```typescript
function clearTraceImage() {
  traceUploadSeqRef.current += 1; // invalidate any pending upload completion
  setTraceUploadState("idle");
  setTraceImageUrl(null);
  setTraceFileName(null);
  setTraceImage(null);
  setTraceOpacity(0);
  setTraceLocked(false);
  if (tracePreviewObjectUrlRef.current) {
    URL.revokeObjectURL(tracePreviewObjectUrlRef.current);
    tracePreviewObjectUrlRef.current = null;
  }
}
```

### 4d. Unmount cleanup

**ADD effect:**
```typescript
useEffect(() => {
  return () => {
    if (tracePreviewObjectUrlRef.current) {
      URL.revokeObjectURL(tracePreviewObjectUrlRef.current);
      tracePreviewObjectUrlRef.current = null;
    }
  };
}, []);
```

### 4e. Image loading effect (lines 133–146) — ADD `crossOrigin`

**CURRENT:**
```typescript
useEffect(() => {
  if (!traceImageUrl) {
    setTraceImage(null);
    setTraceFileName(null);
    setTraceOpacity(0);
    return;
  }
  const img = new Image();
  img.onload = () => setTraceImage(img);
  img.src = traceImageUrl;
  return () => {
    setTraceImage(null);
  };
}, [traceImageUrl]);
```

**REPLACE WITH:**
```typescript
useEffect(() => {
  if (!traceImageUrl) {
    setTraceImage(null);
    setTraceFileName(null);
    setTraceOpacity(0);
    return;
  }
  const img = new Image();
  if (traceImageUrl.startsWith("https://")) {
    img.crossOrigin = "anonymous";
  }
  img.onload = () => setTraceImage(img);
  img.src = traceImageUrl;
  return () => {
    setTraceImage(null);
  };
}, [traceImageUrl]);
```

**Why:** Canvas pixel operations (`getImageData`, `toDataURL`) on cross-origin images throw a security error unless the image was loaded with `crossOrigin = "anonymous"`. This affects:
- **Eyedropper tool** — `GridCanvas.tsx:430–431` reads pixel color from trace image
- **Image-to-pattern conversion** — `imageToPattern.ts:53–54` samples all pixels
- Vercel Blob serves proper CORS headers, so `anonymous` mode works

Only set for `https://` URLs. `data:` URLs (legacy drafts before migration) and `blob:` URLs (local preview) don't need it and `data:` URLs can actually be slower with it set.

---

## 5. Modified: `components/pattern-editor/hooks/useWipDrafts.ts`

### 5a. DELETE `buildTraceImageDataUrl` (lines 338–353) — entire function

```typescript
// DELETE THIS ENTIRE FUNCTION:
async function buildTraceImageDataUrl() {
  if (!traceImage) {
    return traceImageUrl && traceImageUrl.startsWith("data:") ? traceImageUrl : null;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = traceImage.width;
    canvas.height = traceImage.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(traceImage, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return traceImageUrl && traceImageUrl.startsWith("data:") ? traceImageUrl : null;
  }
}
```

**Why deleted:** This existed solely to convert a browser blob URL to a base64 data URL for DB storage. With Vercel Blob URLs, we store the URL directly — no conversion needed.

### 5b. Modify `buildDraftPayload` (lines 355–376) + save blocking behavior

**CURRENT:**
```typescript
async function buildDraftPayload() {
  const traceImageDataUrl = await buildTraceImageDataUrl();
  return {
    version: 1,
    title, gridW, gridH, grid: Array.from(grid),
    gridMode, meshCount, widthIn, heightIn,
    trace: {
      imageDataUrl: traceImageDataUrl,
      ...
    },
  };
}
```

**REPLACE WITH:**
```typescript
class TraceSaveBlockedError extends Error {
  constructor(code: "UPLOAD_PENDING" | "UPLOAD_FAILED" | "MIGRATION_FAILED") {
    super(code);
    this.name = "TraceSaveBlockedError";
  }
}

async function buildDraftPayload() {
  let imageUrl = traceImageUrl;

  // Never silently drop trace image data.
  if (imageUrl && imageUrl.startsWith("blob:")) {
    if (traceUploadState === "uploading") {
      throw new TraceSaveBlockedError("UPLOAD_PENDING");
    }
    throw new TraceSaveBlockedError("UPLOAD_FAILED");
  }

  // Lazy migration: convert legacy data: URL to Vercel Blob URL on save.
  if (imageUrl && imageUrl.startsWith("data:")) {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const { upload } = await import("@vercel/blob/client");
      const uploadName = `migrated-trace-${Date.now()}-${crypto.randomUUID()}.png`;
      const uploaded = await upload(uploadName, blob, {
        access: "public",
        handleUploadUrl: "/api/upload-trace",
      });
      imageUrl = uploaded.url;
      setTraceImageUrl(imageUrl);
      setTraceUploadState("idle");
    } catch {
      throw new TraceSaveBlockedError("MIGRATION_FAILED");
    }
  }

  return {
    version: 1,
    title, gridW, gridH, grid: Array.from(grid),
    gridMode, meshCount, widthIn, heightIn,
    trace: {
      imageDataUrl: imageUrl ?? null,
      opacity: traceOpacity,
      scale: traceScale,
      offsetX: traceOffsetX,
      offsetY: traceOffsetY,
      locked: traceLocked,
    },
  };
}
```

**Also update `saveDraft()` error handling:**
```typescript
let draft: DraftPayload;
try {
  draft = await buildDraftPayload();
} catch (err) {
  if (err instanceof TraceSaveBlockedError) {
    if (err.message === "UPLOAD_PENDING") {
      setWipMessage("Trace image is still uploading. Please wait a moment and save again.", "info");
    } else if (err.message === "UPLOAD_FAILED") {
      setWipMessage("Trace upload failed. Re-select the image and try saving again.", "error");
    } else {
      setWipMessage("Could not migrate this trace image yet. Please retry save.", "error");
    }
    saveInFlightRef.current = false;
    return false;
  }
  throw err;
}
```

**What changed:**
- No more `buildTraceImageDataUrl()` call
- `https://` URL stored directly
- Lazy migration still happens on save for legacy `data:` URLs
- `blob:` preview URLs are never persisted
- No silent data loss on migration/upload failure; save is blocked with explicit UI messaging

### 5c. Modify `buildDraftSnapshot` (lines 306–326)

**CURRENT (line 318):**
```typescript
imageDataUrl: traceImageUrl && traceImageUrl.startsWith("data:") ? traceImageUrl : null,
```

**REPLACE WITH:**
```typescript
imageDataUrl: traceImageUrl && (traceImageUrl.startsWith("data:") || traceImageUrl.startsWith("https://")) ? traceImageUrl : null,
```

**Why:** The snapshot saves to `sessionStorage` for crash recovery. Currently it drops non-`data:` URLs. We now also persist `https://` Vercel Blob URLs so the image survives a page refresh before the next autosave.

### 5d. Modify `applyDraft` (lines 483–496) — add `crossOrigin`

**CURRENT:**
```typescript
if (trace?.imageDataUrl) {
  const img = new Image();
  img.onload = () => {
    setTraceImage(img);
    setTraceImageUrl(trace.imageDataUrl);
    setTraceFileName("Draft image");
    ...
    traceUrlRef.current = null;
  };
  img.src = trace.imageDataUrl;
```

**REPLACE WITH:**
```typescript
if (trace?.imageDataUrl) {
  const img = new Image();
  if (trace.imageDataUrl.startsWith("https://")) {
    img.crossOrigin = "anonymous";
  }
  img.onload = () => {
    setTraceImage(img);
    setTraceImageUrl(trace.imageDataUrl);
    setTraceFileName("Draft image");
    ...
  };
  img.src = trace.imageDataUrl;
```

**What changed:**
- Added `crossOrigin = "anonymous"` for HTTPS URLs (same reason as 4d)
- Removed `traceUrlRef.current = null` (ref no longer exists)

### 5e. Replace `traceUrlRef` hook arg with `traceUploadState`

**In `UseWipDraftsArgs` type:**
```typescript
// DELETE:
traceUrlRef: MutableRefObject<string | null>;

// ADD:
traceUploadState: "idle" | "uploading" | "error";
setTraceUploadState: (value: "idle" | "uploading" | "error") => void;
```

**In the destructured args of the hook function:**
- Remove `traceUrlRef`
- Add `traceUploadState`, `setTraceUploadState`

---

## 6. Modified: `app/api/wip/[id]/route.ts`

### ~~6a. PUT handler — clean up replaced blob~~ — REMOVED

**No blob cleanup on PUT.** When a user swaps images, the old blob URL may still be referenced by historical `PatternVersion` records. Deleting it would break version history.

### 6b. DELETE handler — clean up all blobs (lines 135–156)

**REPLACE the delete logic with:**

```typescript
import { extractBlobUrl, deleteBlobIfExists } from "@/lib/blob";

// ... inside DELETE handler, before deleteMany:

// Collect blob URLs from draft and all versions for cleanup
const existing = await prisma.patternDraft.findFirst({
  where: { id, userId },
  include: { versions: { select: { data: true } } },
});

if (!existing) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

const result = await prisma.patternDraft.deleteMany({
  where: { id, userId },
});

if (result.count === 0) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// Best-effort blob cleanup (fire-and-forget)
const blobUrls = new Set<string>();
const draftBlob = extractBlobUrl(existing.data);
if (draftBlob) blobUrls.add(draftBlob);
for (const v of existing.versions) {
  const vBlob = extractBlobUrl(v.data);
  if (vBlob) blobUrls.add(vBlob);
}
for (const url of blobUrls) {
  void deleteBlobIfExists(url);
}

return NextResponse.json({ ok: true });
```

**Why:** When a draft is deleted, its associated blobs should be cleaned up. We collect unique URLs from the draft and all versions, then delete them after the DB delete succeeds.

### 6c. NEW: orphaned blob garbage collection (scheduled)

Uploads can still orphan blobs (for example: user uploads then abandons page before save, or stale upload completion loses the race). Add periodic GC instead of eager overwrite deletion.

**NEW file:** `app/api/internal/blob-gc/route.ts` (Node runtime, protected with secret)

```typescript
import { NextResponse } from "next/server";
import { del, list } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { extractBlobUrl } from "@/lib/blob";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.BLOB_GC_SECRET || secret !== process.env.BLOB_GC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drafts = await prisma.patternDraft.findMany({
    select: { data: true, versions: { select: { data: true } } },
  });

  const referenced = new Set<string>();
  for (const draft of drafts) {
    const draftUrl = extractBlobUrl(draft.data);
    if (draftUrl) referenced.add(draftUrl);
    for (const v of draft.versions) {
      const vUrl = extractBlobUrl(v.data);
      if (vUrl) referenced.add(vUrl);
    }
  }

  const now = Date.now();
  const minAgeMs = 24 * 60 * 60 * 1000; // 24h grace period
  let cursor: string | undefined;
  let deleted = 0;

  do {
    const page = await list({ cursor, limit: 1000 });
    for (const blob of page.blobs) {
      if (referenced.has(blob.url)) continue;
      const ageMs = now - new Date(blob.uploadedAt).getTime();
      if (ageMs < minAgeMs) continue;
      await del(blob.url);
      deleted += 1;
    }
    cursor = page.cursor;
  } while (cursor);

  return NextResponse.json({ ok: true, deleted, referenced: referenced.size });
}
```

**Deploy config:**  
- Add `BLOB_GC_SECRET` env var  
- Schedule this route with Vercel Cron (for example: hourly)

---

## 7. Modified: `app/api/wip/route.ts` and `app/api/wip/[id]/route.ts`

### Update `DraftPayload` type comment

The `imageDataUrl` field name stays the same (renaming it would break existing saved drafts), but update the type to clarify:

```typescript
trace: {
  imageDataUrl: string | null; // Vercel Blob URL (https://...) or legacy data: URL
  ...
};
```

No functional change — just documentation.

---

## 8. NOT Modified

| File | Why unchanged |
|------|---------------|
| `prisma/schema.prisma` | Image lives inside `Json` column, not its own column. No migration needed. |
| `canvas/useGridRenderer.ts` | Only calls `ctx.drawImage()` (write-only). CORS only matters for pixel-reading ops. |
| `canvas/GridCanvas.tsx` | Pixel sampling via `getImageData` uses the `HTMLImageElement` from state — as long as it was loaded with `crossOrigin` in the effect (section 4e), canvas operations work. No change needed here. |
| `utils/imageToPattern.ts` | Same as above — uses the pre-loaded `HTMLImageElement`. |
| `utils/colorUtils.ts` | Same — operates on a canvas already drawn from the correctly-loaded image. |

---

## 9. Migration Strategy

**Approach: Lazy (no migration script)**

When a user loads a pre-migration draft containing a `data:` URL:
1. `applyDraft()` loads it into state as before
2. On the next save, `buildDraftPayload()` detects `data:` prefix
3. Converts it to a Blob, uploads to Vercel Blob, gets HTTPS URL
4. Saves HTTPS URL to DB, updates state
5. All future saves for this draft use the URL — migration complete

**Fallback:** If migration upload fails (network/auth/etc), the save is blocked with an error message; the draft in DB is not overwritten with `null`, and migration retries on the next save.

---

## 10. Summary of Changes

| Action | File |
|--------|------|
| **NEW** | `app/api/upload-trace/route.ts` |
| **NEW** | `lib/blob.ts` |
| **ADD dep** | `@vercel/blob` in `package.json` |
| **ADD env** | `BLOB_READ_WRITE_TOKEN` in `.env.local` + Vercel |
| **ADD env** | `BLOB_GC_SECRET` for protected blob-GC route |
| **MODIFY** | `components/pattern-editor/PatternEditor.tsx` |
| **MODIFY** | `components/pattern-editor/hooks/useWipDrafts.ts` |
| **MODIFY** | `app/api/wip/[id]/route.ts` |
| **MODIFY** | `app/api/wip/route.ts` (type comment only) |
| **NEW** | `app/api/internal/blob-gc/route.ts` (scheduled GC) |
| **DELETE code** | `buildTraceImageDataUrl()` function |
| **DELETE code** | `traceUrlRef` usage |
| **ADD code** | `tracePreviewObjectUrlRef` + `traceUploadSeqRef` + `traceUploadState` |
| **UNCHANGED** | `prisma/schema.prisma` — no DB migration |
| **UNCHANGED** | Canvas rendering, pixel sampling, image-to-pattern — all work via the pre-loaded `HTMLImageElement` |
