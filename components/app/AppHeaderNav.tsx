"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { typographyStyles } from "@/app/design-system/typography";

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
  gap: 52,
  minWidth: 0,
  flex: "1 1 auto",
} as const;

const landingHeaderLinksStyle = {
  display: "flex",
  alignItems: "center",
  gap: 48,
  flexWrap: "wrap",
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
  color: "var(--text-secondary)",
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
} as const;

export default function AppHeaderNav() {
  const pathname = usePathname();
  const showLandingHeader =
    pathname === "/" ||
    pathname === "/library" ||
    pathname === "/privacy" ||
    pathname === "/terms";
  const showHeroResponsiveHeader = pathname === "/";
  const showLandingNavLinks = pathname === "/";
  const showEditorBrandOnly =
    pathname.startsWith("/editor") || pathname.startsWith("/editor-v2");

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
        {showLandingNavLinks ? (
          <nav aria-label="Primary" className="landing-header-nav" style={landingHeaderLinksStyle}>
            <Link href="/#features" style={navLinkStyle}>
              FEATURES
            </Link>
            <Link href="/#waitlist" style={navLinkStyle}>
              WAITLIST
            </Link>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
