"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { marketingTypographyStyles, typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  ButtonIcon,
  Field,
  FieldInput,
  Modal,
  Notification,
} from "@/components/design-system";
import { useOpenSignIn } from "@/components/auth/useOpenSignIn";
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

type BuildingBlockPanelImageLayer = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  imageClassName?: string;
};

type BuildingBlockPanelMedia =
  | {
      kind: "single";
      image: BuildingBlockPanelImageLayer;
    }
  | {
      kind: "stacked";
      frameClassName?: string;
      overlayClassName?: string;
      layers: BuildingBlockPanelImageLayer[];
    };

type BuildingBlockPanel = {
  kicker: string;
  title: string;
  body: string;
  className: string;
  media: BuildingBlockPanelMedia;
};

const buildingBlockPanels: readonly BuildingBlockPanel[] = [
  {
    kicker: "Typography",
    title: "Fonts",
    body: "Mix monograms, scripts, and label-ready lettering without leaving the canvas.",
    className: "buildingBlocksPanelFonts",
    media: {
      kind: "stacked",
      frameClassName: "buildingBlocksPanelMediaFrameWide",
      overlayClassName: "buildingBlocksPanelOverlayWide",
      layers: [
        {
          src: "/ui/canvas-text-pink-right.png",
          alt: "Editor canvas showing text placed in a design",
          width: 1842,
          height: 1176,
          className: "buildingBlocksPanelLayerBack",
          imageClassName: "buildingBlocksPanelLayerImage",
        },
        {
          src: "/ui/font-menu-green-hover.png",
          alt: "Text settings panel displayed over the editor canvas",
          width: 376,
          height: 824,
          className: "buildingBlocksPanelLayerFront buildingBlocksPanelLayerFrontText",
          imageClassName: "buildingBlocksPanelLayerImage",
        },
      ],
    },
  },
  {
    kicker: "Illustration",
    title: "Icon Library",
    body: "Browse ready-made motifs and drop in stitch-friendly shapes for themed layouts fast.",
    className: "buildingBlocksPanelIcons",
    media: {
      kind: "stacked",
      frameClassName: "buildingBlocksPanelMediaFrameSquare",
      overlayClassName: "buildingBlocksPanelOverlaySquare",
      layers: [
        {
          src: "/ui/icon-canvas-lemon-small.png",
          alt: "Editor canvas showing multiple icon elements",
          width: 1920,
          height: 1080,
          className: "buildingBlocksPanelLayerBack buildingBlocksPanelLayerBackIcons",
          imageClassName: "buildingBlocksPanelLayerImage buildingBlocksPanelLayerImageMuted",
        },
        {
          src: "/ui/graphics-menu.png",
          alt: "Icon library panel displayed over the editor canvas",
          width: 664,
          height: 698,
          className: "buildingBlocksPanelLayerFront buildingBlocksPanelLayerFrontIcons",
          imageClassName: "buildingBlocksPanelLayerImage",
        },
      ],
    },
  },
  {
    kicker: "Layout",
    title: "Shapes + Frames",
    body: "Wrap designs with labels, borders, and geometric structures that stay crisp in pattern form.",
    className: "buildingBlocksPanelShapes",
    media: {
      kind: "stacked",
      frameClassName: "buildingBlocksPanelMediaFrameWide",
      overlayClassName: "buildingBlocksPanelOverlayWide",
      layers: [
        {
          src: "/ui/frame-menu.png",
          alt: "Editor canvas showing frame and label elements on a design",
          width: 1920,
          height: 1080,
          className: "buildingBlocksPanelLayerBack buildingBlocksPanelLayerBackShapes",
          imageClassName: "buildingBlocksPanelLayerImage",
        },
        {
          src: "/ui/frame-canvas-double-scallop.png",
          alt: "Selected double scallop frame on the canvas",
          width: 1014,
          height: 970,
          className: "buildingBlocksPanelLayerMiddle buildingBlocksPanelLayerMiddleFrame",
          imageClassName: "buildingBlocksPanelLayerImage",
        },
        {
          src: "/ui/double-scallop-frame-controls.png",
          alt: "Frame controls displayed over the editor canvas",
          width: 1178,
          height: 226,
          className: "buildingBlocksPanelLayerFront buildingBlocksPanelLayerFrontFrameControls",
          imageClassName: "buildingBlocksPanelLayerImage",
        },
      ],
    },
  },
] as const;

const workflowCards = [
  {
    title: "Import",
    body: "Start from a favorite image and translate it into a stitchable foundation.",
    image: {
      src: "/ui/upload-image.png",
      alt: "Upload image panel for adding source artwork to the editor",
      width: 1536,
      height: 1024,
    },
  },
  {
    title: "Convert",
    body: "Tune the chart conversion until the preview matches the way you want to stitch.",
    image: {
      src: "/ui/convert-image.png",
      alt: "Pattern conversion controls shown beside a canvas preview",
      width: 1536,
      height: 1024,
    },
  },
  {
    title: "Refine",
    body: "Edit colors, details, and layout with tools that stay close to the canvas.",
    image: {
      src: "/ui/selection_tools.png",
      alt: "Selection tools displayed in the needlepoint chart editor",
      width: 1536,
      height: 1024,
    },
  },
  {
    title: "Palette",
    body: "Keep design colors organized as you build toward a clean finished chart.",
    image: {
      src: "/ui/design-colors-list.png",
      alt: "Design color list in the editor sidebar",
      width: 1536,
      height: 1024,
    },
  },
] as const;

// const detailBentoCards = [
//   {
//     title: "Export stitch-ready PDFs",
//     body: "Generate full-color symbol charts with DMC codes, stitch counts, and skein estimates.",
//     image: {
//       src: "/ui/export-crop.png",
//       alt: "Pattern conversion controls shown beside a canvas preview",
//       width: 1536,
//       height: 1024,
//     },
//   },
//   {
//     title: "Grid snapping and guides",
//     body: "Place your shapes, icons, and text with precision.",
//     image: {
//       src: "/ui/flower-grid-snap.png",
//       alt: "Text settings panel open in the editor",
//       width: 1536,
//       height: 1024,
//     },
//   },
//   {
//     title: "Build with reusable palettes",
//     body: "Save favorite shade sets and keep project colors consistent from canvas to export.",
//     image: {
//       src: "/ui/custom-palettes-list.png",
//       alt: "Custom palette list in the editor color tools",
//       width: 1536,
//       height: 1024,
//     },
//   },
//   {
//     title: "Frame, duplicate, and compose faster",
//     body: "Use structured elements and quick-edit tools to build polished layouts without repetitive setup.",
//     image: {
//       src: "/ui/copy-tool-new.png",
//       alt: "Editor canvas with copy controls for arranging design elements",
//       width: 1536,
//       height: 1024,
//     },
//   },
// ] as const;

type WaitlistStatus =
  | { tone: "success"; title: string; description: string }
  | { tone: "destructive"; title: string; description: string }
  | null;

type WaitlistFieldName =
  | "email"
  | "experienceLevel"
  | "betaTestingInterest"
  | "currentTools"
  | "freeformResponse";
type WaitlistFormErrors = Partial<Record<WaitlistFieldName, string>>;
type WaitlistSurveyFieldName = Exclude<WaitlistFieldName, "email">;
type WaitlistSurveyFormErrors = Partial<Record<WaitlistSurveyFieldName, string>>;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const requiredFieldMessage = "This field is required.";
const invalidEmailMessage = "Please enter a valid email address.";
const invalidLengthMessage = "Please shorten this response.";

const experienceLevelOptions = [
  "Yes, regularly",
  "Sometimes",
  "Not yet",
] as const;
const betaTestingInterestOptions = [
  { label: "Yes", value: "yes" },
  { label: "Maybe later", value: "maybe" },
  { label: "No", value: "no" },
] as const;
type BetaTestingInterestOption = (typeof betaTestingInterestOptions)[number]["value"];

export default function Page() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openSignIn = useOpenSignIn();
  const { isLoaded, isSignedIn } = useAuthSession();
  const { hasAppAccess, isLoaded: isAccessStateLoaded } = useAuthAccessState();
  const showResumeCta = isLoaded && isAccessStateLoaded && hasAppAccess;
  const showPendingApprovalNotice = searchParams.get("notice") === "pending-approval";
  const showApprovalRequiredNotice = searchParams.get("notice") === "approval-required";
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [isSubmittingWaitlistSurvey, setIsSubmittingWaitlistSurvey] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>(null);
  const [submittedWaitlistEmail, setSubmittedWaitlistEmail] = useState<string | null>(null);
  const [hasSubmittedWaitlistSurvey, setHasSubmittedWaitlistSurvey] = useState(false);
  const [email, setEmail] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<
    (typeof experienceLevelOptions)[number] | ""
  >("");
  const [betaTestingInterest, setBetaTestingInterest] =
    useState<BetaTestingInterestOption | null>(null);
  const [currentTools, setCurrentTools] = useState("");
  const [freeformResponse, setFreeformResponse] = useState("");
  const [website, setWebsite] = useState("");
  const [waitlistFormErrors, setWaitlistFormErrors] = useState<WaitlistFormErrors>({});
  const [waitlistSurveyFormErrors, setWaitlistSurveyFormErrors] =
    useState<WaitlistSurveyFormErrors>({});
  const waitlistActionLabel = showResumeCta ? "View my designs" : " Join Waitlist";
  const waitlistStatusModalTone = waitlistStatus?.tone === "success" ? "confirmation" : "fail";
  const editorRoute = "/editor";
  const showOptionalSurvey =
    waitlistStatus?.tone === "success" &&
    submittedWaitlistEmail !== null &&
    !hasSubmittedWaitlistSurvey;

  useEffect(() => {
    if (searchParams.get("waitlist") !== "1") {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("waitlist");

    router.replace(nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const animatedElements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-animate='pending']"),
    );

    if (animatedElements.length === 0) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animatedElements.forEach((element) => {
        element.dataset.animate = "visible";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const element = entry.target as HTMLElement;
          element.dataset.animate = "visible";
          observer.unobserve(element);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.14 },
    );

    animatedElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  function resetWaitlistForm() {
    setEmail("");
    setWebsite("");
    setWaitlistFormErrors({});
  }

  function clearWaitlistFieldError(field: WaitlistFieldName) {
    setWaitlistFormErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function clearWaitlistSurveyFieldError(field: WaitlistSurveyFieldName) {
    setWaitlistSurveyFormErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function validateWaitlistJoinForm() {
    const trimmedEmail = email.trim();
    const nextErrors: WaitlistFormErrors = {};

    if (!trimmedEmail) {
      nextErrors.email = requiredFieldMessage;
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = invalidEmailMessage;
    }

    setWaitlistFormErrors(nextErrors);

    return {
      isValid: Object.keys(nextErrors).length === 0,
      trimmedEmail,
    };
  }

  function validateWaitlistSurveyForm() {
    const trimmedExperienceLevel = experienceLevel.trim();
    const trimmedCurrentTools = currentTools.trim();
    const trimmedFreeformResponse = freeformResponse.trim();
    const nextErrors: WaitlistSurveyFormErrors = {};

    if (!trimmedExperienceLevel) {
      nextErrors.experienceLevel = requiredFieldMessage;
    } else if (trimmedExperienceLevel.length > 120) {
      nextErrors.experienceLevel = invalidLengthMessage;
    }

    if (trimmedCurrentTools.length > 300) {
      nextErrors.currentTools = invalidLengthMessage;
    }

    if (trimmedFreeformResponse.length > 4000) {
      nextErrors.freeformResponse = invalidLengthMessage;
    }

    if (betaTestingInterest === null) {
      nextErrors.betaTestingInterest = requiredFieldMessage;
    }

    setWaitlistSurveyFormErrors(nextErrors);

    return {
      isValid: Object.keys(nextErrors).length === 0,
      trimmedExperienceLevel,
      betaTestingInterest: betaTestingInterest === "yes",
      trimmedCurrentTools,
      trimmedFreeformResponse,
    };
  }

  async function handleWaitlistSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (showResumeCta) {
      router.push("/library");
      return;
    }

    const validation = validateWaitlistJoinForm();
    if (!validation.isValid) {
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
          email: validation.trimmedEmail,
          website,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        alreadySubmitted?: boolean;
        error?: string;
      } | null;

      if (!response.ok) {
        setWaitlistStatus({
          tone: "destructive",
          title: "Couldn’t join the waitlist",
          description: body?.error ?? "Please check your answers and try again.",
        });
        return;
      }

      setWaitlistStatus(
        body?.alreadySubmitted
          ? {
              tone: "success",
              title: "You’re already on the list",
              description:
                "We already have an application for that email. We’ll keep you posted on launch timelines.",
            }
          : {
              tone: "success",
              title: "You’re on the list",
              description:
                "Thanks for your interest in Wippa! We’ll keep you posted on launch timelines.",
            },
      );
      setSubmittedWaitlistEmail(validation.trimmedEmail.toLowerCase());
      setHasSubmittedWaitlistSurvey(false);
      setWaitlistSurveyFormErrors({});
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

  async function handleWaitlistSurveySubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!submittedWaitlistEmail) {
      return;
    }

    const validation = validateWaitlistSurveyForm();
    if (!validation.isValid) {
      return;
    }

    setIsSubmittingWaitlistSurvey(true);

    try {
      const response = await fetch("/api/waitlist/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email: submittedWaitlistEmail,
          experienceLevel: validation.trimmedExperienceLevel,
          betaTestingInterest: validation.betaTestingInterest,
          currentTools: validation.trimmedCurrentTools,
          freeformResponse: validation.trimmedFreeformResponse,
          website,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setWaitlistStatus({
          tone: "destructive",
          title: "Couldn’t save the survey",
          description: body?.error ?? "Please check your answers and try again.",
        });
        return;
      }

      setHasSubmittedWaitlistSurvey(true);
      setWaitlistSurveyFormErrors({});
      setExperienceLevel("");
      setBetaTestingInterest(null);
      setCurrentTools("");
      setFreeformResponse("");
      setWaitlistStatus({
        tone: "success",
        title: "Thanks for the extra context",
        description: "Your survey response has been saved separately from your waitlist entry.",
      });
    } catch {
      setWaitlistStatus({
        tone: "destructive",
        title: "Couldn’t save the survey",
        description: "Something went wrong on our side. Please try again in a moment.",
      });
    } finally {
      setIsSubmittingWaitlistSurvey(false);
    }
  }

  return (
    <main className={`${styles.page} landing-light-page`}>
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
            Designing your WIPs has never been easier.
              {/* <span className={styles.accentWord}>  needlepoint patterns </span> */}
              {/* just got easier */}
              <span> </span>
            </h1>
            <p className={styles.heroBody} style={marketingTypographyStyles.bodyLg}>
              Meet Wippa, a needlepoint pattern editing tool designed to make your creative process smoother, faster, and more enjoyable. 
              Go from idea to stitch-ready pattern in minutes.


            </p>
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
              {!showResumeCta ? (
                <form className={styles.waitlistQuickForm} onSubmit={handleWaitlistSubmit} noValidate>
                  <div className={styles.visuallyHidden} aria-hidden="true">
                    <label htmlFor="waitlist-hero-website">Website</label>
                    <input
                      id="waitlist-hero-website"
                      type="text"
                      name="website"
                      autoComplete="off"
                      tabIndex={-1}
                      value={website}
                      onChange={(event) => setWebsite(event.currentTarget.value)}
                    />
                  </div>
                  <label className={styles.waitlistQuickField}>
                    <span className={styles.visuallyHidden}>Email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.currentTarget.value);
                        clearWaitlistFieldError("email");
                      }}
                      placeholder="you@example.com"
                      aria-invalid={waitlistFormErrors.email ? "true" : undefined}
                      className={[
                        styles.waitlistQuickInput,
                        waitlistFormErrors.email ? styles.invalidInput : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      required
                    />
                    {waitlistFormErrors.email ? (
                      <span className={styles.fieldError}>{waitlistFormErrors.email}</span>
                    ) : null}
                  </label>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className={styles.waitlistQuickButton}
                    disabled={isSubmittingWaitlist}
                  >
                    {isSubmittingWaitlist ? "Joining..." : "Join waitlist"}
                    <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
                  </Button>
                </form>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className={styles.primaryCta}
                  onClick={() => router.push("/library")}
                >
                  <span className={styles.ctaLabel}>{waitlistActionLabel}</span>
                </Button>
              )}
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
                    src="/ui/editor-dachsund-color-tab.png"
                    alt="Wippa editor interface with the workspace controls collapsed"
                    width={2438}
                    height={1448}
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

        <section className={styles.buildingBlocksSection} id="features" aria-labelledby="building-blocks-heading">
          <div className={styles.buildingBlocksIntro} data-animate="pending">
            <div>
              <h2
                id="building-blocks-heading"
                className={styles.sectionTitle}
                style={marketingTypographyStyles.sectionTitle}
              >
              Drag, drop, done - get going on your canvas in minutes
              </h2>
              <p className={styles.sectionBody} style={marketingTypographyStyles.body}>
                Add text, icons, frames, and shapes directly onto your pattern and instantly convert them into painted canvas cells.
                No manual tracing. No clunky workflows.
              </p>
            </div>
          </div>

          <div className={styles.buildingBlocksLayout}>
            {/* <article className={styles.buildingBlocksPreviewCard}>
              <div className={styles.buildingBlocksPreviewFrame}>
                <Image
                  src="/ui/editor-dachsund-color-tab.png"
                  alt="Editor preview showing the design workspace and sidebar tools"
                  width={2940}
                  height={1472}
                  sizes="(max-width: 1100px) 100vw, 90vw"
                  className={styles.buildingBlocksPreviewImage}
                />
              </div>
            </article> */}

            <div className={styles.buildingBlocksPanelGrid}>
              {buildingBlockPanels.map((panel) => (
                <article
                  key={panel.title}
                  className={[styles.buildingBlocksPanel, styles[panel.className]].join(" ")}
                  data-animate="pending"
                >
                  <div className={styles.buildingBlocksPanelMedia}>
                    {panel.media.kind === "single" ? (
                      <Image
                        src={panel.media.image.src}
                        alt={panel.media.image.alt}
                        width={panel.media.image.width}
                        height={panel.media.image.height}
                        sizes="(max-width: 980px) 100vw, 30vw"
                        className={[
                          styles.buildingBlocksPanelImage,
                          panel.media.image.imageClassName ? styles[panel.media.image.imageClassName] : "",
                        ].join(" ")}
                      />
                    ) : (
                      <div
                        className={[
                          styles.buildingBlocksPanelMediaFrame,
                          panel.media.frameClassName ? styles[panel.media.frameClassName] : "",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        <div
                          className={[
                            styles.buildingBlocksPanelOverlay,
                            panel.media.overlayClassName ? styles[panel.media.overlayClassName] : "",
                          ].join(" ")}
                        >
                          {panel.media.layers.map((layer) => (
                            <div
                              key={layer.src}
                              className={layer.className
                                .split(" ")
                                .map((className) => styles[className])
                                .join(" ")}
                            >
                              <Image
                                src={layer.src}
                                alt={layer.alt}
                                width={layer.width}
                                height={layer.height}
                                sizes="(max-width: 980px) 100vw, 30vw"
                                className={[
                                  styles.buildingBlocksPanelImage,
                                  layer.imageClassName ? styles[layer.imageClassName] : "",
                                ].join(" ")}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles.buildingBlocksPanelCopy}>
                    {/* <p className={styles.buildingBlocksPanelKicker} style={marketingTypographyStyles.eyebrow}>
                      {panel.kicker}
                    </p> */}
                    <h3 className={styles.buildingBlocksPanelTitle} style={marketingTypographyStyles.featureTitle}>
                      {panel.title}
                    </h3>
                    <p className={styles.buildingBlocksPanelBody} style={marketingTypographyStyles.bodySm}>
                      {panel.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* <section className={styles.workflowSection} aria-labelledby="workflow-heading">
          <div className={styles.workflowIntro}>
            <div>
              <p className={styles.sectionKicker} style={marketingTypographyStyles.eyebrow}>
                Pattern workflow
              </p>
              <h2
                id="workflow-heading"
                className={styles.sectionTitle}
                style={marketingTypographyStyles.sectionTitle}
              >
                Move from source artwork to an organized chart without losing momentum.
              </h2>
            </div>
            <p className={styles.sectionBody} style={marketingTypographyStyles.body}>
              Each step keeps the design visible, editable, and grounded in the choices
              stitchers actually need before printing or exporting.
            </p>
          </div>

          <div className={styles.workflowCardGrid}>
            {workflowCards.map((card) => (
              <article key={card.title} className={styles.workflowCard}>
                <div className={styles.workflowCardCopy}>
                  <h3 className={styles.workflowCardTitle} style={marketingTypographyStyles.featureTitle}>
                    {card.title}
                  </h3>
                  <p className={styles.workflowCardBody} style={marketingTypographyStyles.bodySm}>
                    {card.body}
                  </p>
                </div>
                <div className={styles.workflowCardMedia}>
                  <Image
                    src={card.image.src}
                    alt={card.image.alt}
                    width={card.image.width}
                    height={card.image.height}
                    sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 42vw"
                    className={styles.workflowCardImage}
                  />
                </div>
              </article>
            ))}
          </div>
        </section> */}

        {/* <section className={styles.features} id="features">
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
        </section> */}

        <section className={styles.bentoSection} aria-labelledby="feature-detail-heading">
          <div className={styles.bentoIntro} data-animate="pending">
            <div>
              {/* <p className={styles.sectionKicker} style={marketingTypographyStyles.eyebrow}>In The Details</p> */}
              <h2
                id="feature-detail-heading"
                className={styles.sectionTitle}
                style={marketingTypographyStyles.sectionTitle}
              >
                Pattern design made faster and easier for everyone
                {/* <span className={styles.sectionTitleEmphasis}> specifically </span>
                for stitched canvases */}
              </h2>
              <p className={styles.sectionBody} style={marketingTypographyStyles.body}>
                Core editing tools for the moments that matter most, plus supporting features that keep your pattern organized from first draft to final export.
              </p>
            </div>
          </div>

          <div className={styles.bentoRows}>
            <div className={[styles.bentoGrid, styles.bentoGridTop].join(" ")}>
              <article
                className={[styles.bentoCard, styles.bentoCardPrimary, styles.bentoCardWrappedStack].join(" ")}
                data-animate="pending"
              >
                <div className={styles.bentoCopy}>
                  <h3 className={styles.bentoTitle} style={marketingTypographyStyles.featureTitle}>
                    Paint and edit with precision
                  </h3>
                  <p className={styles.bentoBody} style={marketingTypographyStyles.bodySm}>
              Every tool you need (and more) to create and edit patterns just the way you want them, in a seamless and intuitive editing interface.                  </p>
                </div>
                <div className={styles.bentoVisualFrame} aria-hidden="true">
                  <div className={[styles.bentoVisualAsset, styles.bentoVisualPrimary].join(" ")}>
                    <Image
                      src="/ui/cut-tool-ss.png"
                      alt=""
                      width={1600}
                      height={1000}
                      className={styles.bentoVisualImage}
                    />
                  </div>
                </div>
              </article>

              <article
                className={[styles.bentoCard, styles.bentoCardQuaternary, styles.bentoCardRightStack].join(" ")}
                data-animate="pending"
              >
                <div className={styles.bentoCopy}>
                  <h3 className={styles.bentoTitle} style={marketingTypographyStyles.featureTitle}>
                  Design color management
                  </h3>
                  <p className={styles.bentoBody} style={marketingTypographyStyles.bodySm}>
                    See every color in your design with stitch counts, and merge similar shades or bulk delete shades with low usage.
                  </p>
                </div>
                <div className={[styles.bentoOverlayVisual, styles.bentoOverlayVisualRightStack].join(" ")} aria-hidden="true">
                  <div
                    className={[
                      styles.bentoVisualAsset,
                      styles.bentoVisualQuaternaryBack,
                      styles.bentoVisualRightStackBack,
                    ].join(" ")}
                  >
                    <Image
                      src="/ui/selection-canvas-dog.png"
                      alt=""
                      width={1600}
                      height={1000}
                      className={styles.bentoPlaceholderBack}
                    />
                  </div>
                  <div
                    className={[
                      styles.bentoVisualAsset,
                      styles.bentoVisualQuaternaryFront,
                      styles.bentoVisualRightStackMiddle,
                    ].join(" ")}
                  >
                    <Image
                      src="/ui/selection-card.png"
                      alt=""
                      width={1600}
                      height={1000}
                    />
                    <div
                      className={[
                        styles.bentoVisualAsset,
                        styles.bentoVisualQuaternaryFront,
                        styles.bentoVisualRightStackFront,
                      ].join(" ")}
                    >
                      <Image
                        src="/ui/selection-bar.png"
                        alt=""
                        width={1600}
                        height={1000}
                      />
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* <div className={styles.bentoFeatureGrid}>
              {detailBentoCards.map((card, index) => (
                <article
                  key={card.title}
                  className={[
                    styles.bentoFeatureCard,
                    index === 0 ? styles.bentoFeatureExportCard : null,
                    index === 2 ? styles.bentoFeatureCardTall : null,
                    index === 3 ? styles.bentoFeatureCardWide : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className={styles.bentoFeatureCopy}>
                    <h3 className={styles.bentoFeatureTitle} style={marketingTypographyStyles.featureTitle}>
                      {card.title}
                    </h3>
                    <p className={styles.bentoFeatureBody} style={marketingTypographyStyles.bodySm}>
                      {card.body}
                    </p>
                  </div>
                  <div className={styles.bentoFeatureMedia} aria-hidden="true">
                    <Image
                      src={card.image.src}
                      alt=""
                      width={card.image.width}
                      height={card.image.height}
                      className={styles.bentoFeatureImage}
                    />
                  </div>
                </article>
              ))}
            </div> */}

            <div className={styles.bentoSupportGrid}>
              <article className={styles.bentoSupportCard} data-animate="pending">
                <div className={styles.bentoSupportCopy}>
                  <div className={styles.bentoSupportHeading}>
                    <span className={styles.bentoSupportIcon} aria-hidden="true">
                      <Image src="/icons/lucide/proportions.svg" alt="" width={20} height={20} />
                    </span>
                    <h3 className={styles.bentoSupportTitle} style={marketingTypographyStyles.featureTitle}>
                      Start with canvas size presets
                    </h3>
                  </div>
                  <p className={styles.bentoSupportBody} style={marketingTypographyStyles.bodySm}>
                    Quickly choose your canvas size based on what you’re making - coasters, bookmarks, stockings galore.
                  </p>
                </div>
              </article>

              <article className={styles.bentoSupportCard} data-animate="pending">
                <div className={styles.bentoSupportCopy}>
                  <div className={styles.bentoSupportHeading}>
                    <span className={styles.bentoSupportIcon} aria-hidden="true">
                      <Image src="/icons/lucide/image.svg" alt="" width={20} height={20} />
                    </span>
                    <h3 className={styles.bentoSupportTitle} style={marketingTypographyStyles.featureTitle}>
                      Upload images
                    </h3>
                  </div>
                  <p className={styles.bentoSupportBody} style={marketingTypographyStyles.bodySm}>
                    Use your own images as a traceable background, or convert to painted cells.
                    Clean up your image right in the editor with the magic eraser.
                  </p>
                </div>
              </article>

              <article className={styles.bentoSupportCard} data-animate="pending">
                <div className={styles.bentoSupportCopy}>
                  <div className={styles.bentoSupportHeading}>
                    <span className={styles.bentoSupportIcon} aria-hidden="true">
                      <Image src="/icons/lucide/palette.svg" alt="" width={20} height={20} />
                    </span>
                    <h3 className={styles.bentoSupportTitle} style={marketingTypographyStyles.featureTitle}>
                      Custom palettes
                    </h3>
                  </div>
                  <p className={styles.bentoSupportBody} style={marketingTypographyStyles.bodySm}>
                    Build reusable palettes from favorite shades, thread inventory, or project-specific color rules.
                  </p>
                </div>
              </article>

              <article className={styles.bentoSupportCard} data-animate="pending">
                <div className={styles.bentoSupportCopy}>
                  <div className={styles.bentoSupportHeading}>
                    <span className={styles.bentoSupportIcon} aria-hidden="true">
                      <Image src="/icons/lucide/download.svg" alt="" width={20} height={20} />
                    </span>
                    <h3 className={styles.bentoSupportTitle} style={marketingTypographyStyles.featureTitle}>
                      Export stitch-ready PDFs
                    </h3>
                  </div>
                  <p className={styles.bentoSupportBody} style={marketingTypographyStyles.bodySm}>
                    Generate full-color symbol charts with DMC codes, stitch counts, and skein estimates.
                  </p>
                </div>
              </article>
            </div>

          </div>
        </section>

        <section className={styles.waitlistCtaSection} id="begin">
          <div className={styles.waitlistCtaInner}>
            <div className={styles.waitlistCtaContent} data-animate="pending">
              <div className={styles.waitlistCtaCopy}>
                <h2 className={styles.waitlistCtaTitle} style={marketingTypographyStyles.footerTitle}>
                  Be one of the first to{" "}
                  <span className={styles.waitlistCtaTitleEmphasis}>join the community.</span>
                </h2>
              </div>
              <div className={styles.waitlistCtaCopy} id="waitlist">
                <p className={styles.waitlistCtaBody} style={marketingTypographyStyles.body}>
                  {showResumeCta
                    ? "Your beta access is already active. Jump back into your library whenever you’re ready."
                    : "Join the waitlist now to receive launch updates, priority beta access, and exclusive founding-member pricing at launch."
                    }
                </p>
                <div className={styles.waitlistCtaActions}>
                  {!showResumeCta ? (
                    <form className={styles.waitlistQuickForm} onSubmit={handleWaitlistSubmit} noValidate>
                      <div className={styles.visuallyHidden} aria-hidden="true">
                        <label htmlFor="waitlist-footer-website">Website</label>
                        <input
                          id="waitlist-footer-website"
                          type="text"
                          name="website"
                          autoComplete="off"
                          tabIndex={-1}
                          value={website}
                          onChange={(event) => setWebsite(event.currentTarget.value)}
                        />
                      </div>
                      <label className={styles.waitlistQuickField}>
                        <span className={styles.visuallyHidden}>Email</span>
                        <input
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.currentTarget.value);
                            clearWaitlistFieldError("email");
                          }}
                          placeholder="you@example.com"
                          aria-invalid={waitlistFormErrors.email ? "true" : undefined}
                          className={[
                            styles.waitlistQuickInput,
                            waitlistFormErrors.email ? styles.invalidInput : null,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          required
                        />
                        {waitlistFormErrors.email ? (
                          <span className={styles.fieldError}>{waitlistFormErrors.email}</span>
                        ) : null}
                      </label>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className={styles.waitlistCtaPrimary}
                        disabled={isSubmittingWaitlist}
                      >
                        {isSubmittingWaitlist ? "Joining..." : "Join waitlist"}
                        <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
                      </Button>
                    </form>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className={styles.waitlistCtaPrimary}
                      onClick={() => router.push("/library")}
                    >
                      View my designs
                    </Button>
                  )}
                  {showResumeCta ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      className={styles.waitlistCtaSecondary}
                      onClick={() => router.push(editorRoute)}
                    >
                      Launch Editor
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className={styles.siteFooter}>
          <div className={styles.siteFooterInner}>
            <Link href="/" className={styles.siteFooterBrand} aria-label="Wippa home">
              <Image
                src="/logos/curly/green-white-square-full.png"
                alt="Wippa"
                width={344}
                height={72}
                className={styles.siteFooterLogo}
              />
            </Link>
            <nav className={styles.footerLegalLinks} aria-label="Legal">
              <Link href="/privacy" className={styles.footerLegalLink}>
                Privacy Policy
              </Link>
              <Link href="/terms" className={styles.footerLegalLink}>
                Terms
              </Link>
              {isLoaded && !isSignedIn ? (
                <button
                  type="button"
                  className={styles.footerLoginButton}
                  onClick={() => {
                    const queryString = searchParams.toString();
                    openSignIn({
                      redirectUrl: queryString ? `${pathname}?${queryString}` : pathname,
                    });
                  }}
                >
                  Log in
                </button>
              ) : null}
            </nav>
            <p className={styles.siteFooterMeta} style={marketingTypographyStyles.eyebrow}>Wippa Studio • Est. MMXXVI</p>
          </div>
        </footer>
      </div>
      <Modal
        isOpen={waitlistStatus !== null}
        title={
          <span className={styles.waitlistModalTitle}>{waitlistStatus?.title ?? ""}</span>
        }
        description={
          <div className={styles.waitlistModalCopy}>
            <p className={styles.waitlistModalIntro}>
              {waitlistStatus?.description ?? ""}
            </p>
            {showOptionalSurvey ? (
              <section
                className={styles.waitlistSurveySection}
                aria-labelledby="waitlist-survey-heading"
              >
                <div className={styles.waitlistSurveyHeader}>
                  <h3 id="waitlist-survey-heading" className={styles.waitlistSurveyTitle}>
                    If you have a second, help us out by answering a few questions
                  </h3>
                </div>
                <form
                  id="waitlist-survey-form"
                  className={styles.waitlistModalForm}
                  onSubmit={handleWaitlistSurveySubmit}
                  noValidate
                >
                  <fieldset
                    className={[
                      styles.waitlistRadioField,
                      waitlistSurveyFormErrors.experienceLevel ? styles.invalidRadioField : null,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-invalid={waitlistSurveyFormErrors.experienceLevel ? "true" : undefined}
                  >
                    <legend
                      className={[
                        styles.waitlistFieldLabel,
                        waitlistSurveyFormErrors.experienceLevel ? styles.errorText : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      Do you currently create your own needlepoint patterns?
                    </legend>
                    <div className={styles.waitlistRadioOptions}>
                      {experienceLevelOptions.map((option) => (
                        <label key={option} className={styles.waitlistRadioOption}>
                          <input
                            type="radio"
                            name="experienceLevel"
                            value={option}
                            checked={experienceLevel === option}
                            onChange={() => {
                              setExperienceLevel(option);
                              clearWaitlistSurveyFieldError("experienceLevel");
                            }}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                    {waitlistSurveyFormErrors.experienceLevel ? (
                      <span className={styles.fieldError}>
                        {waitlistSurveyFormErrors.experienceLevel}
                      </span>
                    ) : null}
                  </fieldset>
                  <Field
                    label={
                      <span
                        className={[
                          styles.waitlistFieldLabel,
                          waitlistSurveyFormErrors.currentTools ? styles.errorText : null,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        What tools do you currently use?
                      </span>
                    }
                    hint={
                      waitlistSurveyFormErrors.currentTools ? (
                        <span className={styles.fieldError}>
                          {waitlistSurveyFormErrors.currentTools}
                        </span>
                      ) : undefined
                    }
                  >
                    <FieldInput
                      type="text"
                      value={currentTools}
                      onChange={(event) => {
                        setCurrentTools(event.currentTarget.value);
                        clearWaitlistSurveyFieldError("currentTools");
                      }}
                      placeholder="Photoshop, Procreate, graph paper, stitch charts..."
                      aria-invalid={waitlistSurveyFormErrors.currentTools ? "true" : undefined}
                      className={
                        waitlistSurveyFormErrors.currentTools ? styles.invalidInput : undefined
                      }
                    />
                  </Field>
                  {/* <Field
                    label={
                      <span
                        className={[
                          styles.waitlistFieldLabel,
                          waitlistSurveyFormErrors.freeformResponse ? styles.errorText : null,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        What are you hoping to use Wippa for?
                      </span>
                    }
                    hint={
                      waitlistSurveyFormErrors.freeformResponse ? (
                        <span className={styles.fieldError}>
                          {waitlistSurveyFormErrors.freeformResponse}
                        </span>
                      ) : undefined
                    }
                  >
                    <textarea
                      value={freeformResponse}
                      onChange={(event) => {
                        setFreeformResponse(event.currentTarget.value);
                        clearWaitlistSurveyFieldError("freeformResponse");
                      }}
                      placeholder="Tell us what you want to design, refine, or speed up."
                      className={[
                        styles.waitlistTextarea,
                        waitlistSurveyFormErrors.freeformResponse
                          ? styles.invalidInput
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      rows={2}
                      aria-invalid={
                        waitlistSurveyFormErrors.freeformResponse ? "true" : undefined
                      }
                    />
                  </Field> */}
                  <fieldset
                    className={
                      [
                        styles.waitlistRadioField,
                        waitlistSurveyFormErrors.betaTestingInterest
                          ? styles.invalidRadioField
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                    aria-invalid={
                      waitlistSurveyFormErrors.betaTestingInterest ? "true" : undefined
                    }
                  >
                    <legend
                      className={[
                        styles.waitlistFieldLabel,
                        waitlistSurveyFormErrors.betaTestingInterest ? styles.errorText : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      Would you be interested in beta testing or providing feedback during the development process?
                    </legend>
                    <div className={styles.waitlistRadioOptions}>
                      {betaTestingInterestOptions.map((option) => (
                        <label key={option.value} className={styles.waitlistRadioOption}>
                          <input
                            type="radio"
                            name="betaTestingInterest"
                            value={option.value}
                            checked={betaTestingInterest === option.value}
                            onChange={() => {
                              setBetaTestingInterest(option.value);
                              clearWaitlistSurveyFieldError("betaTestingInterest");
                            }}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {waitlistSurveyFormErrors.betaTestingInterest ? (
                      <span className={styles.fieldError}>
                        {waitlistSurveyFormErrors.betaTestingInterest}
                      </span>
                    ) : null}
                  </fieldset>
                </form>
              </section>
            ) : null}
          </div>
        }
        dismissLabel={showOptionalSurvey ? "Skip" : "Close"}
        confirmLabel={
          showResumeCta
            ? "Open library"
            : showOptionalSurvey
              ? isSubmittingWaitlistSurvey
                ? "Saving..."
                : "Submit survey"
              : "Okay"
        }
        onDismiss={() => {
          setWaitlistStatus(null);
          setSubmittedWaitlistEmail(null);
          setWaitlistSurveyFormErrors({});
        }}
        onConfirm={() => {
          if (showResumeCta) {
            setWaitlistStatus(null);
            router.push("/library");
            return;
          }

          if (showOptionalSurvey) {
            void handleWaitlistSurveySubmit();
            return;
          }

          setWaitlistStatus(null);
          setSubmittedWaitlistEmail(null);
        }}
        onClose={() => {
          setWaitlistStatus(null);
          setSubmittedWaitlistEmail(null);
          setWaitlistSurveyFormErrors({});
        }}
        tone={waitlistStatusModalTone}
        presentation={waitlistStatusModalTone === "confirmation" ? "centered" : "default"}
        confirmVariant="primary"
        confirmDisabled={isSubmittingWaitlistSurvey}
        closeOnBackdropClick
        showCloseButton
      />
    </main>
  );
}
