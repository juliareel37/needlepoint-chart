"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { typographyStyles } from "@/app/design-system/typography";
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

const previewStitches = [
  { color: "moss", cells: [[8, 2], [7, 3], [8, 3], [9, 3], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [7, 5], [8, 5], [9, 5], [8, 6]] },
  { color: "lavender", cells: [[8, 5], [8, 6], [9, 6], [7, 7], [8, 7], [9, 7], [10, 7], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [7, 9], [8, 9], [9, 9], [8, 10]] },
  { color: "moss", cells: [[4, 10], [3, 11], [4, 11], [5, 11], [4, 12]] },
  { color: "midnight", cells: [[14, 8], [13, 9], [14, 9], [15, 9], [12, 10], [13, 10], [14, 10], [15, 10], [16, 10], [13, 11], [14, 11], [15, 11], [14, 12]] },
] as const;

const heroTitleStyle = {
  fontSize: "clamp(3rem, 6.8vw, 5.5rem)",
  lineHeight: 0.92,
  fontWeight: 700,
  letterSpacing: "-0.08em",
} as const;

const sectionHeroTitleStyle = {
  fontSize: "clamp(2.1rem, 4.1vw, 3.35rem)",
  lineHeight: 0.96,
  fontWeight: 700,
  letterSpacing: "-0.06em",
} as const;

export default function Page() {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero} id="canvas">
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow} style={typographyStyles.s}>
              <span className={styles.eyebrowDot} />
              W.I.P. • Version 2.4
            </div>
            <h1 className={styles.heroTitle} style={heroTitleStyle}>
              every <span className={styles.accentWord}>work</span> in progress,
              <br /> in one place.
            </h1>
            <p className={styles.heroBody} style={typographyStyles.p1}>
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
                <span className={styles.resumeLabel} style={typographyStyles.s}>Resume W.I.P.</span>
                <span className={styles.resumeTitle} style={typographyStyles.h4}>Meadow_Study_IV.wip</span>
              </Link>
            </div>
            <div className={styles.heroFeatureGrid}>
              {heroHighlights.map((item) => (
                <div key={item.title} className={styles.heroFeature}>
                  <p className={styles.heroFeatureKicker} style={typographyStyles.s}>{item.kicker}</p>
                  <h2 className={styles.heroFeatureTitle} style={typographyStyles.h3}>{item.title}</h2>
                  <p className={styles.heroFeatureBody} style={typographyStyles.p2}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.canvasFrame} aria-label="Needlepoint canvas preview">
            <div className={styles.canvasHeader}>
              <div className={styles.windowDots} aria-hidden="true">
                <span className={styles.dotLavender} />
                <span className={styles.dotMoss} />
                <span className={styles.dotMidnight} />
              </div>
              <p className={styles.canvasMeta} style={typographyStyles.s}>X: 142.00 // Y: 084.22 // Scale: 400%</p>
            </div>
            <div className={styles.canvasDivider} />
            <div className={styles.canvasGrid}>
              {previewStitches.flatMap((group) =>
                group.cells.map(([column, row], index) => (
                  <span
                    key={`${group.color}-${column}-${row}-${index}`}
                    className={[
                      styles.stitch,
                      group.color === "lavender"
                        ? styles.stitchLavender
                        : group.color === "moss"
                          ? styles.stitchMoss
                          : styles.stitchMidnight,
                    ].join(" ")}
                    style={{
                      gridColumn: `${column} / span 1`,
                      gridRow: `${row} / span 1`,
                    }}
                  />
                )),
              )}
            </div>
            <div className={styles.canvasFooter}>
              <div className={styles.paletteRow}>
                <span className={styles.swatch}>
                  <span className={[styles.swatchChip, styles.dotLavender].join(" ")} />
                  #553 Lavender
                </span>
                <span className={styles.swatch}>
                  <span className={[styles.swatchChip, styles.dotMoss].join(" ")} />
                  #844 Moss
                </span>
                <span className={styles.swatch}>
                  <span className={[styles.swatchChip, styles.dotMidnight].join(" ")} />
                  #939 Midnight
                </span>
              </div>
              <span className={styles.autosave}>Autosaved</span>
            </div>
          </div>
        </section>

        <div className={styles.sectionDivider} aria-hidden="true" />

        <section className={styles.features} id="features">
            <div className={styles.featuresIntro}>
            <div>
              <p className={styles.sectionKicker} style={typographyStyles.s}>The Canvas</p>
              <h2 className={styles.sectionTitle} style={sectionHeroTitleStyle}>
                Built for the way <span className={styles.sectionTitleEmphasis}>designers</span>{" "}
                actually draft.
              </h2>
            </div>
            <p className={styles.sectionBody} style={typographyStyles.p1}>
              Wippa treats every needlepoint chart like a technical drawing:
              measured, ordered, and revisable. No drifting layers, no surprise
              pixel sizes.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {featureCards.map((item) => (
              <article key={item.index} className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <span className={[styles.featureIndex, styles.featureIndexAccent].join(" ")} style={typographyStyles.s}>
                    {item.index}
                  </span>
                  <span className={styles.featureIndex} style={typographyStyles.s}>{item.label}</span>
                </div>
                <h3 className={styles.featureTitle} style={typographyStyles.h2}>{item.title}</h3>
                <p className={styles.featureBody} style={typographyStyles.p1}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.footerSection} id="begin">
          <div className={styles.footerInner}>
            <div className={styles.footerContent}>
              <div className={styles.footerCopy}>
                <p className={styles.footerMeta} style={typographyStyles.s}>Begin</p>
                <h2 className={styles.footerTitle} style={typographyStyles.h1}>
                  Your next pattern is one <span className={styles.footerTitleEmphasis}>grid square</span> away.
                </h2>
              </div>
              <div className={styles.footerCopy}>
                <p className={styles.footerBody} style={typographyStyles.p1}>
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
            <p className={styles.footerMeta} style={typographyStyles.s}>Wippa Studio • Est. MMXXVI</p>
            <p className={styles.footerMeta} style={typographyStyles.s}>V2.4 • Drafting on a precision canvas</p>
          </div>
        </section>
      </div>
    </main>
  );
}
