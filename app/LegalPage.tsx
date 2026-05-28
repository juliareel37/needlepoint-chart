import Link from "next/link";
import type { LegalPageContent } from "./legalContent";
import styles from "./legal.module.css";

type LegalPageProps = {
  content: LegalPageContent;
};

export default function LegalPage({ content }: LegalPageProps) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          Back to Wippa
        </Link>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>Last updated {content.lastUpdated}</p>
          <h1 className={styles.title}>{content.title}</h1>
          <p className={styles.intro}>{content.intro}</p>
        </header>

        <div className={styles.content}>
          {content.sections.map((section) => (
            <section className={styles.section} key={section.title}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p className={styles.paragraph} key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Contact</h2>
            <p className={styles.paragraph}>{content.contact}</p>
          </section>
        </div>

        <footer className={styles.footer}>
          <p className={styles.paragraph}>Wippa Studio</p>
          <nav className={styles.footerLinks} aria-label="Legal">
            <Link href={content.alternatePolicy.href} className={styles.footerLink}>
              {content.alternatePolicy.label}
            </Link>
            <Link href="/" className={styles.footerLink}>
              Home
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
