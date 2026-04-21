import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  MAX_UPLOAD_BYTES,
  isSupportedTraceMimeType,
  isValidTraceUploadPath,
} from "./shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const { userId } = await auth();
        if (!userId) {
          throw new Error("Unauthorized");
        }

        if (!isValidTraceUploadPath(pathname)) {
          throw new Error("Invalid upload path");
        }

        return {
          addRandomSuffix: false,
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        if (!isSupportedTraceMimeType(blob.contentType)) {
          throw new Error("Unsupported file type");
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : "Trace upload token generation failed";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
