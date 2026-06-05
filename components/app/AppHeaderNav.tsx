"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { brandAssets } from "@/lib/brandAssets";

const landingHeaderWrapStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  width: "100%",
  minWidth: 0,
  position: "relative",
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
  height: 32,
} as const;

const editorBrandLogoStyle = {
  ...brandLogoStyle,
  height: 26,
} as const;

const editorHeaderWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: 20,
  minWidth: 0,
} as const;

const editorHeaderDividerStyle = {
  width: 1,
  height: 24,
  flexShrink: 0,
  backgroundColor: "var(--text-secondary)",
  opacity: 0.2,
} as const;

const navLinkStyle = {
  ...typographyStyles.p1,
  position: "relative",
  minHeight: 36,
  display: "inline-flex",
  alignItems: "center",
  color: "var(--text-secondary)",
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
  fontSize: 15,
  lineHeight: "20px",
  fontWeight: 500,
} as const;

const mobileMenuButtonStyle = {
  width: 40,
  height: 40,
  flex: "0 0 auto",
  display: "none",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--text-primary)",
  cursor: "pointer",
  transition: "color 160ms ease, opacity 160ms ease",
} as const;

const mobileMenuWrapStyle = {
  position: "relative",
  flex: "0 0 auto",
  display: "flex",
  alignItems: "center",
} as const;

const mobileMenuSurfaceStyle = {
  position: "absolute",
  top: "calc(100% + 4px)",
  right: 0,
  zIndex: "var(--z-app-header-popover)",
  width: 148,
  padding: 6,
  display: "none",
  gridTemplateColumns: "1fr",
  gap: 2,
  borderRadius: 8,
  border: "1px solid color-mix(in srgb, var(--ui-border-reg) 70%, transparent)",
  background: "var(--surface-primary)",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.1)",
} as const;

const mobileMenuLinkStyle = {
  ...typographyStyles.p2,
  minHeight: 34,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "0 10px",
  borderRadius: 6,
  color: "var(--text-primary)",
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 400,
} as const;

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function HeaderLongLogo() {
  return (
    <>
      {brandAssets.header.long.parts.map((logoPart, index) => (
        <Image
          key={logoPart.src}
          src={logoPart.src}
          alt={logoPart.alt}
          width={logoPart.width}
          height={logoPart.height}
          className={index === 1 ? "header-brand-logo-text" : undefined}
          style={{
            display: "block",
            width: "auto",
            height: logoPart.displayHeight,
          }}
          priority
        />
      ))}
    </>
  );
}

function HeaderCompactLogo({ className }: { className?: string }) {
  return (
    <Image
      src={brandAssets.header.compact.src}
      alt={brandAssets.header.compact.alt}
      width={brandAssets.header.compact.width}
      height={brandAssets.header.compact.height}
      className={className}
      style={className === "editor-header-brand-logo" ? editorBrandLogoStyle : brandLogoStyle}
      priority
    />
  );
}

export default function AppHeaderNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const showLandingHeader =
    pathname === "/" ||
    pathname === "/library" ||
    pathname === "/privacy" ||
    pathname === "/terms";
  const forceLightLandingTheme = pathname === "/";
  const showHeroResponsiveHeader = pathname === "/";
  const showLandingNavLinks = pathname === "/";
  const showAuthBrandOnly = pathname.startsWith("/sign-in");
  const showEditorBrandOnly =
    pathname.startsWith("/editor") || pathname.startsWith("/editor-v2");

  function scrollToLandingSection(sectionId: string) {
    const scrollRegion = document.getElementById("app-shell-scroll-region");
    const target = document.getElementById(sectionId);

    if (!scrollRegion || !target) {
      window.location.hash = sectionId;
      return;
    }

    const headerOffset = 112;
    const targetTop =
      scrollRegion.scrollTop +
      target.getBoundingClientRect().top -
      scrollRegion.getBoundingClientRect().top -
      headerOffset;

    scrollRegion.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
    window.history.replaceState(null, "", `#${sectionId}`);
  }

  function handleLandingAnchorClick(event: MouseEvent<HTMLAnchorElement>, sectionId: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    scrollToLandingSection(sectionId);
  }

  useEffect(() => {
    const appShellRoot = window.document.getElementById("app-shell-root");
    if (!appShellRoot) {
      return;
    }

    const headerNavMode = showLandingHeader
      ? "landing"
      : showAuthBrandOnly
        ? "auth"
      : showEditorBrandOnly
        ? "editor"
        : "default";

    appShellRoot.setAttribute("data-header-nav-mode", headerNavMode);
    if (forceLightLandingTheme) {
      appShellRoot.setAttribute("data-page-theme", "landing-light");
    } else {
      appShellRoot.removeAttribute("data-page-theme");
    }

    return () => {
      appShellRoot.removeAttribute("data-header-nav-mode");
      appShellRoot.removeAttribute("data-page-theme");
    };
  }, [forceLightLandingTheme, showAuthBrandOnly, showEditorBrandOnly, showLandingHeader]);

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
      // const visualMode = scrollRegion.scrollTop <= 1 ? "transparent" : "solid";
      const visualMode = "solid";
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (!target || !mobileMenuRef.current?.contains(target)) {
        setMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  if (showAuthBrandOnly) {
    return (
      <div className="auth-header-brand">
        <Link
          href="/"
          style={{ ...brandStyle, gap: brandAssets.header.long.gap }}
          aria-label="Wippa home"
        >
          <HeaderLongLogo />
        </Link>
      </div>
    );
  }

  if (showEditorBrandOnly) {
    return (
      <div style={editorHeaderWrapStyle}>
        <Link href="/" style={editorBrandStyle} aria-label="Wippa home">
          <HeaderCompactLogo className="editor-header-brand-logo" />
        </Link>
        <span
          aria-hidden="true"
          className="editor-header-brand-divider"
          style={editorHeaderDividerStyle}
        />
      </div>
    );
  }

  if (!showLandingHeader) {
    return null;
  }

  return (
    <div style={landingHeaderWrapStyle}>
      <div style={landingHeaderLeftStyle}>
        <Link
          href="/"
          style={{ ...brandStyle, gap: brandAssets.header.long.gap }}
          aria-label="Wippa home"
        >
          <HeaderLongLogo />
        </Link>
        {showLandingNavLinks ? (
          <nav aria-label="Primary" className="landing-header-nav" style={landingHeaderLinksStyle}>
            <Link
              href="/#features"
              className="landing-header-nav-link"
              style={navLinkStyle}
              onClick={(event) => handleLandingAnchorClick(event, "features")}
            >
                Features
            </Link>
            {/* <Link
              href="/#waitlist"
              className="landing-header-nav-link"
              style={navLinkStyle}
              onClick={(event) => handleLandingAnchorClick(event, "waitlist")}
            >
              Waitlist
            </Link> */}
            <Link
              href="/sign-in?redirect_url=%2Flibrary"
              className="landing-header-nav-link"
              style={navLinkStyle}
            >
              Sign in
            </Link>
          </nav>
        ) : null}
      </div>
      {showLandingNavLinks ? (
        <div className="landing-header-mobile-menu" ref={mobileMenuRef} style={mobileMenuWrapStyle}>
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-header-mobile-menu"
            className="landing-header-menu-button"
            style={mobileMenuButtonStyle}
            onClick={() => {
              setMobileMenuOpen((open) => !open);
            }}
          >
            <MenuIcon open={mobileMenuOpen} />
          </button>
          <nav
            id="landing-header-mobile-menu"
            aria-label="Primary"
            className="landing-header-mobile-menu-surface"
            data-open={mobileMenuOpen ? "true" : undefined}
            style={mobileMenuSurfaceStyle}
          >
            <Link
              href="/#features"
              className="landing-header-mobile-menu-link"
              style={mobileMenuLinkStyle}
              tabIndex={mobileMenuOpen ? undefined : -1}
              onClick={(event) => {
                handleLandingAnchorClick(event, "features");
                setMobileMenuOpen(false);
              }}
            >
              Features
            </Link>
            <Link
              href="/#waitlist"
              className="landing-header-mobile-menu-link"
              style={mobileMenuLinkStyle}
              tabIndex={mobileMenuOpen ? undefined : -1}
              onClick={(event) => {
                handleLandingAnchorClick(event, "waitlist");
                setMobileMenuOpen(false);
              }}
            >
              Waitlist
            </Link>
            <Link
              href="/sign-in?redirect_url=%2Flibrary"
              className="landing-header-mobile-menu-link"
              style={mobileMenuLinkStyle}
              tabIndex={mobileMenuOpen ? undefined : -1}
              onClick={() => {
                setMobileMenuOpen(false);
              }}
            >
              Sign in
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
