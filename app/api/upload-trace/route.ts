import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
      maximumSizeInBytes: 10 * 1024 * 1024,
      tokenPayload: JSON.stringify({ userId }),
    }),
    onUploadCompleted: async () => {
      // URL persistence happens in the existing draft save flow.
    },
  });

  return NextResponse.json(jsonResponse);
}
