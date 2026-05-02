"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { typographyStyles } from "@/app/design-system/typography";
import { IS_DEV_APP_MODE } from "@/lib/editor-v2/config";
import {
  Button,
  CheckboxField,
  Field,
  FieldInput,
  Panel,
  panelMutedTextStyle,
} from "@/components/design-system";
import { useAuthActions, useAuthSession } from "@/lib/auth/client";
import styles from "./AuthPage.module.css";

type ViewName =
  | "callback"
  | "forgot-password"
  | "reset-password"
  | "sign-in"
  | "sign-out"
  | "sign-up";

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

function getTitles(pathname: string) {
  switch (pathname as ViewName) {
    case "sign-up":
      return {
        title: "Create your account",
        description: "Welcome! Please fill in some details to get started.",
      };
    case "forgot-password":
      return {
        title: "Reset your password",
        description: "We'll send you a recovery link so you can choose a new password.",
      };
    case "reset-password":
      return {
        title: "Choose a new password",
        description: "Set a fresh password for your account and head back into the app.",
      };
    case "callback":
      return {
        title: "Finishing sign-in",
        description: "Hang tight while we complete the redirect and restore your session.",
      };
    case "sign-out":
      return {
        title: "Signing you out",
        description: "We're clearing your session now.",
      };
    default:
      return {
        title: "Sign in to Wippa",
        description: "Welcome back! Please sign in to continue.",
      };
  }
}

export function AuthSignInPageContent({
  pathname,
  redirectUrl,
}: {
  pathname: string;
  redirectUrl: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded, isSignedIn } = useAuthSession();
  const {
    requestPasswordReset,
    resetPassword,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    signUpWithEmail,
  } = useAuthActions();
  const [status, setStatus] = useState<StatusState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  const token = searchParams.get("token") ?? undefined;
  const oauthError = searchParams.get("error") ?? searchParams.get("error_description");
  const titles = useMemo(() => getTitles(pathname), [pathname]);

  useEffect(() => {
    if (oauthError) {
      let message = oauthError;
      try {
        message = decodeURIComponent(oauthError);
      } catch {}
      setStatus({
        tone: "error",
        message,
      });
    }
  }, [oauthError]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (pathname === "sign-out") {
      void (async () => {
        setIsSubmitting(true);
        const result = await signOut();
        setIsSubmitting(false);
        if (result.error) {
          setStatus({
            tone: "error",
            message: result.error.message ?? "We couldn't sign you out. Please try again.",
          });
          return;
        }

        router.replace("/sign-in");
        router.refresh();
      })();
      return;
    }

    if (isSignedIn && pathname !== "forgot-password" && pathname !== "reset-password") {
      router.replace(redirectUrl);
      router.refresh();
    }
  }, [isLoaded, isSignedIn, pathname, redirectUrl, router, signOut]);

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const result = await signInWithEmail({
        email,
        password,
        callbackURL: redirectUrl,
        rememberMe,
      });

      if (result.error) {
        setStatus({
          tone: "error",
          message: result.error.message ?? "We couldn't sign you in with that email and password.",
        });
        return;
      }

      router.replace(result.data.url ?? redirectUrl);
      router.refresh();
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't sign you in with that email and password."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const result = await signUpWithEmail({
        name,
        email,
        password,
        callbackURL: redirectUrl,
      });

      if (result.error) {
        setStatus({
          tone: "error",
          message: result.error.message ?? "We couldn't create your account just yet.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: "Your account is ready. Redirecting you into Wippa now.",
      });
      router.replace(redirectUrl);
      router.refresh();
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't create your account just yet."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsSubmitting(true);
    setStatus(null);

    const callbackURL =
      typeof window !== "undefined"
        ? `${window.location.origin}${redirectUrl}`
        : redirectUrl;
    const errorCallbackURL =
      typeof window !== "undefined"
        ? `${window.location.origin}/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
        : `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;

    try {
      const result = await signInWithGoogle({
        provider: "google",
        callbackURL,
        newUserCallbackURL: callbackURL,
        errorCallbackURL,
      });

      if (result.error) {
        setStatus({
          tone: "error",
          message: result.error.message ?? "Google sign-in could not start. Please try again.",
        });
        return;
      }

      if (result.data.url) {
        window.location.assign(result.data.url);
        return;
      }

      router.replace(redirectUrl);
      router.refresh();
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error, "Google sign-in could not start. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/sign-in/reset-password`
        : "/sign-in/reset-password";

    try {
      const result = await requestPasswordReset({
        email,
        redirectTo,
      });

      if (result.error) {
        setStatus({
          tone: "error",
          message: result.error.message ?? "We couldn't send that reset email.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: "Password reset email sent. Check your inbox for the recovery link.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error, "We couldn't send that reset email."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const result = await resetPassword({
        newPassword: resetPasswordValue,
        token,
      });

      if (result.error) {
        setStatus({
          tone: "error",
          message: result.error.message ?? "That reset link is invalid or expired.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: "Password updated. You can sign in with your new password now.",
      });
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
      router.refresh();
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error, "That reset link is invalid or expired."),
      });
    } finally {
      setIsSubmitting(false);
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

  function renderForm() {
    if (pathname === "forgot-password") {
      return (
        <form className={styles.form} onSubmit={handleForgotPassword}>
          <Field label="Email">
            <FieldInput
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="you@example.com"
              required
            />
          </Field>
          <Button type="submit" variant="primary" className={styles.fullWidthButton} disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
          <div className={styles.linkRow}>
            <Link href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`} className={styles.link} style={typographyStyles.p2}>
              Back to sign in
            </Link>
            <Link href={`/sign-in/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`} className={styles.link} style={typographyStyles.p2}>
              Create account instead
            </Link>
          </div>
        </form>
      );
    }

    if (pathname === "reset-password") {
      return (
        <form className={styles.form} onSubmit={handleResetPassword}>
          <Field
            label="New password"
            hint={!token ? "This reset link looks incomplete. Try requesting a fresh one." : undefined}
          >
            <FieldInput
              type="password"
              autoComplete="new-password"
              value={resetPasswordValue}
              onChange={(event) => setResetPasswordValue(event.currentTarget.value)}
              placeholder="Choose a new password"
              required
            />
          </Field>
          <Button
            type="submit"
            variant="primary"
            className={styles.fullWidthButton}
            disabled={isSubmitting || !token}
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </Button>
          <div className={styles.linkRow}>
            <Link href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`} className={styles.link} style={typographyStyles.p2}>
              Return to sign in
            </Link>
          </div>
        </form>
      );
    }

    if (pathname === "callback" || pathname === "sign-out") {
      return (
        <div className={styles.form}>
          <p style={panelMutedTextStyle}>
            {pathname === "callback"
              ? user
                ? "Your session is ready. Redirecting you now."
                : "Waiting for the auth callback to finish."
              : "Clearing your current session."}
          </p>
          <div className={styles.linkRow}>
            <Link href="/" className={styles.link} style={typographyStyles.p2}>
              Go back home
            </Link>
          </div>
        </div>
      );
    }

    const isSignUp = pathname === "sign-up";

    return (
      <form className={styles.form} onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn}>


        <Button
          type="button"
          variant="secondary"
          className={styles.fullWidthButton}
          onClick={() => void handleGoogleSignIn()}
          disabled={isSubmitting}
        >
          <img src="/google_logo.png" alt="Google" className={styles.googleIcon} />
          Continue with Google
        </Button>

        
        <div className={styles.divider} style={typographyStyles.s}>
          <span>or</span>
        </div>

        {isSignUp ? (
          <Field label="Name">
            <FieldInput
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              placeholder="Your name"
              required
            />
          </Field>
        ) : null}
        <Field label="Email">
          <FieldInput
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="you@example.com"
            required
          />
        </Field>
        <Field label="Password">
          <FieldInput
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            placeholder={isSignUp ? "Create a password" : "Enter your password"}
            required
          />
        </Field>

        {!isSignUp ? (
          <div className={styles.metaRow}>
            <CheckboxField
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.currentTarget.checked)}
              className={styles.rememberRow}
            >
              Remember me
            </CheckboxField>
            <Link
              href={`/sign-in/forgot-password?redirect_url=${encodeURIComponent(redirectUrl)}`}
              className={styles.link}
              style={typographyStyles.p2}
            >
              Forgot password?
            </Link>
          </div>
        ) : null}

        <Button type="submit" variant="primary" className={styles.fullWidthButton} disabled={isSubmitting}>
          {isSubmitting ? (isSignUp ? "Creating account..." : "Signing in...") : isSignUp ? "Create account" : "Sign in"}
        </Button>



        <div className={styles.linkRow}>
          {isSignUp ? (
            <Link href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`} className={styles.link} style={typographyStyles.p2}>
              Already have an account? Sign in
            </Link>
          ) : (
            <Link href={`/sign-in/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`} className={styles.link} style={typographyStyles.p2}>
              Need an account? Create one
            </Link>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className={styles.page}>
      <div className={[styles.shell, !IS_DEV_APP_MODE ? styles.shellCompact : null].filter(Boolean).join(" ")}>
        {IS_DEV_APP_MODE ? (
          <aside className={styles.aside}>
            <Panel className={styles.heroPanel}>
              <div className={styles.header}>
                <span className={styles.eyebrow} style={typographyStyles.s}>
                  Authentication
                </span>
                <h1 className={styles.heroTitle} style={typographyStyles.h2}>
                  {titles.title}
                </h1>
                <p className={styles.heroCopy} style={typographyStyles.p1}>
                  {titles.description}
                </p>
              </div>
              <ul className={styles.featureList}>
                <li className={styles.featureItem} style={typographyStyles.p2}>
                  <span className={styles.featureDot} aria-hidden="true" />
                  Your auth entry points now inherit the same tokens and dark mode rules as the rest of the app.
                </li>
                <li className={styles.featureItem} style={typographyStyles.p2}>
                  <span className={styles.featureDot} aria-hidden="true" />
                  Saved designs and editor ownership still map to your existing app user IDs.
                </li>
                <li className={styles.featureItem} style={typographyStyles.p2}>
                  <span className={styles.featureDot} aria-hidden="true" />
                  Google OAuth and email/password are both powered by Neon, just without the global Neon theme layer.
                </li>
              </ul>
            </Panel>
            <Panel
              className={styles.supportPanel}
              title="Need a specific route?"
              description="You can still move directly between sign in, sign up, and password recovery without leaving this flow."
            >
              <div className={styles.linkRow}>
                <Link href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`} className={styles.link} style={typographyStyles.p2}>
                  Sign in
                </Link>
                <Link href={`/sign-in/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`} className={styles.link} style={typographyStyles.p2}>
                  Sign up
                </Link>
                <Link href={`/sign-in/forgot-password?redirect_url=${encodeURIComponent(redirectUrl)}`} className={styles.link} style={typographyStyles.p2}>
                  Forgot password
                </Link>
              </div>
            </Panel>
          </aside>
        ) : null}

        <Panel className={styles.mainPanel}>
          <div className={styles.header}>
            <h2 className={styles.title} style={typographyStyles.h3}>
              {titles.title}
            </h2>
            <p className={styles.description} style={typographyStyles.p2}>
              {titles.description}
            </p>
          </div>
          {renderStatus()}
          {renderForm()}
        </Panel>
      </div>
    </div>
  );
}
