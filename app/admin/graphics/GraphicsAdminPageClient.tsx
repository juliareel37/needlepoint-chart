"use client";

import { useEffect, useMemo, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { Button, FieldInput, Notification, Panel } from "@/components/design-system";
import type { ShapeIconLibraryItem } from "@/components/editor-v2/features/workspace/shell/panel-pages/iconLibrary";
import styles from "./page.module.css";

type LoadState = "idle" | "loading" | "ready" | "error";

export function GraphicsAdminPageClient({
  currentAdminEmail,
}: {
  currentAdminEmail: string | null;
}) {
  const [icons, setIcons] = useState<ShapeIconLibraryItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [pendingIconIds, setPendingIconIds] = useState<Set<string>>(() => new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadIcons() {
      setLoadState("loading");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/editor-v2/icon-library", {
          method: "GET",
          credentials: "same-origin",
        });
        const body = (await response.json().catch(() => null)) as
          | { icons?: ShapeIconLibraryItem[]; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(body?.error ?? "Couldn't load graphics.");
        }

        if (!cancelled) {
          setIcons(Array.isArray(body?.icons) ? body.icons : []);
          setLoadState("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setLoadState("error");
          setErrorMessage(error instanceof Error ? error.message : "Couldn't load graphics.");
        }
      }
    }

    void loadIcons();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleIcons = useMemo(() => {
    return icons.filter((icon) => {
      if (featuredOnly && !icon.isFeatured) {
        return false;
      }

      if (!normalizedSearchQuery) {
        return true;
      }

      if (icon.name.toLowerCase().includes(normalizedSearchQuery)) {
        return true;
      }

      if (icon.category.toLowerCase().includes(normalizedSearchQuery)) {
        return true;
      }

      return icon.searchKeywords.some((keyword) => keyword.includes(normalizedSearchQuery));
    });
  }, [featuredOnly, icons, normalizedSearchQuery]);

  const featuredCount = useMemo(
    () => icons.filter((icon) => icon.isFeatured).length,
    [icons],
  );

  async function handleToggleFeatured(iconId: string, featured: boolean) {
    setPendingIconIds((current) => new Set(current).add(iconId));
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/featured-graphics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ iconId, featured }),
      });
      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || body?.ok !== true) {
        throw new Error(body?.error ?? "Couldn't update featured graphic.");
      }

      setIcons((current) =>
        current.map((icon) => (icon.id === iconId ? { ...icon, isFeatured: featured } : icon)),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Couldn't update featured graphic.",
      );
    } finally {
      setPendingIconIds((current) => {
        const next = new Set(current);
        next.delete(iconId);
        return next;
      });
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Panel
          title="Featured Graphics"
          description="Tag graphics that should show up in the shared featured library."
        >
          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <p className={styles.metaLabel} style={typographyStyles.s}>Signed in as</p>
              <p className={styles.metaValue} style={typographyStyles.p2}>
                {currentAdminEmail ?? "Unknown admin"}
              </p>
            </div>
            <div className={styles.metaCard}>
              <p className={styles.metaLabel} style={typographyStyles.s}>Featured graphics</p>
              <p className={styles.metaValue} style={typographyStyles.p2}>
                {featuredCount} of {icons.length}
              </p>
            </div>
          </div>
        </Panel>

        {errorMessage ? (
          <Notification
            tone="destructive"
            title="Update failed"
            description={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            neutralSurface
          />
        ) : null}

        <Panel
          title="Graphic Library"
          description="Search the icon library and toggle featured status."
        >
          <div className={styles.controls}>
            <FieldInput
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search graphics"
              aria-label="Search graphics"
              className={styles.searchInput}
            />
            <Button
              type="button"
              variant={featuredOnly ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFeaturedOnly((current) => !current)}
            >
              {featuredOnly ? "Showing featured" : "Filter featured"}
            </Button>
          </div>

          {loadState === "loading" || loadState === "idle" ? (
            <p style={typographyStyles.p2}>Loading graphics…</p>
          ) : null}

          {loadState === "error" ? (
            <p style={typographyStyles.p2}>Couldn&apos;t load the graphic library.</p>
          ) : null}

          {loadState === "ready" ? (
            <div className={styles.grid}>
              {visibleIcons.map((icon) => {
                const pending = pendingIconIds.has(icon.id);

                return (
                  <article key={icon.id} className={styles.card}>
                    <div className={styles.previewWrap}>
                      <img
                        src={icon.src}
                        alt=""
                        width={72}
                        height={72}
                        className={styles.preview}
                      />
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle} style={typographyStyles.h5}>
                          {icon.name}
                        </h3>
                        <span
                          className={icon.isFeatured ? styles.featuredBadge : styles.defaultBadge}
                          style={typographyStyles.s}
                        >
                          {icon.isFeatured ? "Featured" : "Standard"}
                        </span>
                      </div>
                      <p className={styles.cardMeta} style={typographyStyles.p2}>
                        {icon.category}
                      </p>
                      <p className={styles.cardId} style={typographyStyles.s}>
                        {icon.id}
                      </p>
                      <div className={styles.cardActions}>
                        <Button
                          type="button"
                          variant={icon.isFeatured ? "secondary" : "primary"}
                          size="sm"
                          disabled={pending}
                          onClick={() => void handleToggleFeatured(icon.id, !icon.isFeatured)}
                        >
                          {pending
                            ? "Saving..."
                            : icon.isFeatured
                              ? "Remove from featured"
                              : "Mark featured"}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {loadState === "ready" && visibleIcons.length === 0 ? (
            <p style={typographyStyles.p2}>No graphics matched that filter.</p>
          ) : null}
        </Panel>
      </div>
    </main>
  );
}
