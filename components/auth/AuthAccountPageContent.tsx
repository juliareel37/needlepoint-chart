"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { typographyStyles } from "@/app/design-system/typography";
import { Button, Panel, panelMutedTextStyle } from "@/components/design-system";
import { IS_DEV_APP_MODE } from "@/lib/editor-v2/config";
import { useAuthActions, useAuthSession } from "@/lib/auth/client";
import styles from "./AuthPage.module.css";

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.trim() || "U";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AuthAccountPageContent({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isLoaded, isSignedIn, user } = useAuthSession();

  async function handleSignOut() {
    const result = await signOut();
    if (result.error) {
      return;
    }

    router.push("/");
    router.refresh();
  }

  const title = pathname === "security" ? "Security" : "Account settings";
  const description =
    pathname === "security"
      ? "Manage how you sign in and how password recovery behaves across this app."
      : "Review the account details Neon Auth is currently providing to the app.";

  return (
    <div className={styles.page}>
      <div className={[styles.shell, !IS_DEV_APP_MODE ? styles.shellCompact : null].filter(Boolean).join(" ")}>
        {IS_DEV_APP_MODE ? (
          <aside className={styles.aside}>
            <Panel className={styles.heroPanel}>
              <div className={styles.header}>
                <span className={styles.eyebrow} style={typographyStyles.s}>
                  Account
                </span>
                <h1 className={styles.heroTitle} style={typographyStyles.h2}>
                  {title}
                </h1>
                <p className={styles.heroCopy} style={typographyStyles.p1}>
                  {description}
                </p>
              </div>
              <ul className={styles.featureList}>
                <li className={styles.featureItem} style={typographyStyles.p2}>
                  <span className={styles.featureDot} aria-hidden="true" />
                  Your auth screens now share the app's own tokens, spacing, and dark mode.
                </li>
                <li className={styles.featureItem} style={typographyStyles.p2}>
                  <span className={styles.featureDot} aria-hidden="true" />
                  Google OAuth and email/password still run through Neon under the hood.
                </li>
              </ul>
            </Panel>
          </aside>
        ) : null}

        <div className={styles.accountGrid}>
          {!isLoaded ? (
            <Panel className={styles.mainPanel} title="Loading" description="Checking your session...">
              <p style={panelMutedTextStyle}>We&apos;ll bring your account details in as soon as the session finishes loading.</p>
            </Panel>
          ) : !isSignedIn || !user ? (
            <Panel
              className={styles.mainPanel}
              title="You're signed out"
              description="Sign in again to view your account settings."
            >
              <div className={styles.buttonRow}>
                <Link href="/sign-in" className={styles.link} style={typographyStyles.p2}>
                  Go to sign in
                </Link>
              </div>
            </Panel>
          ) : (
            <>
              <Panel className={styles.mainPanel}>
                <div className={styles.avatarRow}>
                  <div className={styles.avatar} aria-hidden="true">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt=""
                        className={styles.avatarImage}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span style={typographyStyles.h4}>
                        {getInitials(user.name, user.email)}
                      </span>
                    )}
                  </div>
                  <div className={styles.accountMeta}>
                    <strong className={styles.accountName} style={typographyStyles.h4}>
                      {user.name || "Account"}
                    </strong>
                    <span className={styles.accountEmail} style={typographyStyles.p2}>
                      {user.email}
                    </span>
                  </div>
                </div>
              </Panel>

              <Panel className={styles.mainPanel} title={title}>
                <div className={styles.accountDetailList}>
                  <div className={styles.accountDetail}>
                    <span className={styles.accountDetailLabel} style={typographyStyles.s}>
                      Name
                    </span>
                    <span className={styles.accountDetailValue} style={typographyStyles.p2}>
                      {user.name || "No display name set"}
                    </span>
                  </div>
                  <div className={styles.accountDetail}>
                    <span className={styles.accountDetailLabel} style={typographyStyles.s}>
                      Email
                    </span>
                    <span className={styles.accountDetailValue} style={typographyStyles.p2}>
                      {user.email}
                    </span>
                  </div>
                  <div className={styles.accountDetail}>
                    <span className={styles.accountDetailLabel} style={typographyStyles.s}>
                      Email verification
                    </span>
                    <span className={styles.accountDetailValue} style={typographyStyles.p2}>
                      {user.emailVerified ? "Verified" : "Pending verification"}
                    </span>
                  </div>
                  <div className={styles.accountDetail}>
                    <span className={styles.accountDetailLabel} style={typographyStyles.s}>
                      User ID
                    </span>
                    <span className={styles.accountDetailValue} style={typographyStyles.p2}>
                      {user.id}
                    </span>
                  </div>
                </div>
              </Panel>

              <Panel
                className={styles.mainPanel}
                title={pathname === "security" ? "Password & recovery" : "Need to change your password?"}
                description={
                  pathname === "security"
                    ? "Use the password reset flow if you signed up with email and password."
                    : "If you need to rotate your password, the reset flow is the safest path for now."
                }
              >
                <p style={panelMutedTextStyle}>
                  Google sign-in is managed by your Google account. Email/password users can use the forgot-password flow at any time.
                </p>
                <div className={styles.buttonRow}>
                  <Link href="/sign-in/forgot-password" className={styles.link} style={typographyStyles.p2}>
                    Open password reset
                  </Link>
                  <Button type="button" variant="secondary" onClick={() => void handleSignOut()}>
                    Sign out
                  </Button>
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
