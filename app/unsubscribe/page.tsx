import type { Metadata } from "next";
import Link from "next/link";
import UnsubscribeForm from "./UnsubscribeForm";
import styles from "./unsubscribe.module.css";

export const metadata: Metadata = {
  title: "Unsubscribe from Wippa Promotions",
  description: "Opt out of Wippa promotional emails.",
};

function getInitialEmail(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialEmail = getInitialEmail(resolvedSearchParams?.email);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          Back to Wippa
        </Link>

        <section className={styles.panel} aria-labelledby="unsubscribe-title">
          <p className={styles.eyebrow}>Email preferences</p>
          <h1 className={styles.title} id="unsubscribe-title">
            Unsubscribe from promotional emails
          </h1>
          <p className={styles.copy}>
            Enter the email address connected to your Wippa profile and we will turn off
            promotional messages for that account.
          </p>

          <UnsubscribeForm initialEmail={initialEmail} />
        </section>
      </div>
    </main>
  );
}
