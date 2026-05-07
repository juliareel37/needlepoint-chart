"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  Field,
  FieldInput,
  Modal,
  Panel,
  panelMutedTextStyle,
} from "@/components/design-system";
import { useAuthActions, useAuthSession } from "@/lib/auth/client";
import type { AccountSettingsContext } from "@/lib/auth/account-settings";
import styles from "./AuthPage.module.css";

type StatusState =
  | { tone: "error"; message: string }
  | { tone: "success"; message: string }
  | null;

type AuthSessionSummary = {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  expiresAt: string | Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type TwoFactorSetupState = {
  backupCodes: string[];
  totpUri: string | null;
};

type TwoFactorSessionUser = {
  twoFactorEnabled?: boolean | null;
};

type TwoFactorEnableResponse = {
  backupCodes?: string[];
  totpURI?: string | null;
};

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

function formatSessionDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getRelativeSessionDateLabel(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffMs = Date.now() - date.getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.round(diffMs / minuteMs));
    return `${minutes} min ago`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.round(diffMs / hourMs));
    return `${hours} hr ago`;
  }

  const days = Math.max(1, Math.round(diffMs / dayMs));
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function getSessionDeviceLabel(userAgent: string | null | undefined, isCurrentSession: boolean) {
  if (!userAgent?.trim()) {
    return isCurrentSession ? "This device" : "Signed-in device";
  }

  const normalizedUserAgent = userAgent.toLowerCase();
  const browser =
    normalizedUserAgent.includes("edg/")
      ? "Edge"
      : normalizedUserAgent.includes("chrome/")
        ? "Chrome"
        : normalizedUserAgent.includes("safari/") && !normalizedUserAgent.includes("chrome/")
          ? "Safari"
          : normalizedUserAgent.includes("firefox/")
            ? "Firefox"
            : normalizedUserAgent.includes("opr/")
              ? "Opera"
              : "Browser";
  const device =
    normalizedUserAgent.includes("iphone") || normalizedUserAgent.includes("ios")
      ? "iPhone"
      : normalizedUserAgent.includes("ipad")
        ? "iPad"
        : normalizedUserAgent.includes("android")
          ? "Android device"
          : normalizedUserAgent.includes("mac os x") || normalizedUserAgent.includes("macintosh")
            ? "Mac"
            : normalizedUserAgent.includes("windows")
              ? "Windows device"
              : normalizedUserAgent.includes("linux")
                ? "Linux device"
                : "device";

  return `${browser} on ${device}`;
}

function getSessionLocationLabel(ipAddress: string | null | undefined) {
  return ipAddress?.trim() ? ipAddress : "Unavailable";
}

function getTotpSecret(totpUri: string | null) {
  if (!totpUri) {
    return null;
  }

  try {
    const parsedUri = new URL(totpUri);
    return parsedUri.searchParams.get("secret");
  } catch {
    return null;
  }
}

async function callAuthEndpoint<TResponse>(
  path: string,
  body?: Record<string, unknown>,
): Promise<TResponse> {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string } | string;
        message?: string;
      }
    | TResponse
    | null;

  if (!response.ok) {
    const payloadMessage =
      typeof payload === "object" && payload !== null && "error" in payload
        ? typeof payload.error === "string"
          ? payload.error
          : payload.error?.message
        : typeof payload === "object" && payload !== null && "message" in payload
          ? payload.message
          : undefined;

    throw new Error(payloadMessage ?? "The request could not be completed.");
  }

  return (payload ?? {}) as TResponse;
}

export function AuthAccountSettingsPanel({
  onAfterSignOut,
}: {
  onAfterSignOut?: () => void;
}) {
  const router = useRouter();
  const {
    changeEmail,
    listSessions,
    requestPasswordReset,
    revokeOtherSessions,
    revokeSession,
    signOut,
    updateUser,
  } = useAuthActions();
  const { isLoaded, isSignedIn, refetch, session, user } = useAuthSession();
  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [accountSettingsContext, setAccountSettingsContext] =
    useState<AccountSettingsContext | null>(null);
  const [isAccountSettingsContextLoading, setIsAccountSettingsContextLoading] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmationValue, setDeleteConfirmationValue] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);
  const [sessions, setSessions] = useState<AuthSessionSummary[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [sessionsStatus, setSessionsStatus] = useState<StatusState>(null);
  const [revokingSessionToken, setRevokingSessionToken] = useState<string | null>(null);
  const [isRevokingOtherSessions, setIsRevokingOtherSessions] = useState(false);
  const [twoFactorPasswordValue, setTwoFactorPasswordValue] = useState("");
  const [twoFactorVerificationCode, setTwoFactorVerificationCode] = useState("");
  const [twoFactorStatus, setTwoFactorStatus] = useState<StatusState>(null);
  const [isTwoFactorSubmitting, setIsTwoFactorSubmitting] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupState | null>(null);

  const currentName = user?.name ?? "";
  const currentEmail = user?.email ?? "";
  const currentSessionToken = session?.token ?? null;
  const nextName = nameValue.trim();
  const nextEmail = emailValue.trim();
  const hasGoogleOAuth = accountSettingsContext?.hasGoogleOAuth ?? false;
  const hasEmailPassword = accountSettingsContext?.hasEmailPassword ?? false;
  const isGoogleOAuthUser = hasGoogleOAuth;
  const hasLoadedPasswordState = Boolean(accountSettingsContext);
  const passwordCardTitle = hasEmailPassword ? "Reset password" : "Set password";
  const passwordCardDescription = hasEmailPassword
    ? "Need to reset your password? We'll send you an email with a secure link to set a new one."
    : "Want to be able to log in with password? We'll email you a secure link with the steps to add a password to your account.";
  const passwordActionLabel = hasEmailPassword ? "Send reset link" : "Add password";
  const hasChanges = isGoogleOAuthUser
    ? nextName !== currentName
    : nextName !== currentName || nextEmail !== currentEmail;
  const deleteConfirmationMatches = deleteConfirmationValue.trim().toLowerCase() === "delete";
  const isBusy = isSubmitting || isDeletingAccount;
  const isTwoFactorEnabled = Boolean((user as TwoFactorSessionUser | null)?.twoFactorEnabled);
  const requiresPasswordBeforeTwoFactor = !hasEmailPassword;
  const isTwoFactorSetupPending = Boolean(twoFactorSetup && !isTwoFactorEnabled);
  const twoFactorSecret = getTotpSecret(twoFactorSetup?.totpUri ?? null);

  useEffect(() => {
    setNameValue(currentName);
    setEmailValue(currentEmail);
    setDeleteConfirmationValue("");
    setIsDeleteModalOpen(false);
    setStatus(null);
  }, [currentEmail, currentName, user?.id]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      setSessions([]);
      setSessionsStatus(null);
      setIsSessionsLoading(false);
      setRevokingSessionToken(null);
      setIsRevokingOtherSessions(false);
      return;
    }

    let isCancelled = false;

    async function loadSessionsList() {
      try {
        setIsSessionsLoading(true);
        const result = await listSessions();

        if (result.error) {
          throw new Error(result.error.message ?? "We couldn't load your active sessions.");
        }

        if (!isCancelled) {
          setSessions(result.data ?? []);
        }
      } catch (error) {
        if (!isCancelled) {
          setSessions([]);
          setSessionsStatus({
            tone: "error",
            message: getErrorMessage(error, "We couldn't load your active sessions."),
          });
        }
      } finally {
        if (!isCancelled) {
          setIsSessionsLoading(false);
        }
      }
    }

    void loadSessionsList();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    setTwoFactorPasswordValue("");
    setTwoFactorVerificationCode("");
    setTwoFactorStatus(null);
    setTwoFactorSetup(null);
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      setAccountSettingsContext(null);
      setIsAccountSettingsContextLoading(false);
      return;
    }

    let isCancelled = false;

    async function loadAccountSettingsContext() {
      try {
        setIsAccountSettingsContextLoading(true);
        const response = await fetch("/api/auth/account-settings-context", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load account settings context.");
        }

        const data = (await response.json()) as {
          context: AccountSettingsContext | null;
        };

        if (!isCancelled) {
          setAccountSettingsContext(data.context);
        }
      } catch {
        if (!isCancelled) {
          setAccountSettingsContext(null);
        }
      } finally {
        if (!isCancelled) {
          setIsAccountSettingsContextLoading(false);
        }
      }
    }

    void loadAccountSettingsContext();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id]);

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

  function handleDeleteModalDismiss() {
    if (isDeletingAccount) {
      return;
    }

    setIsDeleteModalOpen(false);
    setDeleteConfirmationValue("");
  }

  function handleResetForm() {
    setNameValue(currentName);
    setEmailValue(currentEmail);
    setStatus(null);
  }

  async function handleSetPassword() {
    if (!user?.email) {
      setStatus({
        tone: "error",
        message: "We couldn't find an email address for this account.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/sign-in/reset-password?mode=set-password`
        : "/sign-in/reset-password?mode=set-password";

    try {
      const result = await requestPasswordReset({
        email: user.email,
        redirectTo,
      });

      if (result.error) {
        setStatus({
          tone: "error",
          message: result.error.message ?? "We couldn't send your password setup email.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: `We sent a secure link to ${user.email} so you can add a password to this account.`,
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't send your password setup email."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestPasswordReset() {
    if (!user?.email) {
      setStatus({
        tone: "error",
        message: "We couldn't find an email address for this account.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/sign-in/reset-password`
        : "/sign-in/reset-password";

    try {
      const result = await requestPasswordReset({
        email: user.email,
        redirectTo,
      });

      if (result.error) {
        setStatus({
          tone: "error",
          message: result.error.message ?? "We couldn't send your password reset email.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: `We sent a password reset link to ${user.email}. Check your inbox to choose a new password.`,
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't send your password reset email."),
      });
    } finally {
      setIsSubmitting(false);
    }
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

    if (!isGoogleOAuthUser && !nextEmail) {
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

    if (!isGoogleOAuthUser && nextEmail !== currentEmail) {
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
      message: isGoogleOAuthUser
        ? "Your profile details were updated."
        : "Your account settings were updated.",
    });
  }

  async function handleDeleteAccount() {
    if (!user) {
      return;
    }

    if (!deleteConfirmationMatches) {
      setStatus({
        tone: "error",
        message: 'Type "delete" to confirm account deletion.',
      });
      return;
    }

    setIsDeletingAccount(true);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmation: deleteConfirmationValue }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; ok?: boolean }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "We couldn't delete your account.");
      }

      onAfterSignOut?.();
      setIsDeleteModalOpen(false);
      setDeleteConfirmationValue("");
      await refetch();
      if (typeof window !== "undefined") {
        window.location.assign("/");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't delete your account."),
      });
    } finally {
      setIsDeletingAccount(false);
    }
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

  function renderSessionsStatus() {
    if (!sessionsStatus) {
      return null;
    }

    return (
      <div
        className={[
          styles.status,
          sessionsStatus.tone === "error" ? styles.statusError : styles.statusSuccess,
        ]
          .filter(Boolean)
          .join(" ")}
        style={typographyStyles.p2}
      >
        {sessionsStatus.message}
      </div>
    );
  }

  async function refreshSessions(options?: { successMessage?: string }) {
    try {
      const result = await listSessions();
      if (result.error) {
        throw new Error(result.error.message ?? "We couldn't refresh your sessions.");
      }

      setSessions(result.data ?? []);
      if (options?.successMessage) {
        setSessionsStatus({ tone: "success", message: options.successMessage });
      }
    } catch (error) {
      setSessionsStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't refresh your sessions."),
      });
    }
  }

  async function handleRevokeSession(sessionToken: string) {
    setRevokingSessionToken(sessionToken);
    setSessionsStatus(null);

    try {
      const result = await revokeSession({ token: sessionToken });
      if (result.error) {
        throw new Error(result.error.message ?? "We couldn't sign out that device.");
      }

      await refreshSessions({ successMessage: "That device has been signed out." });
    } catch (error) {
      setSessionsStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't sign out that device."),
      });
    } finally {
      setRevokingSessionToken(null);
    }
  }

  async function handleRevokeOtherSessions() {
    setIsRevokingOtherSessions(true);
    setSessionsStatus(null);

    try {
      const result = await revokeOtherSessions();
      if (result.error) {
        throw new Error(result.error.message ?? "We couldn't sign out your other devices.");
      }

      await refreshSessions({
        successMessage: "Your other devices have been signed out.",
      });
    } catch (error) {
      setSessionsStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't sign out your other devices."),
      });
    } finally {
      setIsRevokingOtherSessions(false);
    }
  }

  async function handleEnableTwoFactor() {
    if (!twoFactorPasswordValue.trim()) {
      setTwoFactorStatus({
        tone: "error",
        message: "Enter your current password to start two-factor setup.",
      });
      return;
    }

    setIsTwoFactorSubmitting(true);
    setTwoFactorStatus(null);

    try {
      const result = await callAuthEndpoint<TwoFactorEnableResponse>("two-factor/enable", {
        password: twoFactorPasswordValue,
      });

      setTwoFactorSetup({
        backupCodes: result.backupCodes ?? [],
        totpUri: result.totpURI ?? null,
      });
      setTwoFactorPasswordValue("");
      setTwoFactorVerificationCode("");
      setTwoFactorStatus({
        tone: "success",
        message:
          "Two-factor setup started. Save your backup codes, then enter the 6-digit code from your authenticator app to finish.",
      });
    } catch (error) {
      setTwoFactorStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't start two-factor setup."),
      });
    } finally {
      setIsTwoFactorSubmitting(false);
    }
  }

  async function handleVerifyTwoFactor() {
    if (!twoFactorVerificationCode.trim()) {
      setTwoFactorStatus({
        tone: "error",
        message: "Enter the 6-digit code from your authenticator app.",
      });
      return;
    }

    setIsTwoFactorSubmitting(true);
    setTwoFactorStatus(null);

    try {
      await callAuthEndpoint("two-factor/verify-totp", {
        code: twoFactorVerificationCode.trim(),
      });

      setTwoFactorSetup(null);
      setTwoFactorPasswordValue("");
      setTwoFactorVerificationCode("");
      await refetch();
      router.refresh();
      setTwoFactorStatus({
        tone: "success",
        message: "Two-factor authentication is now enabled for your account.",
      });
    } catch (error) {
      setTwoFactorStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't verify that code."),
      });
    } finally {
      setIsTwoFactorSubmitting(false);
    }
  }

  async function handleDisableTwoFactor() {
    if (!twoFactorPasswordValue.trim()) {
      setTwoFactorStatus({
        tone: "error",
        message: "Enter your current password to turn off two-factor authentication.",
      });
      return;
    }

    setIsTwoFactorSubmitting(true);
    setTwoFactorStatus(null);

    try {
      await callAuthEndpoint("two-factor/disable", {
        password: twoFactorPasswordValue,
      });

      setTwoFactorSetup(null);
      setTwoFactorPasswordValue("");
      setTwoFactorVerificationCode("");
      await refetch();
      router.refresh();
      setTwoFactorStatus({
        tone: "success",
        message: "Two-factor authentication has been turned off.",
      });
    } catch (error) {
      setTwoFactorStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't disable two-factor authentication."),
      });
    } finally {
      setIsTwoFactorSubmitting(false);
    }
  }

  async function handleCopyBackupCodes() {
    if (!twoFactorSetup?.backupCodes.length || typeof navigator === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(twoFactorSetup.backupCodes.join("\n"));
      setTwoFactorStatus({
        tone: "success",
        message: "Backup codes copied. Store them somewhere safe before you close this page.",
      });
    } catch {
      setTwoFactorStatus({
        tone: "error",
        message: "We couldn't copy your backup codes. Please save them manually.",
      });
    }
  }

  const sortedSessions = [...sessions].sort((left, right) => {
    const leftIsCurrent = left.token === currentSessionToken;
    const rightIsCurrent = right.token === currentSessionToken;

    if (leftIsCurrent !== rightIsCurrent) {
      return leftIsCurrent ? -1 : 1;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
  const otherSessions = sortedSessions.filter(
    (sessionEntry) => sessionEntry.token !== currentSessionToken,
  );
  const pendingTwoFactorSetup = isTwoFactorSetupPending ? twoFactorSetup : null;

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
                {/* <span className={styles.authMethodBadge} style={typographyStyles.s}>
                  {accountSettingsContext?.authMethodLabel ??
                    (isAccountSettingsContextLoading ? "Checking sign-in method..." : "Account")}
                </span> */}
              </div>
            </div>
          </Panel>

          <Panel
            className={styles.mainPanel}
            // title={isGoogleOAuthUser ? "Google account profile" : "Account settings"}
            title={"Account settings"}

            // description={
            //   accountSettingsContext?.authMethodHint ??
            //   "Update the account details used to identify you in the app."
            // }
          >
            <form className={styles.form} autoComplete="off" onSubmit={handleAccountUpdate}>
              <input
                type="text"
                name="account-settings-decoy-username"
                autoComplete="username"
                tabIndex={-1}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
              <input
                type="password"
                name="account-settings-decoy-password"
                autoComplete="current-password"
                tabIndex={-1}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
              {renderStatus()}
              <Field
                label="Name"
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
                // hint={
                //   isGoogleOAuthUser
                //     ? "This app reads your sign-in email from Google, so it stays read-only here."
                //     : "Changing this sends a confirmation email before the new address becomes active."
                // }
              >
                <FieldInput
                  type="email"
                  autoComplete="email"
                  value={emailValue}
                  onChange={(event) => setEmailValue(event.currentTarget.value)}
                  placeholder="you@example.com"
                  readOnly={isGoogleOAuthUser}
                  disabled={isGoogleOAuthUser}
                  required
                />
              </Field>
              <div className={styles.buttonRow}>
                {/* {hasChanges ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleResetForm}
                    disabled={isSubmitting}
                  >
                    Reset
                  </Button>
                ) : null} */}
                <Button type="submit" variant="primary" disabled={isBusy || !hasChanges}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Panel>

          <Panel
            className={styles.mainPanel}
            title={passwordCardTitle}
          >
            <p style={panelMutedTextStyle}>
              {hasLoadedPasswordState
                ? passwordCardDescription
                : "Checking how this account signs in so we can show the right password option."}
            </p>
            <div className={styles.buttonRow}>
              <Button
                type="button"
                variant="primary"
                onClick={() =>
                  void (hasEmailPassword ? handleRequestPasswordReset() : handleSetPassword())
                }
                disabled={isBusy || isAccountSettingsContextLoading || !hasLoadedPasswordState}
              >
                {isSubmitting ? "Sending..." : passwordActionLabel}
              </Button>
              {/* <Button type="button" variant="secondary" onClick={() => void handleSignOut()}>
                Sign out
              </Button> */}
            </div>
          </Panel>

          {/* <Panel className={styles.mainPanel} title="Two-factor authentication">
            <div className={styles.form}>
              {twoFactorStatus ? (
                <div
                  className={[
                    styles.status,
                    twoFactorStatus.tone === "error"
                      ? styles.statusError
                      : styles.statusSuccess,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={typographyStyles.p2}
                >
                  {twoFactorStatus.message}
                </div>
              ) : null}

              <div className={styles.twoFactorHeader}>
                <strong style={typographyStyles.p2}>
                  {isTwoFactorEnabled ? "2FA is on" : "2FA is off"}
                </strong>
                <span className={styles.sessionCurrentValue} style={typographyStyles.s}>
                  {isTwoFactorEnabled ? "Protected with authenticator codes" : "Recommended"}
                </span>
              </div>

              <p style={panelMutedTextStyle}>
                Add an authenticator app code requirement when you sign in. You&apos;ll also get
                backup codes you can store offline.
              </p>

              {requiresPasswordBeforeTwoFactor ? (
                <>
                  <p style={panelMutedTextStyle}>
                    This account needs a password before 2FA can be enabled. Add a password first,
                    then come back here to finish setup.
                  </p>
                  <div className={styles.buttonRow}>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => void handleSetPassword()}
                      disabled={isBusy || isTwoFactorSubmitting || isAccountSettingsContextLoading}
                    >
                      {isSubmitting ? "Sending..." : "Add password first"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Field
                    label={
                      isTwoFactorEnabled
                        ? "Current password"
                        : "Current password to start setup"
                    }
                  >
                    <FieldInput
                      type="password"
                      autoComplete="current-password"
                      value={twoFactorPasswordValue}
                      onChange={(event) => setTwoFactorPasswordValue(event.currentTarget.value)}
                      placeholder="Enter your password"
                      disabled={isTwoFactorSubmitting}
                    />
                  </Field>

                  {pendingTwoFactorSetup ? (
                    <div className={styles.twoFactorSetupCard}>
                      <div className={styles.twoFactorSetupSection}>
                        <strong style={typographyStyles.p2}>1. Add this secret to your authenticator app</strong>
                        <p style={panelMutedTextStyle}>
                          Most authenticator apps let you add an account manually with a setup key.
                        </p>
                        <div className={styles.codeValue} style={typographyStyles.p2}>
                          {twoFactorSecret ?? "Setup key unavailable. Use the raw setup URI below."}
                        </div>
                        {pendingTwoFactorSetup.totpUri ? (
                          <details className={styles.twoFactorDetails}>
                            <summary style={typographyStyles.s}>Show raw setup URI</summary>
                            <div className={styles.codeValue} style={typographyStyles.s}>
                              {pendingTwoFactorSetup.totpUri}
                            </div>
                          </details>
                        ) : null}
                      </div>

                      {pendingTwoFactorSetup.backupCodes.length > 0 ? (
                        <div className={styles.twoFactorSetupSection}>
                          <div className={styles.twoFactorSectionHeader}>
                            <strong style={typographyStyles.p2}>2. Save your backup codes</strong>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => void handleCopyBackupCodes()}
                              disabled={isTwoFactorSubmitting}
                            >
                              Copy codes
                            </Button>
                          </div>
                          <div className={styles.backupCodesGrid}>
                            {pendingTwoFactorSetup.backupCodes.map((code) => (
                              <div
                                key={code}
                                className={styles.backupCode}
                                style={typographyStyles.p2}
                              >
                                {code}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <Field label="3. Enter the 6-digit code from your authenticator app">
                        <FieldInput
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={twoFactorVerificationCode}
                          onChange={(event) =>
                            setTwoFactorVerificationCode(
                              event.currentTarget.value.replace(/[^\d]/g, "").slice(0, 6),
                            )
                          }
                          placeholder="123456"
                          disabled={isTwoFactorSubmitting}
                        />
                      </Field>
                    </div>
                  ) : null}

                  <div className={styles.buttonRow}>
                    {isTwoFactorEnabled ? (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => void handleDisableTwoFactor()}
                        disabled={isTwoFactorSubmitting}
                      >
                        {isTwoFactorSubmitting ? "Turning off..." : "Turn off 2FA"}
                      </Button>
                    ) : isTwoFactorSetupPending ? (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => void handleVerifyTwoFactor()}
                        disabled={isTwoFactorSubmitting || twoFactorVerificationCode.length !== 6}
                      >
                        {isTwoFactorSubmitting ? "Verifying..." : "Verify and enable 2FA"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => void handleEnableTwoFactor()}
                        disabled={isTwoFactorSubmitting || !twoFactorPasswordValue.trim()}
                      >
                        {isTwoFactorSubmitting ? "Starting..." : "Turn on 2FA"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </Panel> */}

          <Panel className={styles.mainPanel} title="Sessions">
            <div className={styles.form}>
              {renderSessionsStatus()}
              <p style={panelMutedTextStyle}>
                Review the devices that are signed into your account and remove anything you
                don&apos;t recognize.
              </p>
              {isSessionsLoading ? (
                <p style={panelMutedTextStyle}>Loading your active sessions...</p>
              ) : sortedSessions.length > 0 ? (
                <div className={styles.sessionTableWrap}>
                  <table className={styles.sessionTable}>
                    <thead>
                      <tr>
                        <th scope="col" style={typographyStyles.s}>
                          Device
                        </th>
                        <th scope="col" style={typographyStyles.s}>
                          Last active
                        </th>
                        <th scope="col" style={typographyStyles.s}>
                          Signed in
                        </th>
                        <th scope="col" style={typographyStyles.s}>
                          Expires
                        </th>
                        <th scope="col" style={typographyStyles.s}>
                          IP address
                        </th>
                        <th scope="col" style={typographyStyles.s}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSessions.map((sessionEntry) => {
                        const isCurrentSession = sessionEntry.token === currentSessionToken;
                        const isRevokingThisSession = revokingSessionToken === sessionEntry.token;
                        const lastActiveRelativeLabel = getRelativeSessionDateLabel(
                          sessionEntry.updatedAt,
                        );

                        return (
                          <tr key={sessionEntry.id}>
                            <td data-label="Device">
                              <div className={styles.sessionIdentity}>
                                <div className={styles.sessionTitleRow}>
                                  <strong
                                    className={styles.sessionTitle}
                                    style={typographyStyles.p2}
                                  >
                                    {getSessionDeviceLabel(
                                      sessionEntry.userAgent,
                                      isCurrentSession,
                                    )}
                                  </strong>
                                  {/* {isCurrentSession ? (
                                    <span
                                      className={styles.sessionBadge}
                                      style={typographyStyles.s}
                                    >
                                      Current
                                    </span>
                                  ) : null} */}
                                </div>
                                <p className={styles.sessionSubtitle} style={typographyStyles.s}>
                                  {lastActiveRelativeLabel
                                    ? `Seen ${lastActiveRelativeLabel}`
                                    : "Recent session activity"}
                                </p>
                              </div>
                            </td>
                            <td data-label="Last active" style={typographyStyles.p2}>
                              {formatSessionDate(sessionEntry.updatedAt)}
                            </td>
                            <td data-label="Signed in" style={typographyStyles.p2}>
                              {formatSessionDate(sessionEntry.createdAt)}
                            </td>
                            <td data-label="Expires" style={typographyStyles.p2}>
                              {formatSessionDate(sessionEntry.expiresAt)}
                            </td>
                            <td data-label="IP address" style={typographyStyles.p2}>
                              {getSessionLocationLabel(sessionEntry.ipAddress)}
                            </td>
                            <td data-label="Action" className={styles.sessionActionCell}>
                              {isCurrentSession ? (
                                <span
                                  className={styles.sessionCurrentValue}
                                  style={typographyStyles.s}
                                >
                                  This device
                                </span>
                              ) : (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => void handleRevokeSession(sessionEntry.token)}
                                  disabled={
                                    isBusy || isRevokingOtherSessions || isRevokingThisSession
                                  }
                                >
                                  {isRevokingThisSession ? "Signing out..." : "Sign out"}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={panelMutedTextStyle}>No active sessions were found for this account.</p>
              )}
              <div className={styles.buttonRow}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void refreshSessions()}
                  disabled={isBusy || isSessionsLoading || isRevokingOtherSessions}
                >
                  Refresh
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => void handleRevokeOtherSessions()}
                  disabled={
                    isBusy ||
                    isSessionsLoading ||
                    isRevokingOtherSessions ||
                    otherSessions.length === 0
                  }
                >
                  {isRevokingOtherSessions ? "Signing out..." : "Sign out other devices"}
                </Button>
              </div>
            </div>
          </Panel>

          <Panel className={styles.mainPanel} title="Delete account">
            <p style={panelMutedTextStyle}>
              Permanently delete your profile, saved designs, and account history. This can&apos;t
              be undone.
            </p>
            <div className={styles.buttonRow}>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setStatus(null);
                  setIsDeleteModalOpen(true);
                }}
                disabled={isBusy}
              >
                Delete account
              </Button>
            </div>
          </Panel>

          <Modal
            isOpen={isDeleteModalOpen}
            title="Delete your account?"
            description={
              <div className={styles.form}>
                <p style={panelMutedTextStyle}>
                  This permanently removes your profile and saved account data. Type{" "}
                  <strong>delete</strong> to confirm.
                </p>
                <Field label='Type "delete" to confirm'>
                  <FieldInput
                    type="text"
                    value={deleteConfirmationValue}
                    onChange={(event) => setDeleteConfirmationValue(event.currentTarget.value)}
                    placeholder="delete"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={isDeletingAccount}
                  />
                </Field>
              </div>
            }
            dismissLabel="Cancel"
            confirmLabel={isDeletingAccount ? "Deleting..." : "Delete account"}
            confirmVariant="destructive"
            tone="fail"
            onDismiss={handleDeleteModalDismiss}
            onConfirm={() => void handleDeleteAccount()}
            confirmDisabled={!deleteConfirmationMatches || isDeletingAccount}
            dismissDisabled={isDeletingAccount}
            closeOnBackdropClick
            closeOnEscape
            showCloseButton
          />
        </>
      )}
    </div>
  );
}
