"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import AuthButtons from "./AuthButtons";

export default function HeaderAuth() {
  const pathname = usePathname();

  function handleLandingWaitlistClick(event: MouseEvent<HTMLAnchorElement>) {
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

    const scrollRegion = document.getElementById("app-shell-scroll-region");
    const target = document.getElementById("waitlist");

    if (!scrollRegion || !target) {
      return;
    }

    event.preventDefault();

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
    window.history.replaceState(null, "", "#waitlist");
  }

  if (pathname === "/") {
    return (
      <header
        className="app-header-auth landing-header-actions"
        style={{ display: "flex", justifyContent: "flex-end" }}
      >
        <Link
          href="/#waitlist"
          className="landing-header-cta"
          onClick={handleLandingWaitlistClick}
        >
          Join Waitlist
        </Link>
      </header>
    );
  }

  return (
    <header className="app-header-auth" style={{ display: "flex", justifyContent: "flex-end" }}>
      <AuthButtons />
    </header>
  );
}
