"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { Button } from "@/components/design-system";
import { useAuthAccessState } from "@/lib/auth/client";

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
  textDecoration: "none",
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
} as const;

const editorBrandStyle = {
  ...brandStyle,
} as const;

const brandLogoStyle = {
  display: "block",
  width: "auto",
  height: 28,
} as const;

const editorBrandLogoStyle = {
  ...brandLogoStyle,
  height: 24,
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
  const { isLoaded, hasAppAccess } = useAuthAccessState();
  const showLandingHeader =
    pathname === "/" ||
    pathname === "/library" ||
    pathname === "/privacy" ||
    pathname === "/terms";
  const showHeroResponsiveHeader = pathname === "/";
  const showEditorBrandOnly =
    pathname.startsWith("/editor") || pathname.startsWith("/editor-v2");
  const showResumeCta = isLoaded && hasAppAccess;

  useEffect(() => {
    const appShellRoot = window.document.getElementById("app-shell-root");
    if (!appShellRoot) {
      return;
    }

    const headerNavMode = showLandingHeader
      ? "landing"
      : showEditorBrandOnly
        ? "editor"
        : "default";

    appShellRoot.setAttribute("data-header-nav-mode", headerNavMode);

    return () => {
      appShellRoot.removeAttribute("data-header-nav-mode");
    };
  }, [showEditorBrandOnly, showLandingHeader]);

  useEffect(() => {
    const appShellRoot = window.document.getElementById("app-shell-root");
    const scrollRegion = window.document.getElementById("app-shell-scroll-region");
    const heroSection = window.document.getElementById("canvas");

    if (!appShellRoot) {
      return;
    }

    if (!showHeroResponsiveHeader || !scrollRegion || !heroSection) {
      appShellRoot.setAttribute("data-landing-header-visual", "solid");
      return () => {
        appShellRoot.removeAttribute("data-landing-header-visual");
      };
    }

    const updateHeaderVisual = () => {
      const solidThreshold = Math.max(heroSection.offsetTop + heroSection.offsetHeight - 96, 0);
      const visualMode = scrollRegion.scrollTop < solidThreshold ? "transparent" : "solid";
      appShellRoot.setAttribute("data-landing-header-visual", visualMode);
    };

    updateHeaderVisual();
    scrollRegion.addEventListener("scroll", updateHeaderVisual, { passive: true });
    window.addEventListener("resize", updateHeaderVisual);

    return () => {
      scrollRegion.removeEventListener("scroll", updateHeaderVisual);
      window.removeEventListener("resize", updateHeaderVisual);
      appShellRoot.removeAttribute("data-landing-header-visual");
    };
  }, [showHeroResponsiveHeader]);

  if (showEditorBrandOnly) {
    return (
      <Link href="/" style={editorBrandStyle} aria-label="Wippa home">
        <Image
          src="/logos/curly/icon-bw.png"
          alt="Wippa"
          width={344}
          height={72}
          style={editorBrandLogoStyle}
          priority
        />
      </Link>
    );
  }

  if (!showLandingHeader) {
    return null;
  }

  return (
    <div style={landingHeaderWrapStyle}>
      <div style={landingHeaderLeftStyle}>
        <Link href="/" style={brandStyle} aria-label="Wippa home">
          <Image
            src="/logos/curly/sage-mint-full.png"
            alt="Wippa"
            width={344}
            height={72}
            style={brandLogoStyle}
            priority
          />
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
      <div className="landing-header-actions" style={landingHeaderRightStyle}>
        {/* <Link href="/library" style={utilityLinkStyle}>
          My Library
        </Link> */}
        <Link href={showResumeCta ? "/editor" : "/?waitlist=1"} style={{ textDecoration: "none" }}>
          <Button type="button" variant="secondary" size="md" className="landing-header-cta">
            {showResumeCta ? "Launch Editor" : "Join Waitlist"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
