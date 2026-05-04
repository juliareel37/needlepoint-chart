import Link from "next/link";

const pageStyle = {
  minHeight: "100%",
  display: "grid",
  placeItems: "center",
  padding: "32px 20px",
  background:
    "linear-gradient(180deg, color-mix(in srgb, var(--surface-primary) 94%, white 6%) 0%, var(--surface-primary) 100%)",
};

const cardStyle = {
  width: "min(560px, 100%)",
  display: "grid",
  gap: 16,
  padding: 24,
  borderRadius: 20,
  border: "1px solid var(--ui-border-reg)",
  background: "color-mix(in srgb, var(--surface-primary) 88%, white 12%)",
  boxShadow: "0 18px 48px rgba(15, 23, 42, 0.08)",
};

const eyebrowStyle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--text-secondary)",
};

const headingStyle = {
  fontSize: "clamp(2rem, 5vw, 3.25rem)",
  lineHeight: 0.95,
  fontWeight: 700,
  letterSpacing: "-0.04em",
  color: "var(--text-primary)",
};

const bodyStyle = {
  fontSize: 16,
  lineHeight: 1.6,
  color: "var(--text-secondary)",
  maxWidth: "34ch",
};

const linksStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 12,
};

const linkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 40,
  padding: "0 14px",
  borderRadius: 999,
  border: "1px solid var(--ui-border-reg)",
  color: "var(--text-primary)",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
};
export default function Page() {
  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Landing page placeholder</p>
        <h1 style={headingStyle}>Root page loaded.</h1>
        <p style={bodyStyle}>
          This is temporary wiring for the future landing page. If you can see
          this, the `/` route is rendering correctly.
        </p>
        <div style={linksStyle}>
          <Link href="/editor" style={linkStyle}>
            Open editor
          </Link>
          <Link href="/library" style={linkStyle}>
            Open library
          </Link>
        </div>
      </section>
    </main>
  );
}


