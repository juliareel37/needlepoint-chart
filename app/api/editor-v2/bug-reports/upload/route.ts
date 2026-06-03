import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BUG_REPORT_UPLOAD_BYTES = 10 * 1024 * 1024;
const BUG_REPORT_UPLOAD_PATH_PATTERN =
  /^editor-v2-bug-report-\d+-[0-9a-f-]+\/screenshot\.[a-z0-9]+$/i;
const ALLOWED_BUG_REPORT_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

function isValidBugReportUploadPath(pathname: string) {
  return BUG_REPORT_UPLOAD_PATH_PATTERN.test(pathname);
}

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
        if (!isValidBugReportUploadPath(pathname)) {
          throw new Error("Invalid upload path");
        }

        return {
          addRandomSuffix: false,
          allowedContentTypes: [...ALLOWED_BUG_REPORT_CONTENT_TYPES],
          maximumSizeInBytes: MAX_BUG_REPORT_UPLOAD_BYTES,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        if (!ALLOWED_BUG_REPORT_CONTENT_TYPES.includes(blob.contentType as never)) {
          throw new Error("Unsupported file type");
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : "Bug report upload token generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
