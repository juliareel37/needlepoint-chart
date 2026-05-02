"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { typographyStyles } from "@/app/design-system/typography";
import {
  MenuChevronIcon,
  MenuDivider,
  MenuItem,
  MenuSurface,
  MenuTrigger,
} from "@/components/design-system";
import { useAuthActions, useAuthSession } from "@/lib/auth/client";
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
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user } = useAuthSession();
  const { signOut } = useAuthActions();

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || rootRef.current?.contains(target)) {
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
          <span className={styles.email} style={typographyStyles.s}>
            {user.email}
          </span>
        </span>
        <MenuChevronIcon open={open} />
      </MenuTrigger>
      {open ? (
        <MenuSurface className={styles.surface} role="menu" aria-label="Account menu">
          <div className={styles.summary}>
            <span className={styles.summaryLabel} style={typographyStyles.s}>
              Signed in as
            </span>
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
              router.push("/account/settings");
            }}
          >
            Account settings
          </MenuItem>
          <MenuItem
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/account/security");
            }}
          >
            Security
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
        </MenuSurface>
      ) : null}
    </div>
  );
}
