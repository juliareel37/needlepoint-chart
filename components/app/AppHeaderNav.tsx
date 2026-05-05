"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { typographyStyles } from "@/app/design-system/typography";
import { Button } from "@/components/design-system";

const landingHeaderWrapStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  width: "100%",
  minWidth: 0,
} as const;

const landingHeaderLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: 20,
  minWidth: 0,
  flex: "1 1 auto",
} as const;

const landingHeaderLinksStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
} as const;

const landingHeaderRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flex: "0 0 auto",
} as const;

const brandStyle = {
  color: "var(--brand-400)",
  textDecoration: "none",
  fontSize: 30,
  lineHeight: 1,
  fontWeight: 700,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  fontFamily: "Playfair Display",
} as const;

const editorBrandStyle = {
  ...brandStyle,
  fontSize: 24,
} as const;

const navLinkStyle = {
  ...typographyStyles.p1,
  minHeight: 36,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 10px",
  borderRadius: 10,
  color: "var(--text-secondary)",
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
} as const;

const utilityLinkStyle = {
  ...typographyStyles.p1,
  minHeight: 36,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 6px",
  color: "var(--text-secondary)",
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
} as const;

export default function AppHeaderNav() {
  const pathname = usePathname();
  const showLandingHeader = pathname === "/" || pathname === "/library";
  const showEditorBrandOnly =
    pathname.startsWith("/editor") || pathname.startsWith("/editor-v2");

  if (showEditorBrandOnly) {
    return <Link href="/" style={editorBrandStyle}>wippa.</Link>;
  }

  if (!showLandingHeader) {
    return null;
  }

  return (
    <div style={landingHeaderWrapStyle}>
      <div style={landingHeaderLeftStyle}>
        <Link href="/" style={brandStyle}>
          wippa.
        </Link>
        {/* <nav aria-label="Primary" style={landingHeaderLinksStyle}>
          <Link href="/#canvas" style={navLinkStyle}>
            The Canvas
          </Link>
          <Link href="/#features" style={navLinkStyle}>
            Thread Library
          </Link>
          <Link href="/#begin" style={navLinkStyle}>
            Community
          </Link>
        </nav> */}
      </div>
      <div style={landingHeaderRightStyle}>
        {/* <Link href="/library" style={utilityLinkStyle}>
          My Library
        </Link> */}
        <Link href="/editor" style={{ textDecoration: "none" }}>
          <Button type="button" variant="secondary" size="md">
            Launch Editor
          </Button>
        </Link>
      </div>
    </div>
  );
}
