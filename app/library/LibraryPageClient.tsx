"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ButtonIcon, FieldInput } from "@/components/design-system";
import type { LibraryDesignRecord } from "@/lib/library/designs";
import styles from "./page.module.css";

const previewPalette = [
  "transparent",
  "#f1b9da",
  "#e5439f",
  "#b4a3ef",
  "#7d55e6",
  "#52239a",
] as const;

const basePreviewCells = [
  [4, 0, 3, 1, 1, 0, 2, 1, 0, 0, 5, 0],
  [3, 0, 3, 5, 5, 0, 0, 0, 2, 1, 0, 1],
  [0, 0, 0, 2, 0, 2, 0, 3, 0, 4, 0, 0],
  [4, 0, 0, 4, 2, 0, 0, 3, 0, 0, 4, 1],
  [0, 2, 4, 5, 0, 2, 0, 5, 0, 0, 2, 0],
  [4, 3, 2, 0, 2, 4, 0, 0, 0, 4, 0, 3],
  [0, 3, 0, 0, 5, 4, 0, 4, 0, 4, 1, 0],
  [0, 5, 0, 5, 4, 0, 0, 5, 0, 5, 0, 5],
  [2, 5, 0, 5, 2, 5, 1, 2, 3, 5, 5, 0],
  [0, 5, 0, 3, 1, 5, 1, 3, 1, 0, 5, 3],
  [0, 4, 5, 2, 0, 4, 0, 5, 2, 3, 0, 0],
  [1, 1, 0, 0, 0, 0, 3, 4, 1, 4, 3, 2],
] as const;

const LOADING_CARD_COUNT = 4;
const PAGE_SIZE = 12;

function getPreviewCells(offset: number) {
  return basePreviewCells.map((row, rowIndex) =>
    row.map((_, columnIndex) => {
      const sourceColumn = (columnIndex + offset + rowIndex) % row.length;
      return row[sourceColumn];
    }),
  );
}

async function fetchLibraryPage(offset: number) {
  const searchParams = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  const response = await fetch(`/api/editor-v2/designs?${searchParams.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  const body = (await response.json().catch(() => null)) as
    | {
        designs?: LibraryDesignRecord[];
        hasMore?: boolean;
        nextOffset?: number | null;
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Couldn't load more designs.");
  }

  return {
    designs: Array.isArray(body?.designs) ? body.designs : [],
    hasMore: body?.hasMore === true,
    nextOffset: typeof body?.nextOffset === "number" ? body.nextOffset : null,
  };
}

export function LibraryPageClient({
  initialDesigns,
  initialHasMore,
  initialNextOffset,
}: {
  initialDesigns: LibraryDesignRecord[];
  initialHasMore: boolean;
  initialNextOffset: number | null;
}) {
  const [designs, setDesigns] = useState(initialDesigns);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadingCards = useMemo(
    () => Array.from({ length: LOADING_CARD_COUNT }, (_, index) => index),
    [],
  );

  useEffect(() => {
    if (!hasMore || loadingMore || loadMoreError) {
      return;
    }

    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || loadingMore) {
          return;
        }

        setLoadingMore(true);
        setLoadMoreError(null);

        void fetchLibraryPage(nextOffset ?? designs.length)
          .then((result) => {
            setDesigns((existing) => [
              ...existing,
              ...result.designs.filter(
                (candidate) => !existing.some((record) => record.id === candidate.id),
              ),
            ]);
            setHasMore(result.hasMore);
            setNextOffset(result.nextOffset);
          })
          .catch((error) => {
            setLoadMoreError(
              error instanceof Error ? error.message : "Couldn't load more designs.",
            );
          })
          .finally(() => {
            setLoadingMore(false);
          });
      },
      {
        rootMargin: "320px 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [designs.length, hasMore, loadMoreError, loadingMore, nextOffset]);

  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <h1 className={styles.title}>My Designs</h1>
          </div>

          <div className={styles.actions}>
            {/* <label className={styles.searchField}>
              <span className={styles.searchIcon} aria-hidden="true" />
              <FieldInput
                type="search"
                name="search"
                placeholder="Search designs"
                aria-label="Search designs"
                className={styles.searchInput}
              />
            </label> */}

            {/* <Button type="button" variant="secondary" size="md">
              <ButtonIcon icon="/icons/lucide/folder-plus.svg" />
              
              New folder
            </Button> */}
            <Button type="button" variant="primary" size="md">
              <ButtonIcon icon="/icons/lucide/plus.svg" />
              New design
            </Button>
          </div>
        </header>

        {designs.length > 0 ? (
          <>
            <section className={styles.grid} aria-label="Saved designs">
              {designs.map((design, index) => (
                <Link
                  key={design.id}
                  href={`/editor/designs/${design.id}`}
                  className={styles.cardLink}
                >
                  <article className={styles.card}>
                    <div className={styles.thumbnail}>
                      <div className={styles.thumbnailFrame}>
                        {design.thumbnailUrl ? (
                          <img
                            src={design.thumbnailUrl}
                            alt=""
                            className={styles.thumbnailImage}
                          />
                        ) : (
                          <div className={styles.previewGrid} aria-hidden="true">
                            {getPreviewCells(index).flatMap((row, rowIndex) =>
                              row.map((cell, columnIndex) => (
                                <span
                                  key={`${design.id}-${rowIndex}-${columnIndex}`}
                                  className={styles.previewCell}
                                  style={{
                                    backgroundColor: previewPalette[cell],
                                  }}
                                />
                              )),
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.cardTopRow}>
                        <h2 className={styles.cardTitle}>{design.title}</h2>
                        {/* <span className={styles.cardMenuButton} aria-hidden="true">
                          <span className={styles.cardMenuDots} aria-hidden="true" />
                        </span> */}
                      </div>
                      <p className={styles.cardMeta}>
                        {design.gridWidth} × {design.gridHeight} cells
                        {typeof design.colorCount === "number"
                          ? ` • ${design.colorCount} colors`
                          : ""}
                      </p>
                      <p className={styles.cardTimestamp}>{design.updatedLabel}</p>
                    </div>
                  </article>
                </Link>
              ))}

              {loadingMore
                ? loadingCards.map((card) => (
                    <article
                      key={`loading-${card}`}
                      className={`${styles.card} ${styles.loadingCard}`}
                      aria-hidden="true"
                    >
                      <div className={styles.thumbnail}>
                        <div className={styles.thumbnailFrame}>
                          <div className={styles.loadingThumbnail}>
                            <span className="loading-spinner" aria-hidden="true" />
                          </div>
                        </div>
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.loadingLineShort} />
                        <div className={styles.loadingLineLong} />
                        <div className={styles.loadingLineMedium} />
                      </div>
                    </article>
                  ))
                : null}
            </section>

            {loadMoreError ? (
              <p className={styles.loadMoreError}>{loadMoreError}</p>
            ) : null}

            <div ref={sentinelRef} className={styles.scrollSentinel} aria-hidden="true" />
          </>
        ) : (
          <section className={styles.emptyState}>
            <h2 className={styles.emptyStateTitle}>No designs yet</h2>
            <p className={styles.emptyStateBody}>
              Your saved needlepoint designs will show up here once you create one.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
