import {
  ClerkDegraded,
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  SignIn,
} from "@clerk/nextjs";

const DEFAULT_REDIRECT_URL = "/";

function normalizeRedirectUrl(value: string | string[] | undefined): string {
  if (typeof value !== "string" || value.length === 0) {
    return DEFAULT_REDIRECT_URL;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT_URL;
  }

  return value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    redirect_url?: string | string[];
  }>;
}) {
  const { redirect_url: redirectUrlParam } = await searchParams;
  const redirectUrl = normalizeRedirectUrl(redirectUrlParam);

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "70vh", padding: 24 }}>
      <ClerkLoading>
        <StatusCard
          title="Loading sign in"
          description="The authentication UI is still loading."
        />
      </ClerkLoading>

      <ClerkLoaded>
        <div style={{ display: "grid", gap: 16, justifyItems: "center" }}>
          <ClerkDegraded>
            <StatusCard
              title="Authentication is degraded"
              description="Clerk loaded in a degraded state. Sign in may be temporarily unavailable."
            />
          </ClerkDegraded>

          <SignIn
            path="/sign-in"
            routing="path"
            fallbackRedirectUrl={redirectUrl}
            forceRedirectUrl={redirectUrl}
          />
        </div>
      </ClerkLoaded>

      <ClerkFailed>
        <StatusCard
          title="Authentication failed to load"
          description="Clerk did not initialize on this page. This usually means the production Clerk frontend script or domain is failing before the sign-in UI can mount."
          detail={`redirect_url=${redirectUrl}`}
        />
      </ClerkFailed>
    </div>
  );
}

function StatusCard({
  title,
  description,
  detail,
}: {
  title: string;
  description: string;
  detail?: string;
}) {
  return (
    <section
      style={{
        width: "min(520px, 100%)",
        borderRadius: 18,
        border: "1px solid rgba(31, 26, 23, 0.12)",
        background: "rgba(255, 255, 255, 0.92)",
        boxShadow: "0 18px 40px rgba(31, 26, 23, 0.08)",
        padding: 20,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.15 }}>{title}</h1>
      <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6 }}>
        {description}
      </p>
      {detail ? (
        <pre
          style={{
            margin: "14px 0 0",
            padding: 12,
            borderRadius: 12,
            background: "#1f1a17",
            color: "#f8f4ec",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {detail}
        </pre>
      ) : null}
    </section>
  );
}
