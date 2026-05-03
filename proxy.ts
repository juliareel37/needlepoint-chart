import { authMiddleware } from "@/lib/auth/middleware";

export default authMiddleware;

export const config = {
  matcher: [
    "/((?!_next|dev|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
