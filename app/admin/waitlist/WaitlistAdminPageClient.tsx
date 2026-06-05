"use client";

import { useMemo, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { Button, Notification, Panel } from "@/components/design-system";
import styles from "./page.module.css";

type WaitlistApplicationRecord = {
  id: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  experienceLevel: string | null;
  currentTools: string | null;
  freeformResponse: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  inviteToken: string | null;
  inviteUrl: string | null;
  inviteTokenExpiresAt: string | null;
  accountCreatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  surveyResponses: {
    id: string;
    experienceLevel: string;
    betaTestingInterest: boolean;
    currentTools: string;
    freeformResponse: string;
    createdAt: string;
  }[];
};

type ApprovalResult = {
  email: string;
  inviteUrl: string | null;
  inviteTokenExpiresAt: string | null;
  approvalEmail: {
    sent: boolean;
    messageId?: string | null;
    error?: string;
  } | null;
};

export function WaitlistAdminPageClient({
  applications: initialApplications,
  adminEmails,
  currentAdminEmail,
}: {
  applications: WaitlistApplicationRecord[];
  adminEmails: string[];
  currentAdminEmail: string | null;
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);

  const pendingApplications = useMemo(
    () => applications.filter((application) => application.status === "PENDING"),
    [applications],
  );
  const approvedApplications = useMemo(
    () => applications.filter((application) => application.status === "APPROVED"),
    [applications],
  );

  async function handleApprove(email: string) {
    setPendingEmail(email);
    setErrorMessage(null);
    setApprovalResult(null);

    try {
      const response = await fetch("/api/admin/waitlist/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ email }),
      });
      const body = (await response.json().catch(() => null)) as
        | {
            error?: string;
            application?: {
              email: string;
              status: "APPROVED";
              approvedAt: string | null;
              inviteToken: string | null;
              inviteUrl: string | null;
              inviteTokenExpiresAt: string | null;
            };
            approvalEmail?: {
              sent: boolean;
              messageId?: string | null;
              error?: string;
            } | null;
          }
        | null;

      if (!response.ok || !body?.application) {
        setErrorMessage(body?.error ?? "Unable to approve this waitlist application.");
        return;
      }

      setApplications((current) =>
        current.map((application) =>
          application.email === email
            ? {
                ...application,
                status: "APPROVED",
                approvedAt: body.application?.approvedAt ?? application.approvedAt,
                approvedBy: currentAdminEmail,
                inviteToken: body.application?.inviteToken ?? application.inviteToken,
                inviteUrl: body.application?.inviteUrl ?? application.inviteUrl,
                inviteTokenExpiresAt:
                  body.application?.inviteTokenExpiresAt ?? application.inviteTokenExpiresAt,
              }
            : application,
        ),
      );
      setApprovalResult({
        email: body.application.email,
        inviteUrl: body.application.inviteUrl,
        inviteTokenExpiresAt: body.application.inviteTokenExpiresAt,
        approvalEmail: body.approvalEmail ?? null,
      });
    } catch {
      setErrorMessage("Unable to approve this waitlist application.");
    } finally {
      setPendingEmail(null);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Panel
          title="Waitlist Admin"
          description="Review recent applications and generate invite links for approved users."
        >
          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <p className={styles.metaLabel} style={typographyStyles.s}>Signed in as</p>
              <p className={styles.metaValue} style={typographyStyles.p2}>{currentAdminEmail ?? "Unknown admin"}</p>
            </div>
            <div className={styles.metaCard}>
              <p className={styles.metaLabel} style={typographyStyles.s}>Admin allowlist</p>
              <p className={styles.metaValue} style={typographyStyles.p2}>
                {adminEmails.length > 0 ? adminEmails.join(", ") : "Set ADMIN_EMAILS to enable access."}
              </p>
            </div>
          </div>
        </Panel>

        {approvalResult ? (
          <Notification
            tone="success"
            title={`Approved ${approvalResult.email}`}
            description={
              approvalResult.approvalEmail?.sent
                ? `Approval email sent.${approvalResult.inviteUrl ? ` Invite URL: ${approvalResult.inviteUrl}` : ""}${approvalResult.inviteTokenExpiresAt ? ` • expires ${formatDateTime(approvalResult.inviteTokenExpiresAt)}` : ""}`
                : approvalResult.inviteUrl
                  ? `Approval saved, but the email was not sent${approvalResult.approvalEmail?.error ? `: ${approvalResult.approvalEmail.error}` : "."} Invite URL: ${approvalResult.inviteUrl}${approvalResult.inviteTokenExpiresAt ? ` • expires ${formatDateTime(approvalResult.inviteTokenExpiresAt)}` : ""}`
                  : "Approval saved, but no invite URL was returned."
            }
            onDismiss={() => setApprovalResult(null)}
            neutralSurface
          />
        ) : null}

        {errorMessage ? (
          <Notification
            tone="destructive"
            title="Approval failed"
            description={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            neutralSurface
          />
        ) : null}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} style={typographyStyles.h4}>Pending Applications</h2>
            <p className={styles.sectionMeta} style={typographyStyles.p2}>{pendingApplications.length} awaiting review</p>
          </div>
          <div className={styles.cardGrid}>
            {pendingApplications.length === 0 ? (
              <Panel title="No pending applications" description="You're all caught up for now." className={styles.emptyCard}>
                <p style={typographyStyles.p2}>New waitlist submissions will appear here automatically.</p>
              </Panel>
            ) : (
              pendingApplications.map((application) => (
                <article key={application.id} className={styles.applicationCard}>
                  {(() => {
                    const surveyResponse = application.surveyResponses[0];
                    const experienceLevel =
                      surveyResponse?.experienceLevel ?? application.experienceLevel;
                    const currentTools = surveyResponse?.currentTools ?? application.currentTools;
                    const freeformResponse =
                      surveyResponse?.freeformResponse ?? application.freeformResponse;

                    return (
                      <>
                  <div className={styles.applicationHeader}>
                    <div>
                      <h3 className={styles.applicationTitle} style={typographyStyles.h5}>{application.email}</h3>
                      <p className={styles.applicationMeta} style={typographyStyles.s}>
                        Applied {formatDateTime(application.createdAt)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={pendingEmail === application.email}
                      onClick={() => void handleApprove(application.email)}
                    >
                      {pendingEmail === application.email ? "Approving..." : "Approve"}
                    </Button>
                  </div>
                  <div className={styles.answerBlock}>
                    <p className={styles.answerLabel} style={typographyStyles.s}>Do they create their own patterns?</p>
                    <p className={styles.answerValue} style={typographyStyles.p2}>{experienceLevel ?? "No survey yet"}</p>
                  </div>
                  <div className={styles.answerBlock}>
                    <p className={styles.answerLabel} style={typographyStyles.s}>Interested in beta testing or feedback?</p>
                    <p className={styles.answerValue} style={typographyStyles.p2}>
                      {surveyResponse ? (surveyResponse.betaTestingInterest ? "Yes" : "No") : "No survey yet"}
                    </p>
                  </div>
                  <div className={styles.answerBlock}>
                    <p className={styles.answerLabel} style={typographyStyles.s}>Current tools</p>
                    <p className={styles.answerValue} style={typographyStyles.p2}>{currentTools ?? "No survey yet"}</p>
                  </div>
                  <div className={styles.answerBlock}>
                    <p className={styles.answerLabel} style={typographyStyles.s}>What they want to use WIP for</p>
                    <p className={styles.answerValue} style={typographyStyles.p2}>{freeformResponse ?? "No survey yet"}</p>
                  </div>
                  {surveyResponse ? (
                    <p className={styles.applicationMeta} style={typographyStyles.s}>
                      Survey submitted {formatDateTime(surveyResponse.createdAt)}
                    </p>
                  ) : null}
                      </>
                    );
                  })()}
                </article>
              ))
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} style={typographyStyles.h4}>Recently Approved</h2>
            <p className={styles.sectionMeta} style={typographyStyles.p2}>{approvedApplications.length} approved</p>
          </div>
          <div className={styles.cardGrid}>
            {approvedApplications.slice(0, 12).map((application) => (
              <article key={application.id} className={styles.applicationCard}>
                <div className={styles.applicationHeader}>
                  <div>
                    <h3 className={styles.applicationTitle} style={typographyStyles.h5}>{application.email}</h3>
                    <p className={styles.applicationMeta} style={typographyStyles.s}>
                      Approved {application.approvedAt ? formatDateTime(application.approvedAt) : "recently"}
                    </p>
                  </div>
                  <span className={styles.statusPill} style={typographyStyles.s}>
                    {application.accountCreatedAt ? "Account created" : "Invite sent"}
                  </span>
                </div>
                <div className={styles.answerBlock}>
                  <p className={styles.answerLabel} style={typographyStyles.s}>Approved by</p>
                  <p className={styles.answerValue} style={typographyStyles.p2}>{application.approvedBy ?? "Unknown"}</p>
                </div>
                {application.inviteUrl ? (
                  <div className={styles.answerBlock}>
                    <p className={styles.answerLabel} style={typographyStyles.s}>Invite URL</p>
                    <p className={styles.answerValueBreak} style={typographyStyles.p2}>{application.inviteUrl}</p>
                  </div>
                ) : null}
                {application.inviteToken ? (
                  <div className={styles.answerBlock}>
                    <p className={styles.answerLabel} style={typographyStyles.s}>Invite token</p>
                    <p className={styles.answerValueBreak} style={typographyStyles.p2}>{application.inviteToken}</p>
                  </div>
                ) : null}
                {application.inviteTokenExpiresAt ? (
                  <div className={styles.answerBlock}>
                    <p className={styles.answerLabel} style={typographyStyles.s}>Invite expires</p>
                    <p className={styles.answerValue} style={typographyStyles.p2}>{formatDateTime(application.inviteTokenExpiresAt)}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
