import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Manrope, Geist_Mono } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { assetPath } from "../lib/assetPath";
import HeaderAuth from "../components/auth/HeaderAuth";

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
      { url: assetPath("/wippa_logo_icon2.png"), type: "image/png" },
      // { url: assetPath("/favicon.png"), type: "image/png" },
    ],
    shortcut: assetPath("/wippa_logo_icon2.png"),
    apple: assetPath("/wippa_logo_icon2.png"),
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
  padding: 0,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  "--app-header-height": "52px",
  "--app-top-banner-height": "0px",
  "--app-top-offset": "calc(var(--app-header-height) + var(--app-top-banner-height))",
};

const headerUtilityLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 28,
  padding: "6px 10px",
  borderRadius: 12,
  color: "var(--text-secondary)",
  textDecoration: "none",
  fontSize: 10,
  lineHeight: "14px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  transition: "background-color 140ms ease, color 140ms ease",
};

const themeBootstrapScript = `
(() => {
  try {
    const saved = window.localStorage.getItem("wippa:theme");
    const resolved = saved === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : saved;
    if (resolved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey) {
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
                This deployment is missing the Clerk publishable key. Add
                <code style={{ marginLeft: 4, marginRight: 4 }}>
                  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
                </code>
                to the production environment for this app and redeploy.
              </p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        </head>
        <body className={`${uiSans.variable} ${geistMono.variable} antialiased`}>
          <div id="app-shell-root" style={appShellStyle}>
            <div id="app-top-banner" className="app-top-banner-slot" />
            <div
              className="app-shell-header"
              style={{
                height: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 28px 0 16px",
                background: "var(--surface-primary)",
                borderBottom: "1px solid var(--ui-border-reg)",
                position: "relative",
                zIndex: "var(--z-app-header)",
              }}
            >
              <div className="app-shell-header-left" style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1 }}>
                <img
                  src={assetPath("/wippa_logo.png")}
                  alt="Wippa"
                  style={{ height: 24, width: "auto", display: "block" }}
                />
                {/* <Link
                  href="/editor-v2/design-system"
                  style={headerUtilityLinkStyle}
                >
                  V2 DS
                </Link> */}
                <div id="app-header-history" />
                <div id="app-header-file-left" />
                <div id="app-header-autosave" />
              </div>
              <div
                id="app-header-title"
                className="app-header-title-slot"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 0,
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
            <div style={{ flex: "1 1 auto", minHeight: 0 }}>
              {children}
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
