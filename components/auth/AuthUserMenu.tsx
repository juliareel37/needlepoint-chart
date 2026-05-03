"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { typographyStyles } from "@/app/design-system/typography";
import {
  MenuChevronIcon,
  MenuDivider,
  MenuItem,
  MenuSurface,
  MenuTrigger,
} from "@/components/design-system";
import { useAuthActions, useAuthSession } from "@/lib/auth/client";
import { AuthAccountSettingsModal } from "./AuthAccountSettingsModal";
import styles from "./AuthUserMenu.module.css";

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.trim() || "U";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AuthUserMenu() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [portalStyle, setPortalStyle] = useState<CSSProperties | null>(null);
  const { user } = useAuthSession();
  const { signOut } = useAuthActions();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      const clickedTrigger = Boolean(target && rootRef.current?.contains(target));
      const clickedMenu = Boolean(target && menuRef.current?.contains(target));

      if (!target || clickedTrigger || clickedMenu) {
        return;
      }

      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open || !mounted || !rootRef.current || !menuRef.current) {
      return;
    }

    function updatePortalStyle() {
      if (!rootRef.current || !menuRef.current) {
        return;
      }

      const viewportPadding = 12;
      const triggerRect = rootRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const measuredMenuWidth = menuRect.width || 220;
      const measuredMenuHeight = menuRect.height || 0;
      const left = Math.min(
        Math.max(triggerRect.right - measuredMenuWidth, viewportPadding),
        window.innerWidth - measuredMenuWidth - viewportPadding,
      );
      const top = Math.min(
        triggerRect.bottom + 10,
        window.innerHeight - measuredMenuHeight - viewportPadding,
      );

      setPortalStyle({
        position: "fixed",
        top,
        left,
        zIndex: "var(--z-editor-popover)",
        visibility: "visible",
      });
    }

    updatePortalStyle();

    const rafId = window.requestAnimationFrame(updatePortalStyle);
    window.addEventListener("resize", updatePortalStyle);
    window.addEventListener("scroll", updatePortalStyle, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePortalStyle);
      window.removeEventListener("scroll", updatePortalStyle, true);
    };
  }, [mounted, open]);

  const initials = useMemo(
    () => getInitials(user?.name, user?.email),
    [user?.email, user?.name],
  );

  if (!user) {
    return null;
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    const result = await signOut();
    setIsSigningOut(false);

    if (result.error) {
      return;
    }

    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <MenuTrigger
        type="button"
        variant="ghost"
        open={open}
        onClick={() => setOpen((value) => !value)}
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.avatar} aria-hidden="true">
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className={styles.avatarImage}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span style={typographyStyles.p2}>{initials}</span>
          )}
        </span>
        <span className={styles.meta}>
          <span className={styles.name} style={typographyStyles.p2}>
            {user.name || "Account"}
          </span>
          {/* <span className={styles.email} style={typographyStyles.s}>
            {user.email}
          </span> */}
        </span>
        <MenuChevronIcon open={open} />
      </MenuTrigger>
      {open && mounted
        ? createPortal(
            <MenuSurface
              ref={menuRef}
              className={styles.surface}
              role="menu"
              aria-label="Account menu"
              style={portalStyle ?? { visibility: "hidden" }}
            >
              <div className={styles.summary}>
                {/* <span className={styles.summaryLabel} style={typographyStyles.s}>
                  Signed in as
                </span> */}
                <span className={styles.summaryName} style={typographyStyles.p2}>
                  {user.name || "Account"}
                </span>
                <span className={styles.summaryEmail} style={typographyStyles.s}>
                  {user.email}
                </span>
              </div>
              <MenuDivider />
              <MenuItem
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSettingsOpen(true);
                }}
              >
                Account settings
              </MenuItem>
              <MenuDivider />
              <MenuItem
                type="button"
                onClick={() => {
                  void handleSignOut();
                }}
                className={styles.signOutItem}
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </MenuItem>
            </MenuSurface>,
            document.body,
          )
        : null}
      <AuthAccountSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
