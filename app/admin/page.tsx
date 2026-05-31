import Link from "next/link";
import { redirect } from "next/navigation";
import { typographyStyles } from "@/app/design-system/typography";
import { getAdminSessionAccess } from "@/lib/admin/server";

export const dynamic = "force-dynamic";

const adminLinks = [
  {
    href: "/admin/waitlist",
    title: "Waitlist",
    description: "Review applications and generate invite links.",
  },
  {
    href: "/admin/graphics",
    title: "Graphics",
    description: "Manage featured graphics in the shared library.",
  },
  {
    href: "/admin/design-system",
    title: "Design System",
    description: "Open the internal UI and token reference.",
  },
  {
    href: "/admin/landing",
    title: "Landing Page",
    description: "Preview the public landing page while signed in as an admin.",
  },
] as const;

export default async function AdminPage() {
  const { session, isAdmin } = await getAdminSessionAccess();

  if (!session.userId) {
    redirect("/sign-in?redirect_url=%2Fadmin");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <main style={{ minHeight: "calc(100dvh - var(--app-top-offset, 52px))", padding: 32 }}>
      <div style={{ width: "min(760px, 100%)", display: "grid", gap: 20 }}>
        <header style={{ display: "grid", gap: 6 }}>
          <h1 style={{ ...typographyStyles.h2, margin: 0 }}>Admin</h1>
          <p style={{ ...typographyStyles.p2, margin: 0, color: "var(--text-secondary)" }}>
            Signed in as {session.email ?? "unknown admin"}.
          </p>
        </header>

        <nav aria-label="Admin pages" style={{ display: "grid", gap: 10 }}>
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "grid",
                gap: 4,
                padding: "14px 16px",
                border: "1px solid var(--ui-border-reg)",
                borderRadius: 8,
                background: "var(--surface-card)",
                color: "var(--text-primary)",
                textDecoration: "none",
              }}
            >
              <strong style={typographyStyles.h5}>{link.title}</strong>
              <span style={{ ...typographyStyles.p2, color: "var(--text-secondary)" }}>
                {link.description}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
