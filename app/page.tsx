"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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

type WaitlistStatus =
  | { tone: "success"; title: string; description: string }
  | { tone: "destructive"; title: string; description: string }
  | null;

type WaitlistFieldName = "email" | "experienceLevel" | "currentTools" | "freeformResponse";
type WaitlistFormErrors = Partial<Record<WaitlistFieldName, string>>;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const requiredFieldMessage = "This field is required.";
const invalidEmailMessage = "Please enter a valid email address.";
const invalidLengthMessage = "Please shorten this response.";

const experienceLevelOptions = [
  "Yes, regularly",
  "Sometimes",
  "Not yet, but I want to start",
] as const;

export default function Page() {
  const pathname = usePathname();
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
  const [waitlistFormErrors, setWaitlistFormErrors] = useState<WaitlistFormErrors>({});
  const waitlistIntroCopy = showResumeCta
    ? "Your account is active. Head back into your library to keep designing."
    : accessState === "pending_approval"
      ? "Your beta application has been received. We’ll email you as soon as your access is approved."
    : "Beta access is rolling out gradually. Join the waitlist and tell us a little about how you design today.";
  const waitlistActionLabel = showResumeCta ? "View my designs" : "Get Early Access";
  const modalDescription = useMemo(
    () =>
      showResumeCta
        ? "You already have access to Wippa. Open your library to keep working."
        : "We're rolling new users onto the beta in batches. Share some info and we'll let you know when your access is approved.",
    [showResumeCta],
  );
  const waitlistStatusModalTone = waitlistStatus?.tone === "success" ? "confirmation" : "fail";
  const editorRoute = "/editor";

  useEffect(() => {
    if (searchParams.get("waitlist") !== "1" || waitlistModalOpen) {
      return;
    }

    setWaitlistModalOpen(true);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("waitlist");

    router.replace(nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams, waitlistModalOpen]);

  function resetWaitlistForm() {
    setEmail("");
    setExperienceLevel(experienceLevelOptions[0]);
    setCurrentTools("");
    setFreeformResponse("");
    setWaitlistFormErrors({});
  }

  function openWaitlistModal(prefilledEmail?: string) {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }

    setWaitlistModalOpen(true);
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

  function validateWaitlistForm() {
    const trimmedEmail = email.trim();
    const trimmedExperienceLevel = experienceLevel.trim();
    const trimmedCurrentTools = currentTools.trim();
    const trimmedFreeformResponse = freeformResponse.trim();

    const nextErrors: WaitlistFormErrors = {};

    if (!trimmedEmail) {
      nextErrors.email = requiredFieldMessage;
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = invalidEmailMessage;
    }

    if (!trimmedExperienceLevel) {
      nextErrors.experienceLevel = requiredFieldMessage;
    } else if (trimmedExperienceLevel.length > 120) {
      nextErrors.experienceLevel = invalidLengthMessage;
    }

    if (!trimmedCurrentTools) {
      nextErrors.currentTools = requiredFieldMessage;
    } else if (trimmedCurrentTools.length > 300) {
      nextErrors.currentTools = invalidLengthMessage;
    }

    if (!trimmedFreeformResponse) {
      nextErrors.freeformResponse = requiredFieldMessage;
    } else if (trimmedFreeformResponse.length > 4000) {
      nextErrors.freeformResponse = invalidLengthMessage;
    }

    setWaitlistFormErrors(nextErrors);

    return {
      isValid: Object.keys(nextErrors).length === 0,
      trimmedEmail,
      trimmedExperienceLevel,
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

    const validation = validateWaitlistForm();
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
          experienceLevel: validation.trimmedExperienceLevel,
          currentTools: validation.trimmedCurrentTools,
          freeformResponse: validation.trimmedFreeformResponse,
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
          "Thanks for your interest in Wippa! We’ll reach out when your beta access is ready.",
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
              Designing your own needlepoint patterns just got easier
              {/* <span className={styles.accentWord}>  needlepoint patterns </span> */}
              {/* just got easier */}
              <span> </span>
            </h1>
            <p className={styles.heroBody} style={marketingTypographyStyles.bodyLg}>
            A better way to create, refine, and finish your designs,
            so every pattern starts as a work in progress and ends exactly how you want it.
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
                {/* {!showResumeCta ? <ButtonIcon icon="/icons/lucide/arrow-right.svg" /> : null} */}
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
                    src="/ui/editor-dachsund-color-tab.png"
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

        <section className={styles.buildingBlocksSection} aria-labelledby="building-blocks-heading">
          <div className={styles.buildingBlocksIntro}>
            <div>
              <p className={styles.sectionKicker} style={marketingTypographyStyles.eyebrow}>
                Design building blocks
              </p>
              <h2
                id="building-blocks-heading"
                className={styles.sectionTitle}
                style={marketingTypographyStyles.sectionTitle}
              >
                Build with text, icons, graphics, and frames that convert cleanly to stitches.
              </h2>
            </div>
            <p className={styles.sectionBody} style={marketingTypographyStyles.body}>
              The editor comes stocked with ready-to-use ingredients, so you can compose,
              customize, and finish a pattern without bouncing between tools.
            </p>
          </div>

          <div className={styles.buildingBlocksLayout}>
            <article className={styles.buildingBlocksPreviewCard}>
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
            </article>

            <div className={styles.buildingBlocksPanelGrid}>
              {buildingBlockPanels.map((panel) => (
                <article
                  key={panel.title}
                  className={[styles.buildingBlocksPanel, styles[panel.className]].join(" ")}
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
          <div className={styles.bentoIntro}>
            <div>
              {/* <p className={styles.sectionKicker} style={marketingTypographyStyles.eyebrow}>In The Details</p> */}
              <h2
                id="feature-detail-heading"
                className={styles.sectionTitle}
                style={marketingTypographyStyles.sectionTitle}
              >
                Creative tools built 
                <span className={styles.sectionTitleEmphasis}> specifically </span>
                for stitched canvases
              </h2>
            </div>
            {/* <p className={styles.sectionBody} style={marketingTypographyStyles.body}>
              A more detailed look at the product experience: expressive tools, clearer previews,
              and export moments that feel as finished as the design itself.
            </p> */}
          </div>

          <div className={styles.bentoRows}>
            <div className={[styles.bentoGrid, styles.bentoGridTop].join(" ")}>
              <article className={[styles.bentoCard, styles.bentoCardPrimary, styles.bentoCardWrappedStack].join(" ")}>
                <div className={styles.bentoCopy}>
                  <h3 className={styles.bentoTitle} style={marketingTypographyStyles.featureTitle}>
                    Flexible editing tools
                  </h3>
                  <p className={styles.bentoBody} style={marketingTypographyStyles.bodySm}>
                Select, move, duplicate, erase, and refine designs with tools built for fast, intuitive editing.                      </p>
                </div>
                <div className={styles.bentoVisualFrame} aria-hidden="true">
                  <div className={[styles.bentoVisualAsset, styles.bentoVisualPrimary].join(" ")}>
                    <Image
                      src="/ui/copy-tool-new.png"
                      alt=""
                      width={1600}
                      height={1000}
                      className={styles.bentoVisualImage}
                    />
                  </div>
                </div>
              </article>

              <article className={[styles.bentoCard, styles.bentoCardSecondary].join(" ")}>
                <div className={styles.bentoCopy}>
                  <h3 className={styles.bentoTitle} style={marketingTypographyStyles.featureTitle}>
                    Turn any image into a pattern
                  </h3>
                  <p className={styles.bentoBody} style={marketingTypographyStyles.bodySm}>
                    Upload a photo, choose your color count and smoothing — get a stitch-ready pattern in seconds.
                  </p>
                </div>
                <div className={styles.bentoVisualFrame} aria-hidden="true">
                  <div className={[styles.bentoVisualAsset, styles.bentoVisualSecondary].join(" ")}>
                    <Image
                      src="/ui/convert-pattern-line.png"
                      alt=""
                      width={1600}
                      height={1000}
                      className={styles.bentoVisualImage}
                    />
                  </div>
                </div>
              </article>
            </div>

            <div className={[styles.bentoGrid, styles.bentoGridBottom].join(" ")}>
              <article className={[styles.bentoCard, styles.bentoCardTertiary, styles.bentoCardImageFirst].join(" ")}>
                <div className={styles.bentoVisualFrame} aria-hidden="true">
                  <div className={[styles.bentoVisualAsset, styles.bentoVisualTertiary].join(" ")}>
                    <Image
                      src="/ui/custom-palettes-simple.png"
                      alt=""
                      width={1200}
                      height={1400}
                      // className={styles.bentoVisualImage}
                    />
                  </div>
                </div>
                <div className={styles.bentoCopy}>
                  <h3 className={styles.bentoTitle} style={marketingTypographyStyles.featureTitle}>
                  Custom palettes
                  </h3>
                  <p className={styles.bentoBody} style={marketingTypographyStyles.bodySm}>
                    Build palettes from your own thread inventory or favorite shades 
                    and reuse them across projects.
                  </p>
                </div>
              </article>

              <article className={[styles.bentoCard, styles.bentoCardQuaternary].join(" ")}>
                <div className={styles.bentoSplitLayout}>
                  <div className={[styles.bentoCopy, styles.bentoSplitCopy].join(" ")}>
                    <h3 className={styles.bentoTitleStacked} style={marketingTypographyStyles.featureTitle}>
                      Built-in graphics library
                    </h3>
                    <p className={styles.bentoBodyStacked} style={marketingTypographyStyles.bodySm}>
                      Drop in icons or frames or upload your own elements to add to your pattern without breaking your flow.
                    </p>
                  </div>
                  <div className={styles.bentoOverlayVisual} aria-hidden="true">
                    <div className={[styles.bentoVisualAsset, styles.bentoVisualQuaternaryBack].join(" ")}>
                      <Image 
                      src="/ui/canvas-wide.png"
                      alt=""
                      width={1200}
                      height={1400}
                      className={styles.bentoPlaceholderBack} 
                    />
                    </div>
                    <div className={[styles.bentoVisualAsset, styles.bentoVisualQuaternaryFront].join(" ")}>
                      <Image 
                      src="/ui/canvas-lemon.png"
                      alt=""
                      width={1200}
                      height={1400}
                      className={styles.bentoPlaceholderFront} 
                      />
                    </div>
                  </div>
                </div>
              </article>
            </div>

               <div className={[styles.bentoGrid, styles.bentoGridTop, styles.bentoGridTopCompact].join(" ")}>
              <article className={[styles.bentoCard, styles.bentoCardPrimary, styles.bentoCardWrappedStack].join(" ")}>
                <div className={styles.bentoCopy}>
                  <h3 className={styles.bentoTitle} style={marketingTypographyStyles.featureTitle}>
                    Convert text to stitches
                  </h3>
                  <p className={styles.bentoBody} style={marketingTypographyStyles.bodySm}>
                    Insert text and choose from dozens of fonts to instantly convert to pattern stitches.
                  </p>
                </div>
                <div className={styles.bentoStackedVisualFrame} aria-hidden="true">
                  <div className={[styles.bentoOverlayVisual, styles.bentoOverlayVisualCompact].join(" ")}>
                    <div
                      className={[
                        styles.bentoVisualAsset,
                        styles.bentoVisualQuaternaryBack,
                        styles.bentoVisualCompactBack,
                      ].join(" ")}
                    >
                      <Image
                        src="/ui/canvas-text-pink.png"
                        alt=""
                        width={1200}
                        height={1400}
                        className={styles.bentoPlaceholderBack}
                      />
                    </div>
                    <div
                      className={[
                        styles.bentoVisualAsset,
                        styles.bentoVisualQuaternaryFront,
                        styles.bentoVisualCompactFront,
                      ].join(" ")}
                    >
                      <Image
                        src="/ui/text-settings-pink.png"
                        alt=""
                        width={1200}
                        height={1400}
                        className={styles.bentoPlaceholderFront}
                      />
                    </div>
                  </div>
                  {/* <div className={[styles.bentoVisualAsset, styles.bentoVisualPrimary].join(" ")}>
                    <Image
                      src="/ui/copy-tool-new.png"
                      alt=""
                      width={1600}
                      height={1000}
                      className={styles.bentoVisualImage}
                    />
                  </div> */}

                  
                </div>
              </article>

              <article className={[styles.bentoCard, styles.bentoCardSecondary, styles.bentoCardRightStack].join(" ")}>
                <div className={styles.bentoCopy}>
                  <h3 className={styles.bentoTitle} style={marketingTypographyStyles.featureTitle}>
                    Edit design colors with ease
                  </h3>
                  <p className={styles.bentoBody} style={marketingTypographyStyles.bodySm}>
                    See every color in your design with stitch counts, and merge similar shades or bulk delete shades with low usage.
                  </p>
                </div>
                <div className={styles.bentoStackedVisualFrame} aria-hidden="true">
                  <div className={[styles.bentoOverlayVisual, styles.bentoOverlayVisualRightStack].join(" ")}>
                    <div
                      className={[
                        styles.bentoVisualAsset,
                        styles.bentoVisualQuaternaryBack,
                        styles.bentoVisualRightStackBack,
                      ].join(" ")}
                    >
                      <Image
                        src="/ui/design-colors-list.png"
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
                        styles.bentoVisualRightStackFront,
                      ].join(" ")}
                    >
                      <Image
                        src="/ui/merge-selection-bar.png"
                        alt=""
                        width={1600}
                        height={1000}
                        // className={styles.bentoPlaceholderWideFront}
                      />
                    </div>
                  </div>
                </div>
              </article>
            </div>


          </div>
        </section>

        <section className={styles.footerSection} id="begin">
          <div className={styles.footerInner}>
            <div className={styles.footerContent}>
              <div className={styles.footerCopy}>
                <p className={styles.footerMeta} style={marketingTypographyStyles.eyebrow}>Waitlist</p>
                <h2 className={styles.footerTitle}  style={marketingTypographyStyles.footerTitle} >
                  Be one of the first to <span className={styles.footerTitleEmphasis}>join the community.</span> 
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
                    {showResumeCta ? "View my designs" : "Get early access"}
                    {/* {!showResumeCta ? <ButtonIcon icon="/icons/lucide/arrow-right.svg" /> : null} */}
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
        title="Join the Waitlist"
        description={
          <div className={styles.waitlistModalCopy}>
            <p style={marketingTypographyStyles.body}>{modalDescription}</p>
            {!showResumeCta ? (
              <form
                id="waitlist-application-form"
                className={styles.waitlistModalForm}
                onSubmit={handleWaitlistSubmit}
                noValidate
              >
                <Field
                  label={
                    <span
                      className={waitlistFormErrors.email ? styles.errorText : undefined}
                      style={typographyStyles.p1}
                    >
                      Email
                    </span>
                  }
                  hint={
                    waitlistFormErrors.email ? (
                      <span className={styles.fieldError}>{waitlistFormErrors.email}</span>
                    ) : undefined
                  }
                >
                  <FieldInput
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.currentTarget.value);
                      clearWaitlistFieldError("email");
                    }}
                    placeholder="you@example.com"
                    aria-invalid={waitlistFormErrors.email ? "true" : undefined}
                    className={waitlistFormErrors.email ? styles.invalidInput : undefined}
                    style={typographyStyles.p1}
                    required
                  />
                </Field>
                <Field
                  label={
                    <span
                      className={waitlistFormErrors.experienceLevel ? styles.errorText : undefined}
                      style={typographyStyles.p1}
                    >
                      Do you currently create your own needlepoint patterns?
                    </span>
                  }
                  hint={
                    waitlistFormErrors.experienceLevel ? (
                      <span className={styles.fieldError}>
                        {waitlistFormErrors.experienceLevel}
                      </span>
                    ) : undefined
                  }
                >
                  <FieldSelect
                    value={experienceLevel}
                    onChange={(event) => {
                      setExperienceLevel(
                        event.currentTarget.value as (typeof experienceLevelOptions)[number],
                      );
                      clearWaitlistFieldError("experienceLevel");
                    }}
                    aria-invalid={waitlistFormErrors.experienceLevel ? "true" : undefined}
                    className={waitlistFormErrors.experienceLevel ? styles.invalidInput : undefined}
                    style={typographyStyles.p1}
                  >
                    {experienceLevelOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </FieldSelect>
                </Field>
                <Field
                  label={
                    <span
                      className={waitlistFormErrors.currentTools ? styles.errorText : undefined}
                      style={typographyStyles.p1}
                    >
                      What tools do you currently use?
                    </span>
                  }
                  hint={
                    waitlistFormErrors.currentTools ? (
                      <span className={styles.fieldError}>{waitlistFormErrors.currentTools}</span>
                    ) : undefined
                  }
                >
                  <FieldInput
                    type="text"
                    value={currentTools}
                    onChange={(event) => {
                      setCurrentTools(event.currentTarget.value);
                      clearWaitlistFieldError("currentTools");
                    }}
                    placeholder="Photoshop, Procreate, graph paper, stitch charts..."
                    aria-invalid={waitlistFormErrors.currentTools ? "true" : undefined}
                    className={waitlistFormErrors.currentTools ? styles.invalidInput : undefined}
                    style={typographyStyles.p1}
                    required
                  />
                </Field>
                <Field
                  label={
                    <span
                      className={waitlistFormErrors.freeformResponse ? styles.errorText : undefined}
                      style={typographyStyles.p1}
                    >
                      What are you hoping to use Wippa for?
                    </span>
                  }
                  hint={
                    waitlistFormErrors.freeformResponse ? (
                      <span className={styles.fieldError}>
                        {waitlistFormErrors.freeformResponse}
                      </span>
                    ) : undefined
                  }
                >
                  <textarea
                    value={freeformResponse}
                    onChange={(event) => {
                      setFreeformResponse(event.currentTarget.value);
                      clearWaitlistFieldError("freeformResponse");
                    }}
                    placeholder="Tell us what you want to design, refine, or speed up."
                    className={[
                      styles.waitlistTextarea,
                      waitlistFormErrors.freeformResponse ? styles.invalidInput : null,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={typographyStyles.p1}
                    rows={5}
                    aria-invalid={waitlistFormErrors.freeformResponse ? "true" : undefined}
                    required
                  />
                </Field>
              </form>
            ) : null}
          </div>
        }
        dismissLabel={showResumeCta ? "Close" : "Nevermind"}
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
        closeOnBackdropClick
        confirmDisabled={isSubmittingWaitlist}
        showCloseButton
      />
      <Modal
        isOpen={waitlistStatus !== null}
        title={waitlistStatus?.title ?? ""}
        description={waitlistStatus?.description ?? ""}
        dismissLabel="Close"
        confirmLabel={showResumeCta ? "Open library" : "Okay"}
        onDismiss={() => setWaitlistStatus(null)}
        onConfirm={() => {
          if (showResumeCta) {
            setWaitlistStatus(null);
            router.push("/library");
            return;
          }

          setWaitlistStatus(null);
        }}
        onClose={() => setWaitlistStatus(null)}
        tone={waitlistStatusModalTone}
        confirmVariant="primary"
        closeOnBackdropClick
        showCloseButton
      />
    </main>
  );
}
