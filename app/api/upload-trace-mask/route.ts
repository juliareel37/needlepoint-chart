import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getTraceBaseName } from "../upload-trace/shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const originalUrl = formData?.get("originalUrl");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing mask file" }, { status: 400 });
  }

  if (file.type !== "image/png") {
    return NextResponse.json({ error: "Mask must be a PNG" }, { status: 415 });
  }

  const pathname = buildTraceMaskPath(typeof originalUrl === "string" ? originalUrl : null);
  const upload = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/png",
  });

  return NextResponse.json({ url: upload.url });
}

function buildTraceMaskPath(originalUrl: string | null): string {
  if (originalUrl) {
    try {
      const pathname = new URL(originalUrl).pathname.replace(/^\/+/, "");
      if (/\/original\.[a-z0-9]+$/i.test(pathname)) {
        return `${getTraceBaseName(pathname)}/mask-${Date.now()}.png`;
      }
    } catch {
      // Fall through to a generic trace mask path.
    }
  }

  return `editor-v2-trace-mask-${Date.now()}-${crypto.randomUUID()}/mask.png`;
}
