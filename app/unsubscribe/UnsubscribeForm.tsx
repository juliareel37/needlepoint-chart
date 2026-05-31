"use client";

import { FormEvent, useState } from "react";
import styles from "./unsubscribe.module.css";

type SubmissionState = "idle" | "submitting" | "success" | "error";

type UnsubscribeFormProps = {
  initialEmail: string;
};

export default function UnsubscribeForm({ initialEmail }: UnsubscribeFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage(null);

    const response = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);

    if (!response) {
      setState("error");
      setMessage("We could not process that request. Please try again.");
      return;
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
      setState("error");
      setMessage(
        typeof body?.error === "string"
          ? body.error
          : "We could not process that request. Please try again.",
      );
      return;
    }

    setState("success");
    setMessage(
      "You have been unsubscribed from promotional emails. Account and service emails may still be sent when needed.",
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="unsubscribe-email">
        Email address
      </label>
      <div className={styles.formRow}>
        <input
          id="unsubscribe-email"
          className={styles.input}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state !== "submitting") {
              setState("idle");
              setMessage(null);
            }
          }}
          required
        />
        <button
          className={styles.button}
          type="submit"
          disabled={state === "submitting"}
        >
          {state === "submitting" ? "Unsubscribing..." : "Unsubscribe"}
        </button>
      </div>
      {message ? (
        <p
          className={state === "success" ? styles.successMessage : styles.errorMessage}
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
