import type { Metadata, Viewport } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { assetPath } from "../lib/assetPath";
import HeaderAuth from "../components/auth/HeaderAuth";
import { AuthProvider } from "@/lib/auth/client";
import AppHeaderNav from "@/components/app/AppHeaderNav";
import { getCurrentUserThemePreference } from "@/lib/auth/server";
import { THEME_MODE_ATTRIBUTE } from "@/lib/theme/themePreference";

const uiSans = Manrope({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wippa: Needlepoint Pattern Editing Tool",
  description: "Create and customize needlepoint patterns with ease.",
  icons: {
    icon: [
      { url: assetPath("/w.png"), type: "image/png" },
      // { url: assetPath("/favicon.png"), type: "image/png" },
    ],
    shortcut: assetPath("/w.png"),
    apple: assetPath("/w.png"),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const appShellStyle: CSSProperties &
  Record<"--app-header-height" | "--app-top-banner-height" | "--app-top-offset", string> = {
  position: "relative",
  width: "100%",
  height: "100vh",
  minHeight: "100dvh",
  padding: 0,
  display: "flex",
  flexDirection: "column",
  "--app-header-height": "52px",
  "--app-top-banner-height": "0px",
  "--app-top-offset": "calc(var(--app-header-height) + var(--app-top-banner-height))",
};

function createThemeBootstrapScript(profileThemeMode: string | null) {
  return `
(() => {
  try {
    const profileTheme = ${JSON.stringify(profileThemeMode)};
    const saved = window.localStorage.getItem("wippa:theme");
    const nextTheme = profileTheme === "light" || profileTheme === "dark" || profileTheme === "system"
      ? profileTheme
      : (saved === "light" || saved === "dark" || saved === "system" ? saved : "light");
    const resolved = nextTheme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : nextTheme;
    document.documentElement.setAttribute(${JSON.stringify(THEME_MODE_ATTRIBUTE)}, nextTheme);
    if (resolved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    window.localStorage.setItem("wippa:theme", nextTheme);
  } catch {}
})();
`;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
  const neonAuthCookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!neonAuthBaseUrl || !neonAuthCookieSecret) {
    return (
      <html lang="en">
        <body className={`${uiSans.variable} ${geistMono.variable} antialiased`}>
          <div
            style={{
              minHeight: "100vh",
              display: "grid",
              placeItems: "center",
              padding: 24,
              background: "var(--surface-primary, #ffffff)",
              color: "var(--text-primary, #111111)",
            }}
          >
            <div
              style={{
                width: "min(560px, 100%)",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: 16,
                padding: 24,
                background: "rgba(255, 255, 255, 0.92)",
                boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08)",
              }}
            >
              <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.2 }}>
                Auth Configuration Missing
              </h1>
              <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.6 }}>
                This deployment is missing the Neon Auth configuration. Add
                <code style={{ marginLeft: 4, marginRight: 4 }}>
                  NEON_AUTH_BASE_URL
                </code>
                and
                <code style={{ marginLeft: 4, marginRight: 4 }}>
                  NEON_AUTH_COOKIE_SECRET
                </code>
                to the production environment for this app and redeploy.
              </p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  const profileThemeMode = await getCurrentUserThemePreference();
  const themeBootstrapScript = createThemeBootstrapScript(profileThemeMode);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={`${uiSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <div id="app-shell-root" style={appShellStyle}>
            <div id="app-top-banner" className="app-top-banner-slot" />
            <div
              className="app-shell-header"
              style={{
                height: 64,
                minHeight: 64,
                flex: "0 0 64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 14px 0 14px",
                background: "var(--surface-primary)",
                borderBottom: "1px solid var(--ui-border-reg)",
                position: "relative",
                zIndex: "var(--z-app-header)",
              }}
            >
              <div className="app-shell-header-left" style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1, minWidth: 0, flex: "1 1 auto" }}>
                <AppHeaderNav />
                <div id="app-header-history" />
                <div id="app-header-autosave" />
                <div id="app-header-file-left" />
              </div>
              <div
                id="app-header-title"
                className="app-header-title-slot"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 4,
                }}
              />
              <div className="app-shell-header-right" style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 3 }}>
                <div className="app-shell-header-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div id="app-header-file-right" />
                  <div id="app-header-actions" />
                </div>
                <div id="app-header-history-right" />
                <HeaderAuth />
                <div id="app-header-overflow-right" />
              </div>
            </div>
            <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" }}>
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
