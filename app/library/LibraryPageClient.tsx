"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  ButtonIcon,
  FieldInput,
  Modal,
  Notification,
  SegmentedControl,
  SingleSelectDropdown,
} from "@/components/design-system";
import {
  EditorV2SetupModal,
  type EditorV2DesignConfigNew,
} from "@/components/editor-v2/app/EditorV2SetupModal";
import {
  deleteSavedEditorV2Document,
  loadSavedEditorV2Document,
  saveEditorV2Document,
} from "@/components/editor-v2/app/editorV2ServerPersistence";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import type { LibraryDesignRecord } from "@/lib/library/designs";
import { buildLibraryStitchSnapshot } from "@/lib/library/stitchSnapshot";
import { StitchThumbnailCanvas } from "./StitchThumbnailCanvas";
import styles from "./page.module.css";

const LOADING_CARD_COUNT = 4;
const PAGE_SIZE = 12;
const cardMenuItems = [
  { id: "open", label: "Open", icon: "/icons/lucide/file.svg" },
  { id: "duplicate", label: "Duplicate", icon: "/icons/lucide/copy.svg" },
  { id: "delete", label: "Delete", icon: "/icons/lucide/trash.svg" },
] as const;

type CardMenuItem = (typeof cardMenuItems)[number];
type CardMenuAction = (typeof cardMenuItems)[number]["id"];
type LibraryViewMode = "grid" | "list";
type DeleteConfirmationState =
  | {
      kind: "single";
      design: LibraryDesignRecord;
    }
  | {
      kind: "bulk";
      designIds: string[];
    };
type LibrarySuccessNotification = {
  title: string;
  description?: string;
};
type PendingDeletion = {
  designIds: string[];
  previousDesigns: LibraryDesignRecord[];
  previousTotalCount: number;
};

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
        totalCount?: number;
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
    totalCount: typeof body?.totalCount === "number" ? body.totalCount : 0,
    hasMore: body?.hasMore === true,
    nextOffset: typeof body?.nextOffset === "number" ? body.nextOffset : null,
  };
}

export function LibraryPageClient({
  initialDesigns,
  initialTotalCount,
  initialHasMore,
  initialNextOffset,
}: {
  initialDesigns: LibraryDesignRecord[];
  initialTotalCount: number;
  initialHasMore: boolean;
  initialNextOffset: number | null;
}) {
  const router = useRouter();
  const [designs, setDesigns] = useState(initialDesigns);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [creatingDesign, setCreatingDesign] = useState(false);
  const [setupErrorMessage, setSetupErrorMessage] = useState<string | null>(null);
  const [draftWidth, setDraftWidth] = useState("120");
  const [draftHeight, setDraftHeight] = useState("120");
  const [draftSizingMode, setDraftSizingMode] = useState<"stitches" | "inches">(
    "inches",
  );
  const [draftWidthInches, setDraftWidthInches] = useState("8");
  const [draftHeightInches, setDraftHeightInches] = useState("8");
  const [draftMeshCount, setDraftMeshCount] = useState("10");
  const [cardActionError, setCardActionError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<LibraryViewMode>("grid");
  const [selectedDesignIds, setSelectedDesignIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmationState | null>(null);
  const [successNotification, setSuccessNotification] =
    useState<LibrarySuccessNotification | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const [pendingCardAction, setPendingCardAction] = useState<{
    designId: string;
    action: CardMenuAction;
  } | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pendingDeletionTimeoutRef = useRef<number | null>(null);
  const pendingDeletionRef = useRef<PendingDeletion | null>(null);

  const loadingCards = useMemo(
    () => Array.from({ length: LOADING_CARD_COUNT }, (_, index) => index),
    [],
  );
  const selectedDesignCount = selectedDesignIds.size;
  const allLoadedDesignsSelected =
    designs.length > 0 && selectedDesignCount === designs.length;

  useEffect(() => {
    pendingDeletionRef.current = pendingDeletion;
  }, [pendingDeletion]);

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
            setTotalCount(result.totalCount);
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

  useEffect(
    () => () => {
      if (pendingDeletionTimeoutRef.current !== null) {
        window.clearTimeout(pendingDeletionTimeoutRef.current);
      }
    },
    [],
  );

  async function handleCreateDesign(config: EditorV2DesignConfigNew) {
    setCreatingDesign(true);
    setSetupErrorMessage(null);

    try {
      const document = createNewDesignState(config.width, config.height, {
        projectId: config.draftId,
        sizingMode: config.sizingMode,
        meshCount: config.meshCount,
        widthInches: config.widthInches,
        heightInches: config.heightInches,
      }).document;
      const savedRecord = await saveEditorV2Document(document);
      setSetupModalOpen(false);
      router.push(`/editor/designs/${savedRecord.storageId}`);
    } catch (error) {
      setSetupErrorMessage(
        error instanceof Error ? error.message : "Couldn't create a new design.",
      );
    } finally {
      setCreatingDesign(false);
    }
  }

  async function handleCardMenuAction(action: string, design: LibraryDesignRecord) {
    const menuAction = action as CardMenuAction;
    setCardActionError(null);

    if (menuAction === "open") {
      router.push(`/editor/designs/${design.id}`);
      return;
    }

    if (menuAction === "delete") {
      setDeleteConfirmation({
        kind: "single",
        design,
      });
      return;
    }

    setPendingCardAction({ designId: design.id, action: menuAction });

    try {
      if (menuAction === "duplicate") {
        const loaded = await loadSavedEditorV2Document(design.id);
        const saved = await saveEditorV2Document(loaded.document);

        setDesigns((existing) => [
          {
            id: saved.storageId,
            title: saved.title,
            gridWidth: saved.gridWidth,
            gridHeight: saved.gridHeight,
            updatedAt: saved.updatedAt,
            updatedLabel: "Edited just now",
            colorCount: Object.keys(loaded.document.palette.colorsById).length,
            thumbnailUrl: loaded.document.trace?.thumbnailUrl ?? null,
            stitchSnapshot: buildLibraryStitchSnapshot({
              gridWidth: loaded.document.grid.width,
              gridHeight: loaded.document.grid.height,
              cells: loaded.document.grid.cells,
              colorsById: loaded.document.palette.colorsById,
            }),
          },
          ...existing,
        ]);
        setTotalCount((current) => current + 1);
        return;
      }

    } catch (error) {
      setCardActionError(
        error instanceof Error ? error.message : "Couldn't complete that action.",
      );
    } finally {
      setPendingCardAction((current) =>
        current?.designId === design.id ? null : current,
      );
    }
  }

  function handleDesignSelectionChange(designId: string, checked: boolean) {
    setSelectedDesignIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(designId);
      } else {
        next.delete(designId);
      }

      return next;
    });
  }

  function handleClearSelection() {
    setSelectedDesignIds(new Set<string>());
  }

  function handleSelectAllDesigns() {
    setSelectedDesignIds(new Set(designs.map((design) => design.id)));
  }

  function handleRequestDeleteSelectedDesigns() {
    if (selectedDesignIds.size === 0) {
      return;
    }

    setDeleteConfirmation({
      kind: "bulk",
      designIds: designs
        .filter((design) => selectedDesignIds.has(design.id))
        .map((design) => design.id),
    });
  }

  function clearPendingDeletionTimeout() {
    if (pendingDeletionTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(pendingDeletionTimeoutRef.current);
    pendingDeletionTimeoutRef.current = null;
  }

  function restoreDesignSnapshot(previousDesigns: LibraryDesignRecord[]) {
    setDesigns((current) => {
      const snapshotIds = new Set(previousDesigns.map((design) => design.id));
      const extras = current.filter((design) => !snapshotIds.has(design.id));
      return [...previousDesigns, ...extras];
    });
  }

  async function commitPendingDeletionToServer(nextPendingDeletion: PendingDeletion) {
    await Promise.all(
      nextPendingDeletion.designIds.map((designId) =>
        deleteSavedEditorV2Document(designId),
      ),
    );
  }

  async function flushPendingDeletion() {
    const currentPendingDeletion = pendingDeletionRef.current;

    if (!currentPendingDeletion) {
      return true;
    }

    clearPendingDeletionTimeout();

    try {
      await commitPendingDeletionToServer(currentPendingDeletion);
      setPendingDeletion(null);
      setSuccessNotification(null);
      return true;
    } catch (error) {
      restoreDesignSnapshot(currentPendingDeletion.previousDesigns);
      setTotalCount(currentPendingDeletion.previousTotalCount);
      setPendingDeletion(null);
      setSuccessNotification(null);
      setCardActionError(
        error instanceof Error ? error.message : "Couldn't delete design.",
      );
      return false;
    }
  }

  function schedulePendingDeletion(
    nextPendingDeletion: PendingDeletion,
    notification: LibrarySuccessNotification,
  ) {
    clearPendingDeletionTimeout();
    setPendingDeletion(nextPendingDeletion);
    setSuccessNotification(notification);
    pendingDeletionTimeoutRef.current = window.setTimeout(() => {
      const currentPendingDeletion = pendingDeletionRef.current;

      if (!currentPendingDeletion) {
        return;
      }

      void commitPendingDeletionToServer(currentPendingDeletion)
        .then(() => {
          setPendingDeletion(null);
          setSuccessNotification(null);
        })
        .catch((error) => {
          restoreDesignSnapshot(currentPendingDeletion.previousDesigns);
          setTotalCount(currentPendingDeletion.previousTotalCount);
          setPendingDeletion(null);
          setSuccessNotification(null);
          setCardActionError(
            error instanceof Error ? error.message : "Couldn't delete design.",
          );
        })
        .finally(() => {
          clearPendingDeletionTimeout();
        });
    }, 5000);
  }

  function handleUndoPendingDeletion() {
    const currentPendingDeletion = pendingDeletionRef.current;

    if (!currentPendingDeletion) {
      return;
    }

    clearPendingDeletionTimeout();
    restoreDesignSnapshot(currentPendingDeletion.previousDesigns);
    setTotalCount(currentPendingDeletion.previousTotalCount);
    setPendingDeletion(null);
    setSuccessNotification(null);
  }

  async function handleConfirmDelete() {
    if (!deleteConfirmation) {
      return;
    }

    setCardActionError(null);
    setBulkDeletePending(true);

    try {
      const flushedPendingDeletion = await flushPendingDeletion();

      if (!flushedPendingDeletion) {
        return;
      }

      if (deleteConfirmation.kind === "single") {
        const designId = deleteConfirmation.design.id;
        const designTitle = deleteConfirmation.design.title;
        const previousDesigns = designs;

        setDesigns((existing) => existing.filter((record) => record.id !== designId));
        setSelectedDesignIds((current) => {
          const next = new Set(current);
          next.delete(designId);
          return next;
        });
        schedulePendingDeletion(
          {
            designIds: [designId],
            previousDesigns,
            previousTotalCount: totalCount,
          },
          {
            title: "Design deleted",
            description: `"${designTitle}" was removed from your saved designs.`,
          },
        );
        setTotalCount((current) => Math.max(0, current - 1));
        setDeleteConfirmation(null);
        return;
      }

      const previousDesigns = designs;
      const deletedCount = deleteConfirmation.designIds.length;
      const idsToDelete = new Set(deleteConfirmation.designIds);
      setDesigns((existing) =>
        existing.filter((design) => !idsToDelete.has(design.id)),
      );
      setSelectedDesignIds(new Set<string>());
      schedulePendingDeletion(
        {
          designIds: [...deleteConfirmation.designIds],
          previousDesigns,
          previousTotalCount: totalCount,
        },
        {
          title:
            deletedCount === 1 ? "Deleted 1 design" : `Deleted ${deletedCount} designs`,
          description:
            deletedCount === 1
              ? "The selected design was removed from your saved designs."
              : "The selected designs were removed from your saved designs.",
        },
      );
      setTotalCount((current) =>
        Math.max(0, current - deleteConfirmation.designIds.length),
      );
      setDeleteConfirmation(null);
    } catch (error) {
      setCardActionError(
        error instanceof Error ? error.message : "Couldn't delete design.",
      );
    } finally {
      setBulkDeletePending(false);
    }
  }

  function renderCardMenuItemLabel(
    design: LibraryDesignRecord,
    item: CardMenuItem,
  ) {
    const isPending =
      pendingCardAction?.action === item.id &&
      pendingCardAction?.designId === design.id;

    return (
      <span
        className={[
          styles.cardMenuItemLabel,
          item.id === "delete" ? styles.cardMenuItemLabelDestructive : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isPending ? (
          <span className="loading-spinner" aria-hidden="true" />
        ) : (
          <ButtonIcon icon={item.icon} className={styles.cardMenuItemIcon} />
        )}
        <span>{item.label}</span>
      </span>
    );
  }

  function renderDesignMenu(design: LibraryDesignRecord) {
    return (
      <div className={styles.cardMenuAnchor}>
        <SingleSelectDropdown<CardMenuItem>
          ariaLabel={`Actions for ${design.title}`}
          items={[...cardMenuItems]}
          value=""
          placeholder="Actions"
          triggerLabel={<span className={styles.cardMenuDots}>⋮</span>}
          triggerVariant="ghost"
          showChevron={false}
          menuPortalToViewport
          menuPlacement="bottom-end"
          menuShowTrailingCheck={false}
          minWidth="auto"
          getItemValue={(item) => item.id}
          getItemLabel={(item) => renderCardMenuItemLabel(design, item)}
          getItemDisabled={() => pendingCardAction?.designId === design.id}
          onValueChange={(value) => {
            void handleCardMenuAction(value, design);
          }}
          wrapperClassName={styles.cardMenuWrapper}
          triggerClassName={styles.cardMenuTrigger}
          menuClassName={styles.cardMenuSurface}
          triggerStyle={{ minWidth: "32px", padding: "6px 8px" }}
        />
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <section
        className={[
          styles.content,
          selectedDesignCount > 0 ? styles.contentWithBulkBar : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
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
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => {
                setSetupErrorMessage(null);
                setSetupModalOpen(true);
              }}
            >
              <ButtonIcon icon="/icons/lucide/plus.svg" />
              New design
            </Button>
          </div>
        </header>

        <div className={styles.viewRow}>
          <div className={styles.viewSummary}>
            <span className={styles.viewSummaryLabel}>All Designs</span>
            <span className={styles.viewSummaryCount}>({totalCount})</span>
          </div>

          <SegmentedControl<LibraryViewMode>
            ariaLabel="Design library view"
            className={styles.viewToggle}
            itemClassName={styles.viewToggleItem}
            value={viewMode}
            onChange={setViewMode}
            options={[
              {
                value: "list",
                label: <ButtonIcon icon="/icons/lucide/list.svg" className={styles.viewToggleIcon} />,
              },
              {
                value: "grid",
                label: <ButtonIcon icon="/icons/lucide/layout-grid.svg" className={styles.viewToggleIcon} />,
              },
            ]}
          />
        </div>

        {designs.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <section className={styles.grid} aria-label="Saved designs">
                {designs.map((design) => {
                  const isSelected = selectedDesignIds.has(design.id);

                  return (
                    <article key={design.id} className={styles.card}>
                      <div className={styles.thumbnailShell}>
                        <Link
                          href={`/editor/designs/${design.id}`}
                          className={styles.cardLink}
                        >
                          <div className={styles.thumbnail}>
                            <StitchThumbnailCanvas
                              snapshot={design.stitchSnapshot}
                              className={styles.thumbnailCanvas}
                            />
                          </div>
                        </Link>

                        <label className={styles.cardCheckbox}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) => {
                              handleDesignSelectionChange(
                                design.id,
                                event.currentTarget.checked,
                              );
                            }}
                            className={styles.cardCheckboxInput}
                            aria-label={`Select ${design.title}`}
                          />
                          <span
                            className={styles.cardCheckboxIndicator}
                            aria-hidden="true"
                          />
                        </label>
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.cardTopRow}>
                          <Link
                            href={`/editor/designs/${design.id}`}
                            className={styles.cardTitleLink}
                          >
                            <h2 className={styles.cardTitle}>{design.title}</h2>
                          </Link>

                          {renderDesignMenu(design)}
                        </div>

                        <Link
                          href={`/editor/designs/${design.id}`}
                          className={styles.cardDetailsLink}
                        >
                          <p className={styles.cardMeta}>
                            {design.gridWidth} × {design.gridHeight} cells
                            {typeof design.colorCount === "number"
                              ? ` • ${design.colorCount} colors`
                              : ""}
                          </p>
                          <p className={styles.cardTimestamp}>{design.updatedLabel}</p>
                        </Link>
                      </div>
                    </article>
                  );
                })}

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
            ) : (
              <section className={styles.listView} aria-label="Saved designs list">
                <div className={styles.listHeader}>
                  <span className={styles.listHeaderName}>Name</span>
                  <span>Size</span>
                  <span>Colors</span>
                  <span>Last Edited</span>
                  <span className={styles.listHeaderActions} aria-hidden="true" />
                </div>

                <div className={styles.listBody}>
                  {designs.map((design) => (
                    <article key={design.id} className={styles.listRow}>
                      <Link
                        href={`/editor/designs/${design.id}`}
                        className={styles.listNameCell}
                      >
                        <span className={styles.listThumbnailFrame}>
                          <StitchThumbnailCanvas
                            snapshot={design.stitchSnapshot}
                            className={styles.listThumbnailCanvas}
                          />
                        </span>
                        <span className={styles.listTitle}>{design.title}</span>
                      </Link>

                      <Link
                        href={`/editor/designs/${design.id}`}
                        className={styles.listMetaCell}
                      >
                        {design.gridWidth} × {design.gridHeight} cells
                      </Link>
                      <Link
                        href={`/editor/designs/${design.id}`}
                        className={styles.listMetaCell}
                      >
                        {typeof design.colorCount === "number"
                          ? `${design.colorCount} colors`
                          : "—"}
                      </Link>
                      <Link
                        href={`/editor/designs/${design.id}`}
                        className={styles.listMetaCell}
                      >
                        {design.updatedLabel.replace(/^Edited /, "")}
                      </Link>

                      {renderDesignMenu(design)}
                    </article>
                  ))}

                  {loadingMore
                    ? loadingCards.map((card) => (
                        <article
                          key={`list-loading-${card}`}
                          className={`${styles.listRow} ${styles.loadingCard}`}
                          aria-hidden="true"
                        >
                          <div className={styles.listNameCell}>
                            <span className={styles.listThumbnailFrame}>
                              <span className={styles.loadingThumbnail}>
                                <span className="loading-spinner" aria-hidden="true" />
                              </span>
                            </span>
                            <div className={styles.listLoadingText}>
                              <div className={styles.loadingLineLong} />
                            </div>
                          </div>
                          <div className={styles.loadingLineMedium} />
                          <div className={styles.loadingLineShort} />
                          <div className={styles.loadingLineMedium} />
                          <div />
                        </article>
                      ))
                    : null}
                </div>
              </section>
            )}

            {loadMoreError || cardActionError ? (
              <p className={styles.loadMoreError}>{loadMoreError ?? cardActionError}</p>
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

      {setupModalOpen ? (
        <div className={styles.modalOverlay}>
          <EditorV2SetupModal
            canClose
            creatingDesign={creatingDesign}
            draftHeight={draftHeight}
            draftHeightInches={draftHeightInches}
            draftMeshCount={draftMeshCount}
            draftSizingMode={draftSizingMode}
            draftWidth={draftWidth}
            draftWidthInches={draftWidthInches}
            hasSavedDesignAccess
            mode="new-only"
            hasMoreSavedDocuments={false}
            onDismissSavedDocumentsError={() => {}}
            onDismissSetupError={() => setSetupErrorMessage(null)}
            onOpenSavedDocuments={() => {}}
            onLoadMoreSavedDocuments={() => {}}
            onSignIn={() => {}}
            onClose={() => setSetupModalOpen(false)}
            onCreateDesign={handleCreateDesign}
            onDraftHeightChange={setDraftHeight}
            onDraftHeightInchesChange={setDraftHeightInches}
            onDraftMeshCountChange={setDraftMeshCount}
            onDraftSizingModeChange={setDraftSizingMode}
            onDraftWidthChange={setDraftWidth}
            onDraftWidthInchesChange={setDraftWidthInches}
            onLoadSavedDesign={() => {}}
            savedDocuments={[]}
            savedDocumentsLoading={false}
            savedDocumentsLoadingMore={false}
            savedDocumentsErrorMessage={null}
            selectedStorageId=""
            setSelectedStorageId={() => {}}
            setupErrorMessage={setupErrorMessage}
          />
        </div>
      ) : null}

      <Modal
        isOpen={deleteConfirmation !== null}
        title={
          deleteConfirmation?.kind === "bulk"
            ? `Delete ${deleteConfirmation.designIds.length} design${
                deleteConfirmation.designIds.length === 1 ? "" : "s"
              }?`
            : "Delete this design?"
        }
        description={
          deleteConfirmation?.kind === "bulk"
            ? `This will permanently delete ${deleteConfirmation.designIds.length} selected design${
                deleteConfirmation.designIds.length === 1 ? "" : "s"
              } from your saved designs.`
            : "This will permanently delete the selected design from your saved designs."
        }
        tone="fail"
        dismissLabel="Cancel"
        confirmLabel={
          deleteConfirmation?.kind === "bulk"
            ? bulkDeletePending
              ? "Deleting..."
              : deleteConfirmation.designIds.length === 1
                ? "Delete design"
                : "Delete designs"
            : bulkDeletePending
              ? "Deleting..."
              : "Delete design"
        }
        confirmVariant="destructive"
        onDismiss={() => {
          if (bulkDeletePending) {
            return;
          }

          setDeleteConfirmation(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        confirmDisabled={bulkDeletePending}
        dismissDisabled={bulkDeletePending}
      />

      {successNotification ? (
        <div className={styles.notificationOverlayTop}>
          <div className={styles.notificationStack} data-auto-dismiss="true">
            <Notification
              tone="success"
              title={successNotification.title}
              description={successNotification.description}
              actionLabel="Undo"
              onAction={handleUndoPendingDeletion}
            />
          </div>
        </div>
      ) : null}

      {selectedDesignCount > 0 ? (
        <div className={styles.bulkBarOverlay}>
          <div className={styles.bulkBar} role="toolbar" aria-label="Bulk actions">
            <button
              type="button"
              className={styles.bulkBarDismiss}
              onClick={handleClearSelection}
              aria-label="Clear selection"
            >
              <span className={styles.bulkBarDismissIcon} aria-hidden="true" />
            </button>

            <div className={styles.bulkBarCount}>
              {selectedDesignCount} selected
            </div>

            <div className={styles.bulkBarDivider} aria-hidden="true" />

            <button
              type="button"
              className={styles.bulkBarAction}
              onClick={handleSelectAllDesigns}
              disabled={allLoadedDesignsSelected}
            >
              <span
                className={`${styles.bulkBarActionIcon} ${styles.bulkBarSelectAllIcon}`}
                aria-hidden="true"
              />
              <span>Select All</span>
            </button>

            <button
              type="button"
              className={`${styles.bulkBarAction} ${styles.bulkBarDeleteAction}`}
              onClick={() => {
                handleRequestDeleteSelectedDesigns();
              }}
              disabled={bulkDeletePending}
            >
              <span
                className={`${styles.bulkBarActionIcon} ${styles.bulkBarDeleteIcon}`}
                aria-hidden="true"
              />
              <span>{bulkDeletePending ? "Deleting..." : "Delete"}</span>
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
