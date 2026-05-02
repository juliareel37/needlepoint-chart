"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  Field,
  FieldInput,
  Panel,
  panelMutedTextStyle,
} from "@/components/design-system";
import { useAuthActions, useAuthSession } from "@/lib/auth/client";
import styles from "./AuthPage.module.css";

type StatusState =
  | { tone: "error"; message: string }
  | { tone: "success"; message: string }
  | null;

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
}

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.trim() || "U";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AuthAccountSettingsPanel({
  onAfterSignOut,
}: {
  onAfterSignOut?: () => void;
}) {
  const router = useRouter();
  const { changeEmail, signOut, updateUser } = useAuthActions();
  const { isLoaded, isSignedIn, refetch, user } = useAuthSession();
  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  const currentName = user?.name ?? "";
  const currentEmail = user?.email ?? "";
  const nextName = nameValue.trim();
  const nextEmail = emailValue.trim();
  const hasChanges = nextName !== currentName || nextEmail !== currentEmail;

  useEffect(() => {
    setNameValue(currentName);
    setEmailValue(currentEmail);
    setStatus(null);
  }, [currentEmail, currentName, user?.id]);

  async function handleSignOut() {
    try {
      const result = await signOut();
      if (result.error) {
        return;
      }

      onAfterSignOut?.();
      router.push("/");
      router.refresh();
    } catch {
      return;
    }
  }

  function handleResetForm() {
    setNameValue(currentName);
    setEmailValue(currentEmail);
    setStatus(null);
  }

  async function handleAccountUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    if (!nextName) {
      setStatus({
        tone: "error",
        message: "Please enter the name you want to show in the app.",
      });
      return;
    }

    if (!nextEmail) {
      setStatus({
        tone: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    if (!hasChanges) {
      setStatus({
        tone: "success",
        message: "Your account details are already up to date.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    let nameUpdated = false;
    let emailChangeStarted = false;
    let nameError: string | null = null;
    let emailError: string | null = null;

    if (nextName !== currentName) {
      try {
        const result = await updateUser({ name: nextName });
        if (result.error) {
          nameError = result.error.message ?? "We couldn't update your display name.";
        } else {
          nameUpdated = true;
        }
      } catch (error) {
        nameError = getErrorMessage(error, "We couldn't update your display name.");
      }
    }

    if (nextEmail !== currentEmail) {
      try {
        const result = await changeEmail({
          newEmail: nextEmail,
          callbackURL: typeof window === "undefined" ? undefined : window.location.href,
        });
        if (result.error) {
          emailError = result.error.message ?? "We couldn't start the email change flow.";
        } else {
          emailChangeStarted = true;
        }
      } catch (error) {
        emailError = getErrorMessage(error, "We couldn't start the email change flow.");
      }
    }

    if (nameUpdated) {
      await refetch();
      router.refresh();
    }

    setIsSubmitting(false);

    if (nameError || emailError) {
      const partialSuccess = [
        nameUpdated ? "Your display name was updated." : null,
        emailChangeStarted
          ? `We also sent a confirmation email to ${nextEmail} so you can finish changing your sign-in email.`
          : null,
      ]
        .filter(Boolean)
        .join(" ");
      const failures = [nameError, emailError].filter(Boolean).join(" ");

      setStatus({
        tone: "error",
        message: [partialSuccess, failures].filter(Boolean).join(" "),
      });
      return;
    }

    if (emailChangeStarted) {
      setStatus({
        tone: "success",
        message: `We sent a confirmation email to ${nextEmail}. Open that link to finish updating your sign-in email.`,
      });
      return;
    }

    setStatus({
      tone: "success",
      message: "Your account settings were updated.",
    });
  }

  function renderStatus() {
    if (!status) {
      return null;
    }

    return (
      <div
        className={[
          styles.status,
          status.tone === "error" ? styles.statusError : styles.statusSuccess,
        ]
          .filter(Boolean)
          .join(" ")}
        style={typographyStyles.p2}
      >
        {status.message}
      </div>
    );
  }

  return (
    <div className={styles.accountGrid}>
      {!isLoaded ? (
        <Panel className={styles.mainPanel} title="Loading" description="Checking your session...">
          <p style={panelMutedTextStyle}>We'll bring your account details in as soon as the session finishes loading.</p>
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
                  <span style={typographyStyles.h4}>{getInitials(user.name, user.email)}</span>
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

          <Panel
            className={styles.mainPanel}
            title="Account settings"
            // description="Update your profile name here. Email changes send a confirmation link before the new address becomes active."
          >
            <form className={styles.form} onSubmit={handleAccountUpdate}>
              {renderStatus()}
              <Field label="Name" 
              // hint="This is what the app shows in your account menu and settings."
              >
                <FieldInput
                  type="text"
                  autoComplete="name"
                  value={nameValue}
                  onChange={(event) => setNameValue(event.currentTarget.value)}
                  placeholder="Your name"
                  required
                />
              </Field>
              <Field
                label="Email"
                // hint="Changing this sends a confirmation email to the new address before your sign-in email actually switches."
              >
                <FieldInput
                  type="email"
                  autoComplete="email"
                  value={emailValue}
                  onChange={(event) => setEmailValue(event.currentTarget.value)}
                  placeholder="you@example.com"
                  required
                />
              </Field>
              {/* <div className={styles.accountDetailList}>
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
              </div> */}
              <div className={styles.buttonRow}>
                {/* {hasChanges ? (
                  <Button type="button" variant="secondary" onClick={handleResetForm} disabled={isSubmitting}>
                    Reset
                  </Button>
                ) : null} */}
                <Button type="submit" variant="primary" disabled={isSubmitting || !hasChanges}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Panel>

          <Panel
            className={styles.mainPanel}
            title="Password & recovery"
            description="Email/password users can use the reset flow at any time. Google sign-in is managed through your Google account."
          >
            <p style={panelMutedTextStyle}>
              If you need to rotate your password, the reset flow is the safest path for now.
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
  );
}
