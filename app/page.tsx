"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { marketingTypographyStyles, typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  ButtonIcon,
  Field,
  FieldInput,
  FieldSelect,
  Modal,
  Notification,
} from "@/components/design-system";
import { useAuthAccessState, useAuthSession } from "@/lib/auth/client";
import styles from "./page.module.css";

const heroHighlights = [
  {
    kicker: "Technical",
    title: "easy to start, easy to get right",
    body:
      "upload an image or use built-in elements to create polished designs without the learning curve.",
  },
  {
    kicker: "Material",
    title: "hundreds of pre-made components",
    body:
      "our modern and comprehensive font, frame, and icon libraries help you turn ideas into finished designs in seconds.",
  },
] as const;

const featureCards = [
  {
    index: "01",
    label: "Pre-built Library",
    title: "Design with real elements",
    body:
      "Go beyond circles and basic text with a large library of fonts, icons, and frames, so your work in progress already looks like something worth stitching.",
  },
  {
    index: "02",
    label: "Tools",
    title: "A workflow that actually makes sense",
    body:
      "Move from idea, to pattern, to refinement without clunky steps or needing to restart: your design evolves naturally as you go.",
  },
  {
    index: "03",
    label: "Export",
    title: "Clean, stitch-ready results",
    body:
      "Export print-ready charts with symbol overlays, color keys, and skein shopping list to bring your design to life.",
  },
] as const;

type WaitlistStatus =
  | { tone: "success"; title: string; description: string }
  | { tone: "destructive"; title: string; description: string }
  | null;

const experienceLevelOptions = [
  "Yes, regularly",
  "Sometimes",
  "Not yet, but I want to start",
] as const;

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuthSession();
  const { accessState, hasAppAccess, isLoaded: isAccessStateLoaded } = useAuthAccessState();
  const showResumeCta = isLoaded && isAccessStateLoaded && hasAppAccess;
  const showPendingApprovalNotice = searchParams.get("notice") === "pending-approval";
  const showApprovalRequiredNotice = searchParams.get("notice") === "approval-required";
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>(null);
  const [email, setEmail] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<(typeof experienceLevelOptions)[number]>(
    experienceLevelOptions[0],
  );
  const [currentTools, setCurrentTools] = useState("");
  const [freeformResponse, setFreeformResponse] = useState("");
  const waitlistIntroCopy = showResumeCta
    ? "Your account is active. Head back into your library to keep designing."
    : accessState === "pending_approval"
      ? "Your beta application has been received. We’ll email you as soon as your access is approved."
    : "Beta access is rolling out gradually. Join the waitlist and tell us a little about how you design today.";
  const waitlistActionLabel = showResumeCta ? "View my designs" : "Join the waitlist";
  const modalDescription = useMemo(
    () =>
      showResumeCta
        ? "You already have access to Wippa. Open your library to keep working."
        : "Share a few details and we’ll reach out once your beta access is approved.",
    [showResumeCta],
  );
  const editorRoute = "/editor";

  function resetWaitlistForm() {
    setExperienceLevel(experienceLevelOptions[0]);
    setCurrentTools("");
    setFreeformResponse("");
  }

  function openWaitlistModal(prefilledEmail?: string) {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }

    setWaitlistModalOpen(true);
  }

  async function handleWaitlistSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (showResumeCta) {
      router.push("/library");
      return;
    }

    setIsSubmittingWaitlist(true);
    setWaitlistStatus(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email,
          experienceLevel,
          currentTools,
          freeformResponse,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setWaitlistStatus({
          tone: "destructive",
          title: "Couldn’t join the waitlist",
          description: body?.error ?? "Please check your answers and try again.",
        });
        return;
      }

      setWaitlistStatus({
        tone: "success",
        title: "You’re on the list",
        description:
          "Thanks for sharing more about your workflow. We’ll reach out when your beta access is ready.",
      });
      setWaitlistModalOpen(false);
      resetWaitlistForm();
    } catch {
      setWaitlistStatus({
        tone: "destructive",
        title: "Couldn’t join the waitlist",
        description: "Something went wrong on our side. Please try again in a moment.",
      });
    } finally {
      setIsSubmittingWaitlist(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero} id="canvas">
          <div className={styles.heroCopy}>
            {/* <div className={styles.eyebrow} style={marketingTypographyStyles.eyebrow}>
              <span className={styles.eyebrowDot} />
              W.I.P. • Version 2.4
            </div> */}
            <h1 className={styles.heroTitle} style={marketingTypographyStyles.display}>
              {/* every <span className={styles.accentWord}>work</span> in progress,
              <br /> in one place. */}
              Designing your own 
              <span className={styles.accentWord}>  needlepoint patterns </span>
              just got easier
              <span> </span>
            </h1>
            <p className={styles.heroBody} style={marketingTypographyStyles.bodyLg}>
            A better way to create, refine, and finish your designs,
            so every pattern starts as a work in progress and ends exactly how you want it.
            </p>
            {/* <div className={styles.waitlistCallout}>
              <p className={styles.waitlistEyebrow} style={marketingTypographyStyles.eyebrow}>
                Private beta access
              </p>
              <p className={styles.waitlistIntro} style={marketingTypographyStyles.body}>
                {waitlistIntroCopy}
              </p>
              {!showResumeCta ? (
                <form
                  className={styles.waitlistQuickForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    openWaitlistModal(email);
                  }}
                >
                  <label className={styles.waitlistQuickField}>
                    <span className={styles.visuallyHidden}>Email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.currentTarget.value)}
                      placeholder="you@example.com"
                      className={styles.waitlistQuickInput}
                      required
                    />
                  </label>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className={styles.waitlistQuickButton}
                    onClick={() => openWaitlistModal(email)}
                  >
                    Continue application
                    <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
                  </Button>
                </form>
              ) : null}
            </div> */}
            {waitlistStatus ? (
              <Notification
                tone={waitlistStatus.tone}
                title={waitlistStatus.title}
                description={waitlistStatus.description}
                onDismiss={() => setWaitlistStatus(null)}
                neutralSurface
              />
            ) : null}
            {!waitlistStatus && (showPendingApprovalNotice || showApprovalRequiredNotice) ? (
              <Notification
                tone="info"
                title={
                  showApprovalRequiredNotice
                    ? "This account isn’t approved for beta access yet"
                    : "Your beta access is still pending"
                }
                description={
                  showApprovalRequiredNotice
                    ? "Google sign-in is back for returning approved users, but new access still starts with the waitlist. Join the beta queue below and we’ll email you when you’re approved."
                    : "Thanks for signing in. We’ve got your application and will email you once your account is approved."
                }
                neutralSurface
              />
            ) : null}
            <div className={styles.heroActions}>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className={styles.primaryCta}
                onClick={() => {
                  if (showResumeCta) {
                    router.push("/library");
                    return;
                  }

                  openWaitlistModal(email);
                }}
              >
                <span className={styles.ctaLabel}>{waitlistActionLabel}</span>
                {!showResumeCta ? <ButtonIcon icon="/icons/lucide/arrow-right.svg" /> : null}
              </Button>
              {showResumeCta ? (
                <Button
                  type="button"
                  variant="outlined"
                  size="lg"
                  className={styles.secondaryCta}
                  onClick={() => router.push(editorRoute)}
                >
                  Launch Editor
                </Button>
              ) : null}
            </div>
            <div className={styles.heroPreviewWrap}>
              <div className={styles.heroPreviewStage}>
                <div className={styles.heroPreviewCard}>
                  <Image
                    src="/editor-collapsed.png"
                    alt="Wippa editor interface with the workspace controls collapsed"
                    width={2940}
                    height={1472}
                    priority
                    sizes="100vw"
                    className={styles.heroPreviewImage}
                  />
                </div>
              </div>
            </div>
            {/* <div className={styles.heroFeatureGrid}>
              {heroHighlights.map((item) => (
                <div key={item.title} className={styles.heroFeature}>
                  <p className={styles.heroFeatureKicker} style={marketingTypographyStyles.eyebrow}>{item.kicker}</p>
                  <h2 className={styles.heroFeatureTitle} style={marketingTypographyStyles.titleSm}>{item.title}</h2>
                  <p className={styles.heroFeatureBody} style={marketingTypographyStyles.bodySm}>{item.body}</p>
                </div>
              ))}
            </div> */}
          </div>

          {/* <div className={styles.demoFrame} aria-label="Editor demo placeholder">
            <div className={styles.demoMedia}>
              <Image
                src="/editor_ss3.png"
                alt="Placeholder image for the future editor demo video"
                fill
                priority
                sizes="(max-width: 960px) 100vw, 50vw"
                className={styles.demoImage}
              />
            </div>
            <p className={styles.demoCaption} style={marketingTypographyStyles.eyebrow}>
              Looped editor demo coming soon
            </p>
          </div> */}
        </section>

        <div className={styles.sectionDivider} aria-hidden="true" />

        <section className={styles.features} id="features">
          <div className={styles.featuresIntro}>
            <div>
              <p className={styles.sectionKicker} style={marketingTypographyStyles.eyebrow}>The Canvas</p>
              <h2 className={styles.sectionTitle} style={marketingTypographyStyles.sectionTitle}>
                Built for <span className={styles.sectionTitleEmphasis}>better</span>{" "}
                pattern design.
              </h2>
            </div>
            <p className={styles.sectionBody} style={marketingTypographyStyles.body}>
              More creative control, a smoother workflow, and 
              cleaner results: everything working together the way it should.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {featureCards.map((item) => (
              <article key={item.index} className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <span className={[styles.featureIndex, styles.featureIndexAccent].join(" ")} style={marketingTypographyStyles.eyebrow}>
                    {item.index}
                  </span>
                  <span className={styles.featureIndex} style={marketingTypographyStyles.eyebrow}>{item.label}</span>
                </div>
                <h3 className={styles.featureTitle} style={marketingTypographyStyles.featureTitle}>{item.title}</h3>
                <p className={styles.featureBody} style={marketingTypographyStyles.body}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.footerSection} id="begin">
          <div className={styles.footerInner}>
            <div className={styles.footerContent}>
              <div className={styles.footerCopy}>
                <p className={styles.footerMeta} style={marketingTypographyStyles.eyebrow}>Waitlist</p>
                <h2 className={styles.footerTitle}  style={marketingTypographyStyles.footerTitle} >
                  Help shape the <span className={styles.footerTitleEmphasis}>next draft</span> of Wippa.
                </h2>
              </div>
              <div className={styles.footerCopy} id="waitlist">
                <p className={styles.footerBody} style={marketingTypographyStyles.body}>
                  {showResumeCta
                    ? "Your beta access is already active. Jump back into your library whenever you’re ready."
                    : "Share how you currently design needlepoint patterns and what you’re hoping to make with Wippa. We’re inviting people in gradually during beta."}
                </p>
                <div className={styles.footerActions}>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className={styles.footerPrimary}
                    onClick={() => {
                      if (showResumeCta) {
                        router.push("/library");
                        return;
                      }

                      openWaitlistModal(email);
                    }}
                  >
                    {showResumeCta ? "Open My Library" : "Join the Waitlist"}
                    {!showResumeCta ? <ButtonIcon icon="/icons/lucide/arrow-right.svg" /> : null}
                  </Button>
                  {showResumeCta ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      className={styles.footerSecondary}
                      onClick={() => router.push(editorRoute)}
                    >
                      Launch Editor
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.footerBar}>
            <p className={styles.footerMeta} style={marketingTypographyStyles.eyebrow}>Wippa Studio • Est. MMXXVI</p>
            <p className={styles.footerMeta} style={marketingTypographyStyles.eyebrow}>V2.4 • Drafting on a precision canvas</p>
          </div>
        </section>
      </div>
      <Modal
        isOpen={waitlistModalOpen}
        title="Apply for beta access"
        description={
          <div className={styles.waitlistModalCopy}>
            <p>{modalDescription}</p>
            {!showResumeCta ? (
              <form
                id="waitlist-application-form"
                className={styles.waitlistModalForm}
                onSubmit={handleWaitlistSubmit}
              >
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
                <Field label="Do you currently create your own needlepoint patterns?">
                  <FieldSelect
                    value={experienceLevel}
                    onChange={(event) =>
                      setExperienceLevel(
                        event.currentTarget.value as (typeof experienceLevelOptions)[number],
                      )
                    }
                  >
                    {experienceLevelOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </FieldSelect>
                </Field>
                <Field label="What tools do you currently use?">
                  <FieldInput
                    type="text"
                    value={currentTools}
                    onChange={(event) => setCurrentTools(event.currentTarget.value)}
                    placeholder="Photoshop, Procreate, graph paper, stitch charts..."
                    required
                  />
                </Field>
                <Field label="What are you hoping to use WIP for?">
                  <textarea
                    value={freeformResponse}
                    onChange={(event) => setFreeformResponse(event.currentTarget.value)}
                    placeholder="Tell us what you want to design, refine, or speed up."
                    className={styles.waitlistTextarea}
                    rows={5}
                    required
                  />
                </Field>
              </form>
            ) : null}
          </div>
        }
        dismissLabel={showResumeCta ? "Close" : "Not now"}
        confirmLabel={showResumeCta ? "Open library" : isSubmittingWaitlist ? "Submitting..." : "Join waitlist"}
        onDismiss={() => setWaitlistModalOpen(false)}
        onConfirm={() => {
          if (showResumeCta) {
            router.push("/library");
            return;
          }

          void handleWaitlistSubmit();
        }}
        onClose={() => setWaitlistModalOpen(false)}
        confirmDisabled={isSubmittingWaitlist}
        showCloseButton
      />
    </main>
  );
}
