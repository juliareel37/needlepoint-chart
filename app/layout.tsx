import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Manrope, Geist_Mono } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
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
      { url: assetPath("/wippa_logo_icon.png"), type: "image/png" },
      { url: assetPath("/favicon.png"), type: "image/png" },
    ],
    shortcut: assetPath("/wippa_logo_icon.png"),
    apple: assetPath("/wippa_logo_icon.png"),
  },
};

const appShellStyle: CSSProperties & Record<"--app-header-height", string> = {
  position: "relative",
  width: "100%",
  padding: 0,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  "--app-header-height": "52px",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${uiSans.variable} ${geistMono.variable} antialiased`}>
          <div style={appShellStyle}>
            <div
              style={{
                height: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 28px 0 16px",
                background: "var(--card-bg)",
                borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
                position: "relative",
                zIndex: 200,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1 }}>
                <img
                  src={assetPath("/wippa_logo.png")}
                  alt="Wippa"
                  style={{ height: 24, width: "auto", display: "block" }}
                />
                <div id="app-header-file" />
                <div id="app-header-autosave" />
              </div>
              <div
                id="app-header-title"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 0,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <div id="app-header-actions" />
                <HeaderAuth />
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
