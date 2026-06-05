import type { NextRequest } from "next/server";
import { authMiddleware } from "@/lib/auth/middleware";
import { auth } from "@/lib/auth/neon";

const neonOAuthMiddleware = auth.middleware();
const NEON_AUTH_SESSION_VERIFIER_PARAM_NAME = "neon_auth_session_verifier";

export default async function proxy(req: NextRequest) {
  if (req.nextUrl.searchParams.has(NEON_AUTH_SESSION_VERIFIER_PARAM_NAME)) {
    return neonOAuthMiddleware(req);
  }

  return authMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!_next|dev|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
