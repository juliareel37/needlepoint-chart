"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { marketingTypographyStyles, typographyStyles } from "@/app/design-system/typography";
import { Button, ButtonIcon } from "@/components/design-system";
import styles from "./page.module.css";

const heroHighlights = [
  {
    kicker: "Technical",
    title: "Custom Grid Math",
    body:
      "Adjust gauge and count with architectural precision. Aida, Evenweave, and Linen layouts all stay aligned.",
  },
  {
    kicker: "Material",
    title: "Thread-Accurate Color",
    body:
      "DMC, Anchor, and Weeks Dye Works palettes are mapped to clear, usable on-screen hues.",
  },
] as const;

const featureCards = [
  {
    index: "01",
    label: "Tools",
    title: "Pixel-perfect placement.",
    body:
      "Brush, fill, line, mirror, and symmetry tools that snap to the grid. Every action is reversible so your draft stays untouched.",
  },
  {
    index: "02",
    label: "Palette",
    title: "Limit colors, not creativity.",
    body:
      "Lock palettes to physical thread inventories. Wippa warns you when you reach for a hue you do not own.",
  },
  {
    index: "03",
    label: "Export",
    title: "Charts ready for the hoop.",
    body:
      "Export print-ready charts with symbol overlays, color keys, and skein counts calibrated to your fabric count.",
  },
] as const;

export default function Page() {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero} id="canvas">
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow} style={marketingTypographyStyles.eyebrow}>
              <span className={styles.eyebrowDot} />
              W.I.P. • Version 2.4
            </div>
            <h1 className={styles.heroTitle} style={marketingTypographyStyles.display}>
              every <span className={styles.accentWord}>work</span> in progress,
              <br /> in one place.
            </h1>
            <p className={styles.heroBody} style={marketingTypographyStyles.bodyLg}>
              A systematic canvas for modern needlepoint and cross-stitch designers.
              Map your vision on a high-fidelity drafting grid built for thread-accurate
              palettes and effortless charting.
            </p>
            <div className={styles.heroActions}>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className={styles.primaryCta}
                onClick={() => router.push("/editor")}
              >
                <span className={styles.ctaLabel}>Start a New Pattern</span>
                <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
              </Button>
              <Link href="/library" className={styles.resumeCard}>
                <span className={styles.resumeLabel} style={marketingTypographyStyles.eyebrow}>Resume wip</span>
                <span className={styles.resumeTitle} style={typographyStyles.p2}>Meadow_Study_IV.wip</span>
              </Link>
            </div>
            <div className={styles.heroFeatureGrid}>
              {heroHighlights.map((item) => (
                <div key={item.title} className={styles.heroFeature}>
                  <p className={styles.heroFeatureKicker} style={marketingTypographyStyles.eyebrow}>{item.kicker}</p>
                  <h2 className={styles.heroFeatureTitle} style={marketingTypographyStyles.titleSm}>{item.title}</h2>
                  <p className={styles.heroFeatureBody} style={marketingTypographyStyles.bodySm}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.demoFrame} aria-label="Editor demo placeholder">
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
            {/* <p className={styles.demoCaption} style={marketingTypographyStyles.eyebrow}>
              Looped editor demo coming soon
            </p> */}
          </div>
        </section>

        <div className={styles.sectionDivider} aria-hidden="true" />

        <section className={styles.features} id="features">
            <div className={styles.featuresIntro}>
            <div>
              <p className={styles.sectionKicker} style={marketingTypographyStyles.eyebrow}>The Canvas</p>
              <h2 className={styles.sectionTitle} style={marketingTypographyStyles.sectionTitle}>
                Built for the way <span className={styles.sectionTitleEmphasis}>designers</span>{" "}
                actually draft.
              </h2>
            </div>
            <p className={styles.sectionBody} style={marketingTypographyStyles.body}>
              Wippa treats every needlepoint chart like a technical drawing:
              measured, ordered, and revisable. No drifting layers, no surprise
              pixel sizes.
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
                <p className={styles.footerMeta} style={marketingTypographyStyles.eyebrow}>Begin</p>
                <h2 className={styles.footerTitle}  style={marketingTypographyStyles.footerTitle} >
                  Your next pattern is one <span className={styles.footerTitleEmphasis}>grid square</span> away.
                </h2>
              </div>
              <div className={styles.footerCopy}>
                <p className={styles.footerBody} style={marketingTypographyStyles.body}>
                  Open the editor, choose a fabric count, and start placing stitches.
                  No account required to draft your first pattern.
                </p>
                <div className={styles.footerActions}>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className={styles.footerPrimary}
                    onClick={() => router.push("/editor")}
                  >
                    Launch Editor
                    <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary2"
                    size="lg"
                    className={styles.footerSecondary}
                    onClick={() => router.push("/library")}
                  >
                    Open My Library
                  </Button>
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
    </main>
  );
}
