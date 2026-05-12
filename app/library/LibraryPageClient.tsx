"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  ButtonIcon,
  Field,
  FieldInput,
  FieldSelect,
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
  createEditorV2Folder,
  deleteEditorV2Folder,
  moveEditorV2DesignToFolder,
  moveEditorV2DesignsToFolder,
  renameEditorV2Folder,
  deleteSavedEditorV2Document,
  loadSavedEditorV2Document,
  renameSavedEditorV2Document,
  restoreDeletedEditorV2Document,
  saveEditorV2Document,
  type SavedEditorV2DesignFolder,
  type SavedEditorV2DocumentView,
} from "@/components/editor-v2/app/editorV2ServerPersistence";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { useAuthStatus } from "@/lib/auth/client";
import { readStickyCanvasPreferences } from "@/components/editor-v2/app/stickyCanvasPreferences";
import type { LibraryDesignRecord } from "@/lib/library/designs";
import { buildLibraryStitchSnapshot } from "@/lib/library/stitchSnapshot";
import { StitchThumbnailCanvas } from "./StitchThumbnailCanvas";
import styles from "./page.module.css";

const PAGE_SIZE = 12;
const LOADING_CARD_COUNT = PAGE_SIZE;
const DESIGN_OPEN_TRANSITION_MS = 70;
const activeCardMenuItems = [
  { id: "open", label: "Open", icon: "/icons/lucide/file.svg" },
  { id: "rename", label: "Rename", icon: "/icons/lucide/pencil.svg" },
  { id: "move-to-folder", label: "Move to folder", icon: "/icons/lucide/folder-plus.svg" },
  { id: "move-to-root", label: "Move to root", icon: "/icons/lucide/undo.svg" },
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
type FolderDialogState =
  | { mode: "create" }
  | { mode: "rename"; folder: SavedEditorV2DesignFolder }
  | { mode: "delete"; folder: SavedEditorV2DesignFolder }
  | null;
type MoveDialogState =
  | {
      designIds: string[];
      source: "single" | "bulk";
      title: string;
      initialFolderId: string | null;
    }
  | null;
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
  folderId: string | null,
) {
  const searchParams = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
    view,
  });
  if (search.trim().length > 0) {
    searchParams.set("search", search.trim());
  }
  if (view === "active" && folderId) {
    searchParams.set("folder", folderId);
  }
  const response = await fetch(`/api/editor-v2/designs?${searchParams.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  const body = (await response.json().catch(() => null)) as
    | {
        designs?: LibraryDesignRecord[];
        folders?: SavedEditorV2DesignFolder[];
        selectedFolder?: SavedEditorV2DesignFolder | null;
        rootDesignCount?: number;
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
    folders: Array.isArray(body?.folders) ? body.folders : [],
    selectedFolder:
      body?.selectedFolder && typeof body.selectedFolder === "object"
        ? body.selectedFolder
        : null,
    rootDesignCount: typeof body?.rootDesignCount === "number" ? body.rootDesignCount : 0,
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
  initialFolderId = null,
  initialViewMode = "active",
  initialLayoutMode = "grid",
  initialNotice = null,
}: {
  initialDesigns?: LibraryDesignRecord[];
  initialTotalCount?: number;
  initialHasMore?: boolean;
  initialNextOffset?: number | null;
  deferInitialLoad?: boolean;
  initialFolderId?: string | null;
  initialViewMode?: LibraryCollectionView;
  initialLayoutMode?: LibraryViewMode;
  initialNotice?: string | null;
}) {
  const { isSignedIn } = useAuthStatus();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [designs, setDesigns] = useState(initialDesigns);
  const [folders, setFolders] = useState<SavedEditorV2DesignFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);
  const [rootDesignCount, setRootDesignCount] = useState(0);
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
  const [renamingDesignId, setRenamingDesignId] = useState<string | null>(null);
  const [renameDraftTitle, setRenameDraftTitle] = useState("");
  const [folderDialog, setFolderDialog] = useState<FolderDialogState>(null);
  const [folderNameDraft, setFolderNameDraft] = useState("");
  const [folderDialogPending, setFolderDialogPending] = useState(false);
  const [folderDialogError, setFolderDialogError] = useState<string | null>(null);
  const [moveDialog, setMoveDialog] = useState<MoveDialogState>(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string>("");
  const [moveDialogPending, setMoveDialogPending] = useState(false);
  const [moveDialogError, setMoveDialogError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const designOpenTimeoutRef = useRef<number | null>(null);
  const touchMenuInteractionBlockUntilRef = useRef(0);
  const pendingPermanentDeletionTimeoutRef = useRef<number | null>(null);
  const pendingPermanentDeletionRef = useRef<PendingPermanentDeletion | null>(null);
  const renameCommitOnBlurRef = useRef(true);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedSearchQuery = deferredSearchQuery.trim();
  const requestKey = `${collectionView}:${selectedFolderId ?? "root"}:${normalizedSearchQuery.toLowerCase()}`;
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
  const currentFolder =
    selectedFolderId === null
      ? null
      : folders.find((folder) => folder.id === selectedFolderId) ?? null;

  function beginLibraryScopeTransition() {
    setSelectedDesignIds(new Set<string>());
    setTouchSelectionMode(false);
    setNextOffset(null);
    setHasMore(false);
    setLoadMoreError(null);
    setDesigns([]);
    setInitialLoadPending(true);
  }

  async function loadInitialPage() {
    const currentRequestKey = requestKey;
    setInitialLoadPending(true);
    setLoadMoreError(null);

    try {
      const result = await fetchLibraryPage(
        0,
        collectionView,
        normalizedSearchQuery,
        collectionView === "active" ? selectedFolderId : null,
      );
      if (requestKeyRef.current !== currentRequestKey) {
        return;
      }
      setDesigns(result.designs);
      setFolders(result.folders);
      setRootDesignCount(result.rootDesignCount);
      setTotalCount(result.totalCount);
      setActiveCount(result.activeCount);
      setDeletedCount(result.deletedCount);
      setHasMore(result.hasMore);
      setNextOffset(result.nextOffset);
    } catch (error) {
      if (requestKeyRef.current !== currentRequestKey) {
        return;
      }
      if (error instanceof Error && error.message === "Folder not found.") {
        setSelectedFolderId(null);
        updateLibraryUrl({ view: "active", folderId: null, notice: null });
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
    const viewParam = searchParams.get("view");
    const nextView = viewParam === "deleted" ? "deleted" : "active";
    if (nextView !== collectionView) {
      setCollectionView(nextView);
      setSelectedDesignIds(new Set<string>());
      setTouchSelectionMode(false);
      setNextOffset(null);
    }
  }, [collectionView, searchParams]);

  useEffect(() => {
    const folderParam = searchParams.get("folder");
    const nextFolderId =
      collectionView === "deleted" ? null : folderParam && folderParam.length > 0 ? folderParam : null;
    if (nextFolderId !== selectedFolderId) {
      setSelectedFolderId(nextFolderId);
      setSelectedDesignIds(new Set<string>());
      setTouchSelectionMode(false);
      setNextOffset(null);
    }
  }, [collectionView, searchParams, selectedFolderId]);

  useEffect(() => {
    if (!deferInitialLoad) {
      return;
    }

    void loadInitialPage();
  }, [collectionView, deferInitialLoad, normalizedSearchQuery, selectedFolderId]);

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

        void fetchLibraryPage(
          nextOffset ?? designs.length,
          collectionView,
          normalizedSearchQuery,
          collectionView === "active" ? selectedFolderId : null,
        )
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
            setFolders(result.folders);
            setRootDesignCount(result.rootDesignCount);
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
    selectedFolderId,
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
    if (!renamingDesignId) {
      return;
    }

    const renamedDesignStillVisible = designs.some((design) => design.id === renamingDesignId);
    if (!renamedDesignStillVisible) {
      setRenamingDesignId(null);
      setRenameDraftTitle("");
    }
  }, [designs, renamingDesignId]);

  useEffect(() => {
    if (!initialNotice) {
      return;
    }

    setSuccessNotification({
      title: "Trash",
      description: initialNotice,
    });
  }, [initialNotice]);

  function updateLibraryUrl(next: {
    view?: LibraryCollectionView;
    folderId?: string | null;
    notice?: string | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextView = next.view ?? collectionView;
    const nextFolderId =
      nextView === "deleted" ? null : next.folderId !== undefined ? next.folderId : selectedFolderId;

    if (nextView === "deleted") {
      params.set("view", "deleted");
    } else {
      params.delete("view");
    }

    if (nextFolderId) {
      params.set("folder", nextFolderId);
    } else {
      params.delete("folder");
    }

    if (next.notice) {
      params.set("notice", next.notice);
    } else {
      params.delete("notice");
    }

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  function navigateLibraryScope(next: {
    view: LibraryCollectionView;
    folderId?: string | null;
  }) {
    beginLibraryScopeTransition();
    updateLibraryUrl({
      view: next.view,
      folderId: next.view === "deleted" ? null : next.folderId ?? null,
      notice: null,
    });
  }

  function navigateToDesign(
    event: NavigableDesignClickEvent,
    designId: string,
  ) {
    if (renamingDesignId === designId) {
      event.preventDefault();
      return;
    }

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
        canvasPreferences: isSignedIn ? readStickyCanvasPreferences() : null,
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

  function openCreateFolderDialog() {
    setFolderDialog({ mode: "create" });
    setFolderNameDraft("");
    setFolderDialogError(null);
  }

  function openRenameFolderDialog(folder: SavedEditorV2DesignFolder) {
    setFolderDialog({ mode: "rename", folder });
    setFolderNameDraft(folder.name);
    setFolderDialogError(null);
  }

  function openDeleteFolderDialog(folder: SavedEditorV2DesignFolder) {
    setFolderDialog({ mode: "delete", folder });
    setFolderNameDraft(folder.name);
    setFolderDialogError(null);
  }

  async function handleConfirmFolderDialog() {
    if (!folderDialog) {
      return;
    }

    setFolderDialogPending(true);
    setFolderDialogError(null);

    try {
      if (folderDialog.mode === "create") {
        const folder = await createEditorV2Folder(folderNameDraft);
        setFolderDialog(null);
        setSuccessNotification({
          title: "Folder created",
          description: `"${folder.name}" is ready for your designs.`,
        });
        navigateLibraryScope({ folderId: folder.id, view: "active" });
        return;
      }

      if (folderDialog.mode === "rename") {
        const folder = await renameEditorV2Folder(folderDialog.folder.id, folderNameDraft);
        setFolderDialog(null);
        setFolders((existing) =>
          existing.map((candidate) => (candidate.id === folder.id ? folder : candidate)),
        );
        setSuccessNotification({
          title: "Folder renamed",
          description: `"${folder.name}" was updated.`,
        });
        void loadInitialPage();
        return;
      }

      const deletedFolder = folderDialog.folder;
      await deleteEditorV2Folder(deletedFolder.id);
      setFolderDialog(null);
      if (selectedFolderId === deletedFolder.id) {
        navigateLibraryScope({ folderId: null, view: "active" });
      } else {
        void loadInitialPage();
      }
      setSuccessNotification({
        title: "Folder deleted",
        description: `"${deletedFolder.name}" was removed. Its designs are back in All Designs.`,
      });
    } catch (error) {
      setFolderDialogError(
        error instanceof Error ? error.message : "Couldn't update folder.",
      );
    } finally {
      setFolderDialogPending(false);
    }
  }

  function openMoveDialog(designIds: string[], source: "single" | "bulk", title: string, initialFolderId: string | null) {
    setMoveDialog({
      designIds,
      source,
      title,
      initialFolderId,
    });
    setMoveTargetFolderId(initialFolderId ?? "");
    setMoveDialogError(null);
  }

  async function handleConfirmMoveDialog() {
    if (!moveDialog) {
      return;
    }

    setMoveDialogPending(true);
    setMoveDialogError(null);

    try {
      const targetFolderId = moveTargetFolderId || null;
      if (moveDialog.source === "single") {
        await moveEditorV2DesignToFolder(moveDialog.designIds[0]!, targetFolderId);
      } else {
        await moveEditorV2DesignsToFolder(moveDialog.designIds, targetFolderId);
        setSelectedDesignIds(new Set<string>());
      }

      setMoveDialog(null);
      setSuccessNotification({
        title: targetFolderId ? "Moved to folder" : "Moved to All Designs",
        description: targetFolderId
          ? `${moveDialog.designIds.length === 1 ? "Design" : "Designs"} moved successfully.`
          : `${moveDialog.designIds.length === 1 ? "Design" : "Designs"} moved back to All Designs.`,
      });
      void loadInitialPage();
    } catch (error) {
      setMoveDialogError(
        error instanceof Error ? error.message : "Couldn't move design.",
      );
    } finally {
      setMoveDialogPending(false);
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

    if (menuAction === "rename") {
      renameCommitOnBlurRef.current = true;
      setRenameDraftTitle(design.title);
      setRenamingDesignId(design.id);
      return;
    }

    if (menuAction === "move-to-folder") {
      openMoveDialog([design.id], "single", design.title, design.folderId);
      return;
    }

    if (menuAction === "move-to-root") {
      setPendingCardAction({ designId: design.id, action: menuAction });

      try {
        await moveEditorV2DesignToFolder(design.id, null);
        setSuccessNotification({
          title: "Moved to All Designs",
          description: `"${design.title}" is back in All Designs.`,
        });
        void loadInitialPage();
      } catch (error) {
        setCardActionError(
          error instanceof Error ? error.message : "Couldn't move design.",
        );
      } finally {
        setPendingCardAction((current) =>
          current?.designId === design.id ? null : current,
        );
      }
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
          description: design.folderName
            ? `"${design.title}" is back in ${design.folderName}.`
            : `"${design.title}" is back in All Designs.`,
        });
        void loadInitialPage();
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
        if (design.folderId) {
          await moveEditorV2DesignToFolder(saved.storageId, design.folderId);
        }

        setDesigns((existing) => [
          {
            id: saved.storageId,
            state: "active",
            title: saved.title,
            folderId: design.folderId,
            folderName: design.folderName,
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
          description: design.folderName
            ? `"${saved.title}" was added to ${design.folderName}.`
            : `"${saved.title}" was added to All Designs.`,
        });
        void loadInitialPage();
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

  function handleRequestMoveSelectedDesigns() {
    if (selectedDesignIds.size === 0) {
      return;
    }

    const selectedDesigns = designs.filter((design) => selectedDesignIds.has(design.id));
    const sharedFolderId =
      selectedDesigns.length > 0 &&
      selectedDesigns.every((design) => design.folderId === selectedDesigns[0]?.folderId)
        ? selectedDesigns[0]?.folderId ?? null
        : null;

    openMoveDialog(
      selectedDesigns.map((design) => design.id),
      "bulk",
      `${selectedDesigns.length} designs`,
      sharedFolderId,
    );
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
        void loadInitialPage();
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

  function renderFolderMenu(folder: SavedEditorV2DesignFolder) {
    return (
      <div className={styles.cardMenuAnchor} data-card-menu="true">
        <SingleSelectDropdown
          ariaLabel={`Folder actions for ${folder.name}`}
          items={[
            { id: "rename", label: "Rename folder", icon: "/icons/lucide/pencil.svg" },
            { id: "delete", label: "Delete folder", icon: "/icons/lucide/trash.svg" },
          ]}
          value=""
          placeholder="Folder actions"
          triggerLabel={<span className={styles.cardMenuDots}>⋮</span>}
          triggerVariant="ghost"
          showChevron={false}
          menuPortalToViewport
          menuPlacement="bottom-end"
          menuShowTrailingCheck={false}
          minWidth="auto"
          getItemValue={(item) => item.id}
          getItemLabel={(item) => (
            <span className={styles.cardMenuItemLabel}>
              <ButtonIcon icon={item.icon} className={styles.cardMenuItemIcon} />
              <span>{item.label}</span>
            </span>
          )}
          onValueChange={(value) => {
            if (value === "rename") {
              openRenameFolderDialog(folder);
              return;
            }

            openDeleteFolderDialog(folder);
          }}
          wrapperClassName={styles.folderMenuWrapper}
          triggerClassName={styles.cardMenuTrigger}
          menuClassName={styles.cardMenuSurface}
          triggerStyle={{ minWidth: "32px", padding: "6px 8px" }}
        />
      </div>
    );
  }

  function renderFolderGlyph(className?: string) {
    return (
      <span className={[styles.folderGlyph, className].filter(Boolean).join(" ")} aria-hidden="true">
        <span className={styles.folderGlyphTab} />
        <span className={styles.folderGlyphBody} />
      </span>
    );
  }

  function renderDesignMenu(design: LibraryDesignRecord) {
    if (renamingDesignId === design.id) {
      return null;
    }

    const baseCardMenuItems =
      collectionView === "deleted" ? deletedCardMenuItems : activeCardMenuItems;
    const filteredCardMenuItems =
      collectionView === "deleted"
        ? baseCardMenuItems
        : baseCardMenuItems.filter((item) => {
            if (item.id === "move-to-root") {
              return design.folderId !== null;
            }

            return true;
          });
    const cardMenuItems = touchPrimaryInput
      ? [touchSelectionCardMenuItem, ...filteredCardMenuItems]
      : [...filteredCardMenuItems];

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

  function cancelRename() {
    renameCommitOnBlurRef.current = true;
    setRenamingDesignId(null);
    setRenameDraftTitle("");
  }

  async function commitRename(designId: string) {
    const design = designs.find((candidate) => candidate.id === designId);
    const nextTitle = renameDraftTitle.trim();

    if (!design) {
      cancelRename();
      return;
    }

    if (!nextTitle || nextTitle === design.title) {
      cancelRename();
      return;
    }

    setPendingCardAction({ designId, action: "rename" });
    setCardActionError(null);

    try {
      const saved = await renameSavedEditorV2Document(designId, nextTitle);
      setDesigns((existing) =>
        existing.map((record) =>
          record.id === designId
            ? {
                ...record,
                title: saved.title,
                updatedAt: saved.updatedAt,
                updatedLabel: "Edited just now",
              }
            : record,
        ),
      );
      setRenamingDesignId(null);
      setRenameDraftTitle("");
    } catch (error) {
      setCardActionError(
        error instanceof Error ? error.message : "Couldn't rename design.",
      );
    } finally {
      setPendingCardAction((current) =>
        current?.designId === designId && current.action === "rename" ? null : current,
      );
    }
  }

  function renderRenameInput(design: LibraryDesignRecord, className?: string) {
    const isPendingRename =
      pendingCardAction?.designId === design.id &&
      pendingCardAction.action === "rename";

    return (
      <FieldInput
        autoFocus
        value={renameDraftTitle}
        disabled={isPendingRename}
        className={className}
        aria-label={`Rename ${design.title}`}
        onChange={(event) => setRenameDraftTitle(event.target.value)}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onBlur={() => {
          if (!renameCommitOnBlurRef.current) {
            renameCommitOnBlurRef.current = true;
            return;
          }

          void commitRename(design.id);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            renameCommitOnBlurRef.current = false;
            void commitRename(design.id);
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            renameCommitOnBlurRef.current = false;
            cancelRename();
          }
        }}
      />
    );
  }

  const selectedSortOption =
    sortOptions.find((option) => option.id === sortMode) ?? sortOptions[0];
  const visibleFolderItems =
    collectionView === "active" && selectedFolderId === null
      ? folders.filter((folder) =>
          normalizedSearchQuery.length === 0
            ? true
            : folder.name.toLowerCase().includes(normalizedSearchQuery.toLowerCase()),
        )
      : [];
  const hasVisibleLibraryItems = visibleFolderItems.length > 0 || designs.length > 0;

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
            {collectionView === "active" && currentFolder ? (
              <div className={styles.scopedHeader}>
                <div className={styles.breadcrumbs} aria-label="Library breadcrumbs">
                  <button
                    type="button"
                    className={styles.breadcrumbButton}
                    onClick={() => {
                      navigateLibraryScope({ view: "active", folderId: null });
                    }}
                  >
                    My Designs
                  </button>
                  <span className={styles.breadcrumbDivider} aria-hidden="true">
                    →
                  </span>
                  <span className={styles.breadcrumbCurrent}>{currentFolder.name}</span>
                </div>
                <h1 className={styles.scopedTitle}>{currentFolder.name}</h1>
              </div>
            ) : (
              <h1 className={styles.title}>
                {collectionView === "deleted" ? "Trash" : "My Designs"}
              </h1>
            )}
          </div>

          <div className={styles.actions}>
            {collectionView === "deleted" ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                className={styles.libraryNavButton}
                onClick={() => {
                  navigateLibraryScope({ view: "active", folderId: null });
                }}
              >
                <ButtonIcon icon="/icons/lucide/arrow-left.svg" />
                Back to My Designs
              </Button>
            ) : selectedFolderId === null ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                className={styles.libraryNavButton}
                onClick={() => {
                  navigateLibraryScope({ view: "deleted" });
                }}
              >
                <ButtonIcon icon="/icons/lucide/trash.svg" />
                Trash ({deletedCount})
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={openCreateFolderDialog}
            >
              <ButtonIcon icon="/icons/lucide/folder-plus.svg" />
              New folder
            </Button>
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
          <div className={styles.searchControls}>
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
        </div>

        {isInitialLoading ? (
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
        ) : hasVisibleLibraryItems ? (
          <>
            {viewMode === "grid" ? (
              <section className={styles.grid} aria-label="Saved designs">
                {visibleFolderItems.map((folder) => (
                  <article
                    key={folder.id}
                    className={styles.folderCard}
                    data-active="false"
                  >
                    <button
                      type="button"
                      className={styles.folderCardButton}
                      onClick={() => {
                        navigateLibraryScope({ view: "active", folderId: folder.id });
                      }}
                    >
                      <div className={styles.folderCardVisual}>
                        {renderFolderGlyph(styles.folderCardGlyph)}
                      </div>
                      <div className={styles.folderCardBody}>
                        <div className={styles.folderCardTopRow}>
                          <h3 className={styles.folderCardTitle}>{folder.name}</h3>
                        </div>
                        <p className={styles.folderCardMeta}>
                          {folder.designCount} design{folder.designCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </button>
                    {renderFolderMenu(folder)}
                  </article>
                ))}
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
                          {renamingDesignId === design.id ? (
                            <div
                              className={styles.cardTitleLink}
                              onClick={(event) => {
                                event.stopPropagation();
                              }}
                            >
                              <span className={styles.cardTitleEditor}>
                                {renderRenameInput(design, styles.cardTitleInput)}
                              </span>
                            </div>
                          ) : (
                            <Link
                              href={designHref}
                              className={styles.cardTitleLink}
                              onClick={(event) => navigateToDesign(event, design.id)}
                            >
                              <h2 className={styles.cardTitle}>{design.title}</h2>
                            </Link>
                          )}

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
                  {visibleFolderItems.map((folder) => (
                    <article
                      key={folder.id}
                      className={styles.folderListRow}
                      data-active="false"
                    >
                      <button
                        type="button"
                        className={styles.folderListButton}
                        onClick={() => {
                          navigateLibraryScope({ view: "active", folderId: folder.id });
                        }}
                      >
                        <span className={styles.listThumbnailFrame}>
                          {renderFolderGlyph(styles.folderListGlyph)}
                        </span>
                        <span className={styles.listNameContent}>
                          <span className={styles.listTitle}>{folder.name}</span>
                          <span className={styles.listMobileMeta}>
                            <span className={styles.listMobileMetaItem}>
                              {folder.designCount} design{folder.designCount === 1 ? "" : "s"}
                            </span>
                          </span>
                        </span>
                        <span className={styles.folderListCount}>
                          {folder.designCount} design{folder.designCount === 1 ? "" : "s"}
                        </span>
                      </button>
                      <div className={styles.listActionsCell}>{renderFolderMenu(folder)}</div>
                    </article>
                  ))}
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
                      {renamingDesignId === design.id ? (
                        <div
                          className={styles.listNameCell}
                          onClick={(event) => {
                            event.stopPropagation();
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
                            {renderRenameInput(design, styles.listTitleInput)}
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
                        </div>
                      ) : (
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
                      )}

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
        ) : (
          <section className={styles.emptyState}>
            <h2 className={styles.emptyStateTitle}>
              {hasSearchQuery
                ? "No matching designs"
                : collectionView === "deleted"
                  ? "Trash is empty"
                  : currentFolder
                    ? "This folder is empty"
                    : folders.length > 0
                      ? "No designs at the top level"
                  : "No designs yet"}
            </h2>
            <p className={styles.emptyStateBody}>
              {hasSearchQuery
                ? `No designs found for "${normalizedSearchQuery}".`
                : collectionView === "deleted"
                  ? "Designs you delete will stay here for 30 days before they are permanently removed."
                  : currentFolder
                    ? `Move designs into ${currentFolder.name} or create a new design here later.`
                    : folders.length > 0
                      ? "Your folders are above. Create a new design here or open a folder to keep browsing."
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
            onClearLocalBrowserData={() => {}}
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

      <Modal
        isOpen={folderDialog !== null}
        title={
          folderDialog?.mode === "create"
            ? "Create folder"
            : folderDialog?.mode === "rename"
              ? "Rename folder"
              : "Delete folder"
        }
        description={
          folderDialog?.mode === "delete" ? (
            `Delete "${folderDialog.folder.name}"? Designs in this folder will move back to All Designs.`
          ) : (
            <div className={styles.folderModalContent}>
              <Field label="Folder name">
                <FieldInput
                  value={folderNameDraft}
                  onChange={(event) => setFolderNameDraft(event.target.value)}
                  placeholder="Enter folder name"
                  disabled={folderDialogPending}
                />
              </Field>
              {folderDialogError ? (
                <p className={styles.loadMoreError}>{folderDialogError}</p>
              ) : null}
            </div>
          )
        }
        dismissLabel="Cancel"
        confirmLabel={
          folderDialogPending
            ? folderDialog?.mode === "delete"
              ? "Deleting..."
              : "Saving..."
            : folderDialog?.mode === "create"
              ? "Create folder"
              : folderDialog?.mode === "rename"
                ? "Save changes"
                : "Delete folder"
        }
        confirmVariant={folderDialog?.mode === "delete" ? "destructive" : "primary"}
        tone={folderDialog?.mode === "delete" ? "fail" : "none"}
        onDismiss={() => {
          if (folderDialogPending) {
            return;
          }

          setFolderDialog(null);
          setFolderDialogError(null);
        }}
        onConfirm={() => {
          void handleConfirmFolderDialog();
        }}
        confirmDisabled={folderDialogPending}
        dismissDisabled={folderDialogPending}
      />

      <Modal
        isOpen={moveDialog !== null}
        title={moveDialog ? `Move ${moveDialog.title}` : "Move design"}
        description={
          <div className={styles.folderModalContent}>
            <Field label="Destination">
              <FieldSelect
                value={moveTargetFolderId}
                onChange={(event) => setMoveTargetFolderId(event.target.value)}
                disabled={moveDialogPending}
              >
                <option value="">All Designs</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </FieldSelect>
            </Field>
            {moveDialogError ? (
              <p className={styles.loadMoreError}>{moveDialogError}</p>
            ) : null}
          </div>
        }
        dismissLabel="Cancel"
        confirmLabel={moveDialogPending ? "Moving..." : "Move"}
        onDismiss={() => {
          if (moveDialogPending) {
            return;
          }

          setMoveDialog(null);
          setMoveDialogError(null);
        }}
        onConfirm={() => {
          void handleConfirmMoveDialog();
        }}
        confirmDisabled={moveDialogPending}
        dismissDisabled={moveDialogPending}
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

            {collectionView === "active" ? (
              <button
                type="button"
                className={styles.bulkBarAction}
                onClick={handleRequestMoveSelectedDesigns}
                disabled={selectedDesignCount === 0}
              >
                <ButtonIcon icon="/icons/lucide/folder-plus.svg" />
                <span>Move</span>
              </button>
            ) : null}

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
