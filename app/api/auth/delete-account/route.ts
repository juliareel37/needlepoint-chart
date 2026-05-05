import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth, getAuthSession } from "@/lib/auth/server";
import { deleteBlobIfExists, extractEditorV2TraceBlobUrls } from "@/lib/blob";

export const runtime = "nodejs";

const NEON_AUTH_COOKIE_PREFIX = "__Secure-neon-auth";
const NEON_AUTH_SESSION_DATA_COOKIE_NAME = `${NEON_AUTH_COOKIE_PREFIX}.local.session_data`;
const NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME = `${NEON_AUTH_COOKIE_PREFIX}.session_challange`;
const NEON_AUTH_SESSION_COOKIE_NAME = `${NEON_AUTH_COOKIE_PREFIX}.session_token`;

function isDeleteConfirmation(value: unknown) {
  return typeof value === "string" && value.trim().toLowerCase() === "delete";
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  const appUserId = session.userId;
  const authUserId = session.authUserId;

  if (!appUserId && !authUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { confirmation?: unknown } | null;
  if (!isDeleteConfirmation(body?.confirmation)) {
    return NextResponse.json(
      { error: 'Type "delete" to confirm account deletion.' },
      { status: 400 },
    );
  }

  const editorDesigns = appUserId
    ? await prisma.editorDesign.findMany({
        where: { appUserId },
        select: {
          data: true,
          versions: {
            select: {
              data: true,
            },
          },
        },
      })
    : [];

  const blobUrls = new Set<string>();
  for (const design of editorDesigns) {
    for (const url of extractEditorV2TraceBlobUrls(design.data)) {
      blobUrls.add(url);
    }

    for (const version of design.versions) {
      for (const url of extractEditorV2TraceBlobUrls(version.data)) {
        blobUrls.add(url);
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    if (appUserId) {
      await tx.patternDraft.deleteMany({
        where: { userId: appUserId },
      });

      await tx.appUser.deleteMany({
        where: { id: appUserId },
      });
    }

    if (authUserId) {
      await tx.$executeRaw(
        Prisma.sql`DELETE FROM neon_auth."user" WHERE id = ${authUserId}::uuid`,
      );
    }
  });

  try {
    await auth.signOut();
  } catch {
    // Best effort only: auth rows are already gone, so sign-out may no-op.
  }

  for (const url of blobUrls) {
    void deleteBlobIfExists(url);
  }

  const response = NextResponse.json({ ok: true });

  for (const cookieName of [
    NEON_AUTH_SESSION_COOKIE_NAME,
    NEON_AUTH_SESSION_DATA_COOKIE_NAME,
    NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME,
  ]) {
    response.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  }

  return response;
}
