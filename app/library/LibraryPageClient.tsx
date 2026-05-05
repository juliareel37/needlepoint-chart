"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
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
  restoreDeletedEditorV2Document,
  saveEditorV2Document,
  type SavedEditorV2DocumentView,
} from "@/components/editor-v2/app/editorV2ServerPersistence";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import type { LibraryDesignRecord } from "@/lib/library/designs";
import { buildLibraryStitchSnapshot } from "@/lib/library/stitchSnapshot";
import { StitchThumbnailCanvas } from "./StitchThumbnailCanvas";
import styles from "./page.module.css";

const PAGE_SIZE = 12;
const LOADING_CARD_COUNT = PAGE_SIZE;
const DESIGN_OPEN_TRANSITION_MS = 70;
const activeCardMenuItems = [
  { id: "open", label: "Open", icon: "/icons/lucide/file.svg" },
  { id: "duplicate", label: "Duplicate", icon: "/icons/lucide/copy.svg" },
  { id: "delete", label: "Move to Trash", icon: "/icons/lucide/trash.svg" },
] as const;
const deletedCardMenuItems = [
  { id: "restore", label: "Restore", icon: "/icons/lucide/undo.svg" },
  { id: "delete-permanently", label: "Delete permanently", icon: "/icons/lucide/trash2.svg" },
] as const;
const touchSelectionCardMenuItem = {
  id: "toggle-selection",
  label: "Select items",
  icon: "/icons/lucide/square-check.svg",
} as const;
const sortOptions = [
  { id: "updated-desc", label: "Last edited date" },
  { id: "created-desc", label: "Created date" },
  { id: "name-asc", label: "Name" },
  { id: "size-desc", label: "Size" },
  { id: "colors-desc", label: "Color count" },
] as const;

type ActiveCardMenuItem = (typeof activeCardMenuItems)[number];
type DeletedCardMenuItem = (typeof deletedCardMenuItems)[number];
type CardMenuItem =
  | ActiveCardMenuItem
  | DeletedCardMenuItem
  | typeof touchSelectionCardMenuItem;
type CardMenuAction = CardMenuItem["id"];
type SortOption = (typeof sortOptions)[number];
type LibrarySortMode = SortOption["id"];
type LibraryViewMode = "grid" | "list";
type LibraryCollectionView = SavedEditorV2DocumentView;
type DeleteConfirmationState =
  | {
      kind: "single";
      design: LibraryDesignRecord;
      mode: "trash" | "permanent";
    }
  | {
      kind: "bulk";
      designIds: string[];
      mode: "trash" | "permanent";
    };
type LibrarySuccessNotification = {
  title: string;
  description?: string;
};
type PendingPermanentDeletion = {
  designIds: string[];
  previousDesigns: LibraryDesignRecord[];
  previousTotalCount: number;
  previousDeletedCount: number;
  count: number;
};
type NavigableDesignClickEvent = Pick<
  MouseEvent,
  "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey" | "preventDefault"
>;

function countUsedColors(cells: Array<string | null>) {
  return new Set(cells.filter((cellId): cellId is string => Boolean(cellId))).size;
}

async function fetchLibraryPage(
  offset: number,
  view: LibraryCollectionView,
  search: string,
) {
  const searchParams = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
    view,
  });
  if (search.trim().length > 0) {
    searchParams.set("search", search.trim());
  }
  const response = await fetch(`/api/editor-v2/designs?${searchParams.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  const body = (await response.json().catch(() => null)) as
    | {
        designs?: LibraryDesignRecord[];
        totalCount?: number;
        activeCount?: number;
        deletedCount?: number;
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
    activeCount: typeof body?.activeCount === "number" ? body.activeCount : 0,
    deletedCount: typeof body?.deletedCount === "number" ? body.deletedCount : 0,
    hasMore: body?.hasMore === true,
    nextOffset: typeof body?.nextOffset === "number" ? body.nextOffset : null,
  };
}

export function LibraryPageClient({
  initialDesigns = [],
  initialTotalCount = 0,
  initialHasMore = false,
  initialNextOffset = null,
  deferInitialLoad = false,
  initialViewMode = "active",
  initialLayoutMode = "grid",
  initialNotice = null,
}: {
  initialDesigns?: LibraryDesignRecord[];
  initialTotalCount?: number;
  initialHasMore?: boolean;
  initialNextOffset?: number | null;
  deferInitialLoad?: boolean;
  initialViewMode?: LibraryCollectionView;
  initialLayoutMode?: LibraryViewMode;
  initialNotice?: string | null;
}) {
  const router = useRouter();
  const [designs, setDesigns] = useState(initialDesigns);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [activeCount, setActiveCount] = useState(
    initialViewMode === "active" ? initialTotalCount : 0,
  );
  const [deletedCount, setDeletedCount] = useState(
    initialViewMode === "deleted" ? initialTotalCount : 0,
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [initialLoadPending, setInitialLoadPending] = useState(deferInitialLoad);
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
  const [collectionView, setCollectionView] =
    useState<LibraryCollectionView>(initialViewMode);
  const [viewMode, setViewMode] = useState<LibraryViewMode>(initialLayoutMode);
  const [sortMode, setSortMode] = useState<LibrarySortMode>("updated-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesignIds, setSelectedDesignIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmationState | null>(null);
  const [successNotification, setSuccessNotification] =
    useState<LibrarySuccessNotification | null>(null);
  const [pendingPermanentDeletion, setPendingPermanentDeletion] =
    useState<PendingPermanentDeletion | null>(null);
  const [pendingCardAction, setPendingCardAction] = useState<{
    designId: string;
    action: CardMenuAction;
  } | null>(null);
  const [openingDesignId, setOpeningDesignId] = useState<string | null>(null);
  const [touchPrimaryInput, setTouchPrimaryInput] = useState(false);
  const [touchSelectionMode, setTouchSelectionMode] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const designOpenTimeoutRef = useRef<number | null>(null);
  const touchMenuInteractionBlockUntilRef = useRef(0);
  const pendingPermanentDeletionTimeoutRef = useRef<number | null>(null);
  const pendingPermanentDeletionRef = useRef<PendingPermanentDeletion | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedSearchQuery = deferredSearchQuery.trim();
  const requestKey = `${collectionView}:${normalizedSearchQuery.toLowerCase()}`;
  const requestKeyRef = useRef(requestKey);

  const loadingCards = useMemo(
    () => Array.from({ length: LOADING_CARD_COUNT }, (_, index) => index),
    [],
  );
  const sortedDesigns = useMemo(() => {
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base",
    });

    return [...designs].sort((left, right) => {
      if (sortMode === "updated-desc") {
        if (collectionView === "deleted") {
          return (
            Date.parse(right.deletedAt ?? right.updatedAt) -
            Date.parse(left.deletedAt ?? left.updatedAt)
          );
        }

        return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
      }

      if (sortMode === "created-desc") {
        return Date.parse(right.createdAt) - Date.parse(left.createdAt);
      }

      if (sortMode === "name-asc") {
        return collator.compare(left.title, right.title);
      }

      if (sortMode === "size-desc") {
        const sizeDifference =
          right.gridWidth * right.gridHeight - left.gridWidth * left.gridHeight;
        if (sizeDifference !== 0) {
          return sizeDifference;
        }

        return collator.compare(left.title, right.title);
      }

      const leftColorCount = left.colorCount ?? -1;
      const rightColorCount = right.colorCount ?? -1;
      const colorDifference = rightColorCount - leftColorCount;
      if (colorDifference !== 0) {
        return colorDifference;
      }

      return collator.compare(left.title, right.title);
    });
  }, [collectionView, designs, sortMode]);
  const hasSearchQuery = normalizedSearchQuery.length > 0;
  const selectedDesignCount = selectedDesignIds.size;
  const desktopSelectionMode = !touchPrimaryInput && selectedDesignCount > 0;
  const showBulkBar = selectedDesignCount > 0 || (touchPrimaryInput && touchSelectionMode);
  const allLoadedDesignsSelected =
    designs.length > 0 && selectedDesignCount === designs.length;
  const isInitialLoading = initialLoadPending && designs.length === 0;

  async function loadInitialPage() {
    const currentRequestKey = requestKey;
    setInitialLoadPending(true);
    setLoadMoreError(null);

    try {
      const result = await fetchLibraryPage(0, collectionView, normalizedSearchQuery);
      if (requestKeyRef.current !== currentRequestKey) {
        return;
      }
      setDesigns(result.designs);
      setTotalCount(result.totalCount);
      setActiveCount(result.activeCount);
      setDeletedCount(result.deletedCount);
      setHasMore(result.hasMore);
      setNextOffset(result.nextOffset);
    } catch (error) {
      if (requestKeyRef.current !== currentRequestKey) {
        return;
      }
      setLoadMoreError(
        error instanceof Error ? error.message : "Couldn't load designs.",
      );
    } finally {
      if (requestKeyRef.current === currentRequestKey) {
        setInitialLoadPending(false);
      }
    }
  }

  useEffect(() => {
    requestKeyRef.current = requestKey;
  }, [requestKey]);

  useEffect(() => {
    if (!deferInitialLoad) {
      return;
    }

    void loadInitialPage();
  }, [collectionView, deferInitialLoad, normalizedSearchQuery]);

  useEffect(() => {
    if (!hasMore || loadingMore || loadMoreError || initialLoadPending) {
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

        const currentRequestKey = requestKey;

        void fetchLibraryPage(nextOffset ?? designs.length, collectionView, normalizedSearchQuery)
          .then((result) => {
            if (requestKeyRef.current !== currentRequestKey) {
              return;
            }
            setDesigns((existing) => [
              ...existing,
              ...result.designs.filter(
                (candidate) => !existing.some((record) => record.id === candidate.id),
              ),
            ]);
            setTotalCount(result.totalCount);
            setActiveCount(result.activeCount);
            setDeletedCount(result.deletedCount);
            setHasMore(result.hasMore);
            setNextOffset(result.nextOffset);
          })
          .catch((error) => {
            if (requestKeyRef.current !== currentRequestKey) {
              return;
            }
            setLoadMoreError(
              error instanceof Error ? error.message : "Couldn't load more designs.",
            );
          })
          .finally(() => {
            if (requestKeyRef.current === currentRequestKey) {
              setLoadingMore(false);
            }
          });
      },
      {
        rootMargin: "320px 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    collectionView,
    designs.length,
    hasMore,
    initialLoadPending,
    loadMoreError,
    loadingMore,
    nextOffset,
    normalizedSearchQuery,
    requestKey,
  ]);

  useEffect(
    () => () => {
      if (designOpenTimeoutRef.current !== null) {
        window.clearTimeout(designOpenTimeoutRef.current);
      }
      if (pendingPermanentDeletionTimeoutRef.current !== null) {
        window.clearTimeout(pendingPermanentDeletionTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const coarsePointerQuery = window.matchMedia("(any-pointer: coarse)");
    const hoverPointerQuery = window.matchMedia("(any-hover: hover)");
    const primaryCoarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const primaryHoverQuery = window.matchMedia("(hover: hover)");

    const update = () => {
      const hasTouchPoints =
        typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
      const hasCoarsePointer =
        coarsePointerQuery.matches || primaryCoarsePointerQuery.matches || hasTouchPoints;
      const hasHoverPointer =
        hoverPointerQuery.matches || primaryHoverQuery.matches;

      setTouchPrimaryInput(hasCoarsePointer && !hasHoverPointer);
    };

    update();

    const queries = [
      coarsePointerQuery,
      hoverPointerQuery,
      primaryCoarsePointerQuery,
      primaryHoverQuery,
    ];

    const addListener = (query: MediaQueryList) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
      }

      query.addListener(update);
      return () => query.removeListener(update);
    };

    const cleanups = queries.map(addListener);
    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    if (!touchPrimaryInput && touchSelectionMode) {
      setTouchSelectionMode(false);
    }
  }, [touchPrimaryInput, touchSelectionMode]);

  useEffect(() => {
    pendingPermanentDeletionRef.current = pendingPermanentDeletion;
  }, [pendingPermanentDeletion]);

  useEffect(() => {
    if (!initialNotice) {
      return;
    }

    setSuccessNotification({
      title: "Trash",
      description: initialNotice,
    });
  }, [initialNotice]);

  function navigateToDesign(
    event: NavigableDesignClickEvent,
    designId: string,
  ) {
    if (collectionView === "deleted") {
      event.preventDefault();
      return;
    }

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (openingDesignId === designId) {
      return;
    }

    if (designOpenTimeoutRef.current !== null) {
      window.clearTimeout(designOpenTimeoutRef.current);
    }

    setOpeningDesignId(designId);
    designOpenTimeoutRef.current = window.setTimeout(() => {
      router.push(`/editor/designs/${designId}`);
    }, DESIGN_OPEN_TRANSITION_MS);
  }

  function handleTouchSelectionModeToggle() {
    setTouchSelectionMode((current) => {
      if (current) {
        setSelectedDesignIds(new Set<string>());
      }

      return !current;
    });
  }

  function handleTouchCardOpen(
    event: React.MouseEvent<HTMLElement>,
    designId: string,
  ) {
    if (event.defaultPrevented || touchSelectionMode || !touchPrimaryInput) {
      return;
    }

    if (Date.now() < touchMenuInteractionBlockUntilRef.current) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest("[data-card-menu='true']")
    ) {
      return;
    }

    navigateToDesign(event.nativeEvent, designId);
  }

  function handleDesktopCardOpen(
    event: React.MouseEvent<HTMLElement>,
    designId: string,
  ) {
    if (event.defaultPrevented || touchPrimaryInput || desktopSelectionMode) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest("[data-card-menu='true'], a, button, input, label")
    ) {
      return;
    }

    navigateToDesign(event.nativeEvent, designId);
  }

  function handleTouchListRowSelect(
    event: React.MouseEvent<HTMLElement>,
    designId: string,
  ) {
    if (Date.now() < touchMenuInteractionBlockUntilRef.current) {
      return;
    }

    if (!touchPrimaryInput || !touchSelectionMode) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest("[data-card-menu='true']")
    ) {
      return;
    }

    event.preventDefault();
    handleDesignSelectionChange(designId, !selectedDesignIds.has(designId));
  }

  function handleDesktopListRowClick(
    event: React.MouseEvent<HTMLElement>,
    designId: string,
  ) {
    if (touchPrimaryInput) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest("[data-card-menu='true'], input, button, label")
    ) {
      return;
    }

    if (desktopSelectionMode) {
      event.preventDefault();
      handleDesignSelectionChange(designId, !selectedDesignIds.has(designId));
      return;
    }

    navigateToDesign(event.nativeEvent, designId);
  }

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

    if (menuAction === "toggle-selection") {
      handleTouchSelectionModeToggle();
      return;
    }

    if (menuAction === "open") {
      router.push(`/editor/designs/${design.id}`);
      return;
    }

    if (menuAction === "delete") {
      setDeleteConfirmation({
        kind: "single",
        design,
        mode: "trash",
      });
      return;
    }

    if (menuAction === "restore") {
      setPendingCardAction({ designId: design.id, action: menuAction });

      try {
        await restoreDeletedEditorV2Document(design.id);
        setDesigns((existing) => existing.filter((record) => record.id !== design.id));
        setTotalCount((current) => Math.max(0, current - 1));
        setDeletedCount((current) => Math.max(0, current - 1));
        setActiveCount((current) => current + 1);
        setSuccessNotification({
          title: "Design restored",
          description: `"${design.title}" is back in All Designs.`,
        });
      } catch (error) {
        setCardActionError(
          error instanceof Error ? error.message : "Couldn't restore design.",
        );
      } finally {
        setPendingCardAction((current) =>
          current?.designId === design.id ? null : current,
        );
      }
      return;
    }

    if (menuAction === "delete-permanently") {
      setDeleteConfirmation({
        kind: "single",
        design,
        mode: "permanent",
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
            state: "active",
            title: saved.title,
            gridWidth: saved.gridWidth,
            gridHeight: saved.gridHeight,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
            updatedLabel: "Edited just now",
            deletedAt: null,
            purgeAfterAt: null,
            colorCount: countUsedColors(loaded.document.grid.cells),
            previewUrl: loaded.document.trace?.previewUrl ?? null,
            thumbnailUrl: loaded.document.trace?.thumbnailUrl ?? null,
            tracePlacement: loaded.document.trace
              ? {
                  imageWidth: loaded.document.trace.imageWidth,
                  imageHeight: loaded.document.trace.imageHeight,
                  cropX: loaded.document.trace.cropX,
                  cropY: loaded.document.trace.cropY,
                  cropWidth: loaded.document.trace.cropWidth,
                  cropHeight: loaded.document.trace.cropHeight,
                  offsetX: loaded.document.trace.offsetX,
                  offsetY: loaded.document.trace.offsetY,
                  scale: loaded.document.trace.scale,
                  rotation: loaded.document.trace.rotation,
                }
              : null,
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
        setActiveCount((current) => current + 1);
        setSuccessNotification({
          title: "Design duplicated",
          description: `"${saved.title}" was added to All Designs.`,
        });
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
    if (touchPrimaryInput) {
      setTouchSelectionMode(false);
    }
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
      mode: collectionView === "deleted" ? "permanent" : "trash",
    });
  }

  function restoreDesignSnapshot(previousDesigns: LibraryDesignRecord[]) {
    setDesigns((current) => {
      const snapshotIds = new Set(previousDesigns.map((design) => design.id));
      const extras = current.filter((design) => !snapshotIds.has(design.id));
      return [...previousDesigns, ...extras];
    });
  }

  function clearPendingPermanentDeletionTimeout() {
    if (pendingPermanentDeletionTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(pendingPermanentDeletionTimeoutRef.current);
    pendingPermanentDeletionTimeoutRef.current = null;
  }

  async function commitPendingPermanentDeletion(
    nextPendingPermanentDeletion: PendingPermanentDeletion,
  ) {
    await Promise.all(
      nextPendingPermanentDeletion.designIds.map((designId) =>
        deleteSavedEditorV2Document(designId, { permanent: true }),
      ),
    );
  }

  function schedulePendingPermanentDeletion(
    nextPendingPermanentDeletion: PendingPermanentDeletion,
    notification: LibrarySuccessNotification,
  ) {
    clearPendingPermanentDeletionTimeout();
    setPendingPermanentDeletion(nextPendingPermanentDeletion);
    setSuccessNotification(notification);
    pendingPermanentDeletionTimeoutRef.current = window.setTimeout(() => {
      const currentPendingPermanentDeletion = pendingPermanentDeletionRef.current;

      if (!currentPendingPermanentDeletion) {
        return;
      }

      void commitPendingPermanentDeletion(currentPendingPermanentDeletion)
        .then(() => {
          setPendingPermanentDeletion(null);
          setSuccessNotification(null);
        })
        .catch((error) => {
          restoreDesignSnapshot(currentPendingPermanentDeletion.previousDesigns);
          setTotalCount(currentPendingPermanentDeletion.previousTotalCount);
          setDeletedCount(currentPendingPermanentDeletion.previousDeletedCount);
          setPendingPermanentDeletion(null);
          setSuccessNotification(null);
          setCardActionError(
            error instanceof Error
              ? error.message
              : "Couldn't permanently delete design.",
          );
        })
        .finally(() => {
          clearPendingPermanentDeletionTimeout();
        });
    }, 5000);
  }

  function handleUndoPendingPermanentDeletion() {
    const currentPendingPermanentDeletion = pendingPermanentDeletionRef.current;

    if (!currentPendingPermanentDeletion) {
      return;
    }

    clearPendingPermanentDeletionTimeout();
    restoreDesignSnapshot(currentPendingPermanentDeletion.previousDesigns);
    setTotalCount(currentPendingPermanentDeletion.previousTotalCount);
    setDeletedCount(currentPendingPermanentDeletion.previousDeletedCount);
    setPendingPermanentDeletion(null);
    setSuccessNotification(null);
  }

  function handleDismissSuccessNotification() {
    if (pendingPermanentDeletionRef.current) {
      const currentPendingPermanentDeletion = pendingPermanentDeletionRef.current;
      clearPendingPermanentDeletionTimeout();
      setPendingPermanentDeletion(null);
      setSuccessNotification(null);
      void commitPendingPermanentDeletion(currentPendingPermanentDeletion).catch((error) => {
        restoreDesignSnapshot(currentPendingPermanentDeletion.previousDesigns);
        setTotalCount(currentPendingPermanentDeletion.previousTotalCount);
        setDeletedCount(currentPendingPermanentDeletion.previousDeletedCount);
        setCardActionError(
          error instanceof Error
            ? error.message
            : "Couldn't permanently delete design.",
        );
      });
      return;
    }

    setSuccessNotification(null);
  }

  async function handleConfirmDelete() {
    if (!deleteConfirmation) {
      return;
    }

    setCardActionError(null);
    setBulkDeletePending(true);

    try {
      const idsToDelete =
        deleteConfirmation.kind === "single"
          ? [deleteConfirmation.design.id]
          : deleteConfirmation.designIds;

      if (deleteConfirmation.mode === "trash") {
        await Promise.all(idsToDelete.map((designId) => deleteSavedEditorV2Document(designId)));
        setDesigns((existing) => existing.filter((design) => !idsToDelete.includes(design.id)));
        setSelectedDesignIds(new Set<string>());
        setTotalCount((current) => Math.max(0, current - idsToDelete.length));
        setActiveCount((current) => Math.max(0, current - idsToDelete.length));
        setDeletedCount((current) => current + idsToDelete.length);
        setDeleteConfirmation(null);
        setSuccessNotification({
          title:
            idsToDelete.length === 1
              ? "Moved to Trash"
              : `Moved ${idsToDelete.length} designs to Trash`,
          description:
            deleteConfirmation.kind === "single"
              ? `"${deleteConfirmation.design.title}" can be restored for 30 days.`
              : "The selected designs can be restored for 30 days.",
        });
        return;
      }

      const previousDesigns = designs;
      const previousTotalCount = totalCount;
      const previousDeletedCount = deletedCount;
      setDesigns((existing) => existing.filter((design) => !idsToDelete.includes(design.id)));
      setSelectedDesignIds(new Set<string>());
      setTotalCount((current) => Math.max(0, current - idsToDelete.length));
      setDeletedCount((current) => Math.max(0, current - idsToDelete.length));
      setDeleteConfirmation(null);
      schedulePendingPermanentDeletion(
        {
          designIds: idsToDelete,
          previousDesigns,
          previousTotalCount,
          previousDeletedCount,
          count: idsToDelete.length,
        },
        {
          title:
            idsToDelete.length === 1
              ? "Deleting permanently..."
              : `Deleting ${idsToDelete.length} designs permanently...`,
          description:
            idsToDelete.length === 1
              ? "This design will be permanently removed in a few seconds."
              : "These designs will be permanently removed in a few seconds.",
        },
      );
      return;
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
    if (item.id === "toggle-selection") {
      return (
        <span className={styles.cardMenuItemLabel}>
          <ButtonIcon
            icon={
              touchSelectionMode
                ? "/icons/lucide/x.svg"
                : "/icons/lucide/square-check.svg"
            }
            className={styles.cardMenuItemIcon}
          />
          <span>{touchSelectionMode ? "Done selecting" : "Select items"}</span>
        </span>
      );
    }

    const isPending =
      pendingCardAction?.action === item.id &&
      pendingCardAction?.designId === design.id;

    return (
      <span
        className={[
          styles.cardMenuItemLabel,
          item.id === "delete" || item.id === "delete-permanently"
            ? styles.cardMenuItemLabelDestructive
            : null,
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
    const baseCardMenuItems =
      collectionView === "deleted" ? deletedCardMenuItems : activeCardMenuItems;
    const cardMenuItems = touchPrimaryInput
      ? [touchSelectionCardMenuItem, ...baseCardMenuItems]
      : [...baseCardMenuItems];

    return (
      <div className={styles.cardMenuAnchor} data-card-menu="true">
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
            if (touchPrimaryInput) {
              touchMenuInteractionBlockUntilRef.current = Date.now() + 400;
            }
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

  const selectedSortOption =
    sortOptions.find((option) => option.id === sortMode) ?? sortOptions[0];

  return (
    <main
      className={styles.page}
      data-navigating-design={openingDesignId ? "true" : "false"}
    >
      <section
        className={[
          styles.content,
          showBulkBar ? styles.contentWithBulkBar : null,
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
          <SegmentedControl<LibraryCollectionView>
            ariaLabel="Design collection view"
            className={`${styles.viewToggle} ${styles.collectionToggle}`}
            itemClassName={styles.viewToggleItem}
            value={collectionView}
            onChange={(value) => {
              setCollectionView(value);
              setSelectedDesignIds(new Set<string>());
              setTouchSelectionMode(false);
              setNextOffset(null);
            }}
            options={[
              {
                value: "active",
                label: `All Designs (${activeCount})`,
              },
              {
                value: "deleted",
                label: `Trash (${deletedCount})`,
              },
            ]}
          />
          <div className={styles.sortControl}>
            <SingleSelectDropdown<SortOption>
              ariaLabel="Sort designs"
              items={[...sortOptions]}
              value={sortMode}
              placeholder="Sort"
              triggerVariant="selection"
              triggerLabel={
                <span className={styles.sortTriggerLabel}>
                  <span className={styles.sortTriggerValue}>{selectedSortOption.label}</span>
                </span>
              }
              getItemValue={(item) => item.id}
              getItemLabel={(item) => item.label}
              onValueChange={(value) => {
                setSortMode(value as LibrarySortMode);
              }}
              triggerClassName={styles.sortTrigger}
              wrapperClassName={styles.sortDropdown}
              menuClassName={styles.sortMenu}
              minWidth="auto"
              menuPlacement="bottom-end"
              menuPortalToViewport
              openOnHover={!touchPrimaryInput}
            />
          </div>
          <span
            className={styles.viewControlsDividerKeep}
            aria-hidden="true"
          />
          <SegmentedControl<LibraryViewMode>
            ariaLabel="Design library view"
            className={`${styles.viewToggle} ${styles.layoutToggle}`}
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

        <div className={styles.searchRow}>
          <label className={styles.searchField}>
            <span className={styles.searchIcon} aria-hidden="true" />
            <FieldInput
              type="search"
              name="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSelectedDesignIds(new Set<string>());
                setTouchSelectionMode(false);
                setNextOffset(null);
              }}
              placeholder="Search designs"
              aria-label="Search designs"
              className={styles.searchInput}
            />
          </label>
        </div>

        {designs.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <section className={styles.grid} aria-label="Saved designs">
                {sortedDesigns.map((design) => {
                  const isSelected = selectedDesignIds.has(design.id);
                  const designHref =
                    collectionView === "deleted"
                      ? "/library?view=deleted"
                      : `/editor/designs/${design.id}`;
                  const cardSelectable = touchPrimaryInput
                    ? touchSelectionMode
                    : desktopSelectionMode;
                  const showCardCheckbox = !touchPrimaryInput || touchSelectionMode;
                  return (
                    <article
                      key={design.id}
                      className={styles.card}
                      data-selectable={cardSelectable ? "true" : "false"}
                      data-selected={isSelected ? "true" : "false"}
                      data-touch-open={touchPrimaryInput && !touchSelectionMode ? "true" : "false"}
                      data-touch-selection-mode={
                        touchPrimaryInput && touchSelectionMode ? "true" : "false"
                      }
                      onClick={(event) => {
                        handleTouchCardOpen(event, design.id);
                        handleDesktopCardOpen(event, design.id);
                      }}
                    >
                      {touchPrimaryInput && touchSelectionMode ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(event) => {
                            handleDesignSelectionChange(
                              design.id,
                              event.currentTarget.checked,
                            );
                          }}
                          className={styles.cardSelectionInputCard}
                          aria-label={`Select ${design.title}`}
                        />
                      ) : desktopSelectionMode ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(event) => {
                            handleDesignSelectionChange(
                              design.id,
                              event.currentTarget.checked,
                            );
                          }}
                          className={styles.cardSelectionInputCard}
                          aria-label={`Select ${design.title}`}
                        />
                      ) : null}

                      <div
                        className={`${styles.thumbnailShell} ${styles.cardSelectionSurface}`}
                      >
                        <div className={styles.thumbnail}>
                          <StitchThumbnailCanvas
                            snapshot={design.stitchSnapshot}
                            traceThumbnailUrl={design.previewUrl}
                            tracePlacement={design.tracePlacement}
                            className={styles.thumbnailCanvas}
                            testId={`grid-thumbnail-${design.id}`}
                          />
                        </div>

                        {showCardCheckbox ? (
                          <span className={styles.cardCheckbox}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              className={styles.cardCheckboxInput}
                              onChange={(event) => {
                                handleDesignSelectionChange(
                                  design.id,
                                  event.currentTarget.checked,
                                );
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                              }}
                              aria-label={`Select ${design.title}`}
                            />
                            <span
                              className={styles.cardCheckboxIndicator}
                              aria-hidden="true"
                            />
                          </span>
                        ) : null}
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.cardTopRow}>
                          <Link
                            href={designHref}
                            className={styles.cardTitleLink}
                            onClick={(event) => navigateToDesign(event, design.id)}
                          >
                            <h2 className={styles.cardTitle}>{design.title}</h2>
                          </Link>

                          {renderDesignMenu(design)}
                        </div>

                        <Link
                          href={designHref}
                          className={styles.cardDetailsLink}
                          onClick={(event) => navigateToDesign(event, design.id)}
                        >
                          <p className={styles.cardMeta}>
                            {design.gridWidth} × {design.gridHeight} cells
                            {typeof design.colorCount === "number"
                              ? ` • ${design.colorCount} ${
                                  design.colorCount === 1 ? "color" : "colors"
                                }`
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
              <section
                className={styles.listView}
                aria-label="Saved designs list"
                data-touch-selection-mode={
                  touchPrimaryInput && touchSelectionMode ? "true" : "false"
                }
              >
                <div
                  className={styles.listHeader}
                  data-touch-selection-mode={
                    touchPrimaryInput && touchSelectionMode ? "true" : "false"
                  }
                >
                  <span className={styles.listHeaderName}>Name</span>
                  <span>Size</span>
                  <span>Colors</span>
                  <span>Last Edited</span>
                  <span className={styles.listHeaderActions} aria-hidden="true" />
                </div>

                <div className={styles.listBody}>
                  {sortedDesigns.map((design) => {
                    const isSelected = selectedDesignIds.has(design.id);
                    const designHref =
                      collectionView === "deleted"
                        ? "/library?view=deleted"
                        : `/editor/designs/${design.id}`;
                    const showListSelectionControl =
                      !touchPrimaryInput || touchSelectionMode || isSelected;

                    return (
                    <article
                      key={design.id}
                      className={styles.listRow}
                      data-touch-selection-mode={
                        touchPrimaryInput && touchSelectionMode ? "true" : "false"
                      }
                      data-selectable={desktopSelectionMode ? "true" : "false"}
                      data-selected={isSelected ? "true" : "false"}
                      onClick={(event) => {
                        handleTouchListRowSelect(event, design.id);
                        handleDesktopListRowClick(event, design.id);
                      }}
                    >
                      <Link
                        href={designHref}
                        className={styles.listNameCell}
                        onClick={(event) => {
                          if (touchPrimaryInput && touchSelectionMode) {
                            event.preventDefault();
                            return;
                          }

                          if (desktopSelectionMode) {
                            event.preventDefault();
                            return;
                          }

                          navigateToDesign(event, design.id);
                        }}
                      >
                        <span className={styles.listThumbnailFrame}>
                          <StitchThumbnailCanvas
                            snapshot={design.stitchSnapshot}
                            traceThumbnailUrl={design.previewUrl}
                            tracePlacement={design.tracePlacement}
                            className={styles.listThumbnailCanvas}
                            testId={`list-thumbnail-${design.id}`}
                          />
                        </span>
                        <span className={styles.listNameContent}>
                          <span className={styles.listTitle}>{design.title}</span>
                          <span className={styles.listMobileMeta}>
                            <span className={styles.listMobileMetaItem}>
                              {design.gridWidth} × {design.gridHeight} cells
                            </span>
                            <span className={styles.listMobileMetaItem}>
                              {typeof design.colorCount === "number"
                                ? `${design.colorCount} ${
                                    design.colorCount === 1 ? "color" : "colors"
                                  }`
                                : "—"}
                            </span>
                            <span className={styles.listMobileMetaItem}>
                              {design.updatedLabel.replace(/^Edited /, "")}
                            </span>
                          </span>
                        </span>
                      </Link>

                      <Link
                        href={designHref}
                        className={styles.listMetaCell}
                        onClick={(event) => {
                          if (touchPrimaryInput && touchSelectionMode) {
                            event.preventDefault();
                            return;
                          }

                          if (desktopSelectionMode) {
                            event.preventDefault();
                            return;
                          }

                          navigateToDesign(event, design.id);
                        }}
                      >
                        {design.gridWidth} × {design.gridHeight} cells
                      </Link>
                      <Link
                        href={designHref}
                        className={styles.listMetaCell}
                        onClick={(event) => {
                          if (touchPrimaryInput && touchSelectionMode) {
                            event.preventDefault();
                            return;
                          }

                          if (desktopSelectionMode) {
                            event.preventDefault();
                            return;
                          }

                          navigateToDesign(event, design.id);
                        }}
                      >
                        {typeof design.colorCount === "number"
                          ? `${design.colorCount} ${
                              design.colorCount === 1 ? "color" : "colors"
                            }`
                          : "—"}
                      </Link>
                      <Link
                        href={designHref}
                        className={styles.listMetaCell}
                        onClick={(event) => {
                          if (touchPrimaryInput && touchSelectionMode) {
                            event.preventDefault();
                            return;
                          }

                          if (desktopSelectionMode) {
                            event.preventDefault();
                            return;
                          }

                          navigateToDesign(event, design.id);
                        }}
                      >
                        {design.updatedLabel.replace(/^Edited /, "")}
                      </Link>

                      <div className={styles.listActionsCell}>
                        {showListSelectionControl ? (
                          <span className={styles.listSelectionCell}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(event) => {
                                handleDesignSelectionChange(
                                  design.id,
                                  event.currentTarget.checked,
                                );
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                              }}
                              className={styles.listSelectionInput}
                              aria-label={`Select ${design.title}`}
                            />
                            <span
                              className={styles.listSelectionIndicator}
                              aria-hidden="true"
                            />
                          </span>
                        ) : null}
                        {renderDesignMenu(design)}
                      </div>
                    </article>
                  )})}

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
        ) : isInitialLoading ? (
          viewMode === "grid" ? (
            <section className={styles.grid} aria-label="Loading saved designs">
              {loadingCards.map((card) => (
                <article
                  key={`initial-loading-${card}`}
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
              ))}
            </section>
          ) : (
            <section className={styles.listView} aria-label="Loading saved designs list">
              <div className={styles.listHeader}>
                <span className={styles.listHeaderName}>Name</span>
                <span>Size</span>
                <span>Colors</span>
                <span>Last Edited</span>
                <span className={styles.listHeaderActions} aria-hidden="true" />
              </div>
              <div className={styles.listBody}>
                {loadingCards.map((card) => (
                  <article
                    key={`initial-list-loading-${card}`}
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
                ))}
              </div>
            </section>
          )
        ) : (
          <section className={styles.emptyState}>
            <h2 className={styles.emptyStateTitle}>
              {hasSearchQuery
                ? "No matching designs"
                : collectionView === "deleted"
                  ? "Trash is empty"
                  : "No designs yet"}
            </h2>
            <p className={styles.emptyStateBody}>
              {hasSearchQuery
                ? `No designs found for "${normalizedSearchQuery}".`
                : collectionView === "deleted"
                  ? "Designs you delete will stay here for 30 days before they are permanently removed."
                  : "Your saved needlepoint designs will show up here once you create one."}
            </p>
            {loadMoreError ? (
              <p className={styles.loadMoreError}>{loadMoreError}</p>
            ) : null}
            {loadMoreError ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  void loadInitialPage();
                }}
              >
                Retry loading designs
              </Button>
            ) : null}
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
            ? deleteConfirmation.mode === "trash"
              ? `Move ${deleteConfirmation.designIds.length} design${
                  deleteConfirmation.designIds.length === 1 ? "" : "s"
                } to Trash?`
              : `Delete ${deleteConfirmation.designIds.length} design${
                  deleteConfirmation.designIds.length === 1 ? "" : "s"
                } permanently?`
            : deleteConfirmation?.mode === "trash"
              ? "Move this design to Trash?"
              : "Delete this design permanently?"
        }
        description={
          deleteConfirmation?.kind === "bulk"
            ? deleteConfirmation.mode === "trash"
              ? `The selected design${
                  deleteConfirmation.designIds.length === 1 ? "" : "s"
                } can be restored for 30 days from Trash.`
              : `This will permanently delete ${deleteConfirmation.designIds.length} selected design${
                  deleteConfirmation.designIds.length === 1 ? "" : "s"
                } from Trash.`
            : deleteConfirmation?.mode === "trash"
              ? "You can restore this design for 30 days from Trash."
              : "This permanently removes the selected design from Trash."
        }
        tone="fail"
        dismissLabel="Cancel"
        confirmLabel={
          bulkDeletePending
            ? deleteConfirmation?.mode === "trash"
              ? "Moving..."
              : "Deleting..."
            : deleteConfirmation?.mode === "trash"
              ? deleteConfirmation?.kind === "bulk"
                ? "Move to Trash"
                : "Move to Trash"
              : deleteConfirmation?.kind === "bulk"
                ? "Delete permanently"
                : "Delete permanently"
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
              actionLabel={pendingPermanentDeletion ? "Undo" : undefined}
              actionVariant={pendingPermanentDeletion ? "secondary" : undefined}
              onAction={pendingPermanentDeletion ? handleUndoPendingPermanentDeletion : undefined}
              onDismiss={handleDismissSuccessNotification}
            />
          </div>
        </div>
      ) : null}

      {showBulkBar ? (
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
              disabled={designs.length === 0 || allLoadedDesignsSelected}
            >
              {/* <span
                className={`${styles.bulkBarActionIcon} ${styles.bulkBarSelectAllIcon}`}
                aria-hidden="true"
              /> */}
                <ButtonIcon icon="/icons/lucide/square-check.svg" />
              <span>Select All</span>
            </button>

            <button
              type="button"
              className={`${styles.bulkBarAction} ${styles.bulkBarDeleteAction}`}
              onClick={() => {
                handleRequestDeleteSelectedDesigns();
              }}
              disabled={bulkDeletePending || selectedDesignCount === 0}
            >
              <span
                className={`${styles.bulkBarActionIcon} ${styles.bulkBarDeleteIcon}`}
                aria-hidden="true"
              />
              <span>
                {bulkDeletePending
                  ? collectionView === "deleted"
                    ? "Deleting..."
                    : "Moving..."
                  : collectionView === "deleted"
                    ? "Delete Permanently"
                    : "Move to Trash"}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
