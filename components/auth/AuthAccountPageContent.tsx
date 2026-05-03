"use client";

import { typographyStyles } from "@/app/design-system/typography";
import { Panel } from "@/components/design-system";
import { IS_DEV_APP_MODE } from "@/lib/editor-v2/config";
import { AuthAccountSettingsPanel } from "./AuthAccountSettingsPanel";
import styles from "./AuthPage.module.css";

export function AuthAccountPageContent({ pathname }: { pathname: string }) {
  const title = "Account settings";
  const description = "Review and update the account details Neon Auth is currently providing to the app.";

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
        <AuthAccountSettingsPanel />
      </div>
    </div>
  );
}
