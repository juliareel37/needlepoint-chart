import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PAGE_PREFIXES = [
  "/admin",
  "/account",
  "/editor",
  "/editor-v2",
  "/library",
] as const;

const PROTECTED_API_PREFIXES = [
  "/api/editor-v2",
] as const;

const SIGN_IN_PREFIX = "/sign-in";
const SIGN_UP_PATH = "/sign-in/sign-up";

function hasNeonAuthSessionCookie(req: NextRequest) {
  return req.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.includes("neon-auth") && cookie.name.endsWith("session_token"),
    );
}

function isProtectedPage(pathname: string) {
  return PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isProtectedApi(pathname: string) {
  return PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function redirectTo(req: NextRequest, pathname: string, searchParams?: URLSearchParams) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = searchParams ? searchParams.toString() : "";
  return NextResponse.redirect(url);
}

export function authMiddleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const hasSessionCookie = hasNeonAuthSessionCookie(req);

  if (pathname === SIGN_UP_PATH && !searchParams.get("token")) {
    const params = new URLSearchParams();
    params.set("notice", "invite-required");
    return redirectTo(req, "/", params);
  }

  if (isProtectedApi(pathname) && !hasSessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isProtectedPage(pathname) && !hasSessionCookie) {
    if (
      pathname === "/account" ||
      pathname.startsWith("/account/") ||
      pathname === "/admin" ||
      pathname.startsWith("/admin/")
    ) {
      const params = new URLSearchParams();
      params.set("redirect_url", pathname);
      return redirectTo(req, SIGN_IN_PREFIX, params);
    }

    return redirectTo(req, "/");
  }

  return NextResponse.next();
}
