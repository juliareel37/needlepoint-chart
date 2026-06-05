import { createNeonAuth } from "@neondatabase/auth/next/server";

const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
const neonAuthCookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!neonAuthBaseUrl) {
  throw new Error("Missing NEON_AUTH_BASE_URL");
}

if (!neonAuthCookieSecret) {
  throw new Error("Missing NEON_AUTH_COOKIE_SECRET");
}

export const auth = createNeonAuth({
  baseUrl: neonAuthBaseUrl,
  cookies: {
    secret: neonAuthCookieSecret,
  },
});
