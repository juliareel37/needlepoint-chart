"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOpenSignIn } from "@/components/auth/useOpenSignIn";
import { useAuthStatus } from "@/lib/auth/client";
import { createEditorStateFromDocument } from "@/lib/editor-v2/editor/store/createEditorStateFromDocument";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import { EDITOR_V2_SAVE_MODE } from "@/lib/editor-v2/config";
import { EditorV2Providers } from "./EditorV2Providers";
import {
  EditorV2SetupModal,
  type EditorV2DesignConfig,
  type EditorV2DesignConfigNew,
} from "./EditorV2SetupModal";
import {
  EditorV2Workspace,
  type EditorV2SuccessNotification,
} from "./EditorV2Workspace";
import {
  deleteSavedEditorV2Document,
  listEditorV2DesignVersions,
  listSavedEditorV2Documents,
  loadEditorV2DesignVersion,
  loadSavedEditorV2Document,
  restoreEditorV2DesignVersion,
  saveEditorV2Document,
  type EditorDesignVersionListItem,
  type LoadEditorV2VersionResult,
  type SaveEditorV2DocumentResult,
  type SavedEditorV2DocumentRecord,
} from "./editorV2ServerPersistence";
import {
  deleteLocalSnapshot,
  readLocalSnapshot,
  shouldRecoverLocalSnapshot,
  type EditorV2LocalSnapshotRecord,
} from "./editorV2AutosavePersistence";
import {
  consumeEditorV2AuthHandoffFromUrl,
  createEditorV2AuthHandoffRedirectUrl,
} from "./editorV2AuthHandoff";

const INITIAL_DESIGN_CONFIG: EditorV2DesignConfig = {
  kind: "new",
  draftId: "local_initial",
  width: 8,
  height: 8,
  sizingMode: "stitches",
  meshCount: null,
  widthInches: null,
  heightInches: null,
  instanceKey: "design_8x8_initial",
};
const DUPLICATE_QUERY_PARAM = "duplicate";
const DUPLICATE_STORAGE_PREFIX = "editor-v2-duplicate:";
const PENDING_SAVED_ROUTE_HANDOFF_STORAGE_KEY = "editor-v2-pending-saved-route";
const SAVED_DOCUMENTS_PAGE_SIZE = 6;
const AUTH_HANDOFF_LOCAL_RESTORE_DELAY_MS = 1500;
const pendingSavedRouteHandoffCache = new Map<string, PendingSavedRouteHandoff>();

interface VersionPreviewSession {
  liveDocument: EditorDocumentState;
  liveStorageId: string;
  liveVersionToken: string | null;
  previewVersionId: string;
  previewCreatedAt: string;
  previewSaveSource: LoadEditorV2VersionResult["saveSource"];
}

export function EditorV2Page({
  routeMode,
  routeStorageId,
}: {
  routeMode: "entry" | "saved";
  routeStorageId: string | null;
}) {
  const { isLoaded, isSignedIn } = useAuthStatus();
  const router = useRouter();
  const openSignIn = useOpenSignIn();
  const [mounted, setMounted] = useState(false);
  const [draftWidth, setDraftWidth] = useState("120");
  const [draftHeight, setDraftHeight] = useState("120");
  const [draftSizingMode, setDraftSizingMode] = useState<"stitches" | "inches">(
    "inches",
  );
  const [draftWidthInches, setDraftWidthInches] = useState("8");
  const [draftHeightInches, setDraftHeightInches] = useState("8");
  const [draftMeshCount, setDraftMeshCount] = useState("10");
  const [savedDocuments, setSavedDocuments] = useState<SavedEditorV2DocumentRecord[]>([]);
  const [savedDocumentsLoading, setSavedDocumentsLoading] = useState(false);
  const [savedDocumentsHasMore, setSavedDocumentsHasMore] = useState(false);
  const [savedDocumentsLoadingMore, setSavedDocumentsLoadingMore] = useState(false);
  const [designConfig, setDesignConfig] =
    useState<EditorV2DesignConfig>(INITIAL_DESIGN_CONFIG);
  const [currentStorageId, setCurrentStorageId] = useState("");
  const [currentServerVersion, setCurrentServerVersion] = useState<string | null>(null);
  const [initialRecoveredLocalChanges, setInitialRecoveredLocalChanges] = useState(false);
  const [initialDegradedLocalRecovery, setInitialDegradedLocalRecovery] = useState(false);
  const [initialLocalSnapshot, setInitialLocalSnapshot] =
    useState<EditorV2LocalSnapshotRecord | null>(null);
  const [selectedStorageId, setSelectedStorageId] = useState("");
  const [setupModalOpen, setSetupModalOpen] = useState(() => routeMode === "entry");
  const [setupModalMode, setSetupModalMode] = useState<"full" | "new-only">("full");
  const [canvasLoadingKey, setCanvasLoadingKey] = useState<string | null>(null);
  const [creatingPersistedDraft, setCreatingPersistedDraft] = useState(false);
  const [authHandoffLocalRestoreReady, setAuthHandoffLocalRestoreReady] = useState(false);
  const [savedDocumentsErrorMessage, setSavedDocumentsErrorMessage] =
    useState<string | null>(null);
  const [setupErrorMessage, setSetupErrorMessage] = useState<string | null>(null);
  const [isVersionHistoryMode, setIsVersionHistoryMode] = useState(false);
  const [versionPreviewSession, setVersionPreviewSession] =
    useState<VersionPreviewSession | null>(null);
  const [restoreSuccessNotification, setRestoreSuccessNotification] =
    useState<EditorV2SuccessNotification | null>(null);
  const previousRouteRef = useRef<
    { mode: "entry" | "saved"; storageId: string | null } | undefined
  >(undefined);
  const pendingEntryRouteModeRef = useRef<"full" | "new-only" | null>(null);
  const hasLoadedSavedDocumentsRef = useRef(false);
  const nextSavedDocumentsOffsetRef = useRef(0);
  const pendingAuthHandoffDocumentRef = useRef<EditorDocumentState | null>(null);
  const persistingAuthHandoffRef = useRef(false);
  const didConsumeAuthHandoffRef = useRef(false);
  const isInitialSession =
    designConfig.kind === "new" &&
    designConfig.instanceKey === INITIAL_DESIGN_CONFIG.instanceKey &&
    currentStorageId.length === 0;
  const activeDraftId =
    designConfig.kind === "new"
      ? designConfig.draftId
      : designConfig.document.project.id;
  const hasSavedDesignAccess = mounted && isLoaded && isSignedIn;

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetCurrentDesignState = useCallback(() => {
    setCurrentStorageId("");
    setCurrentServerVersion(null);
    setInitialRecoveredLocalChanges(false);
    setInitialDegradedLocalRecovery(false);
    setInitialLocalSnapshot(null);
    setSelectedStorageId("");
    setSetupErrorMessage(null);
    setCanvasLoadingKey(null);
    setVersionPreviewSession(null);
  }, []);

  const openEntryRoute = useCallback(
    (mode: "full" | "new-only" = "full") => {
      resetCurrentDesignState();
      setSetupModalMode(mode);
      setDesignConfig(INITIAL_DESIGN_CONFIG);
      setSetupModalOpen(true);
    },
    [resetCurrentDesignState],
  );

  const navigateToEntryRoute = useCallback(
    (mode: "full" | "new-only" = "full") => {
      pendingEntryRouteModeRef.current = mode;

      if (routeMode === "entry") {
        openEntryRoute(mode);
        return;
      }

      router.push("/editor");
    },
    [openEntryRoute, routeMode, router],
  );

  const loadSavedDocuments = useCallback(async () => {
    if (!isLoaded || !isSignedIn || savedDocumentsLoading || hasLoadedSavedDocumentsRef.current) {
      return;
    }

    setSavedDocumentsLoading(true);

    try {
      const result = await listSavedEditorV2Documents({
        limit: SAVED_DOCUMENTS_PAGE_SIZE,
        offset: 0,
      });
      hasLoadedSavedDocumentsRef.current = true;
      nextSavedDocumentsOffsetRef.current =
        result.nextOffset ?? result.documents.length;
      setSavedDocuments(result.documents);
      setSavedDocumentsHasMore(result.hasMore);
      setSavedDocumentsErrorMessage(null);
    } catch (error) {
      nextSavedDocumentsOffsetRef.current = 0;
      setSavedDocuments([]);
      setSavedDocumentsHasMore(false);
      setSavedDocumentsErrorMessage(
        getErrorMessage(error, "Try signing in again or refreshing the page."),
      );
    } finally {
      setSavedDocumentsLoading(false);
    }
  }, [isLoaded, isSignedIn, savedDocumentsLoading]);

  const loadMoreSavedDocuments = useCallback(async () => {
    if (
      !isLoaded ||
      !isSignedIn ||
      !hasLoadedSavedDocumentsRef.current ||
      savedDocumentsLoading ||
      savedDocumentsLoadingMore ||
      !savedDocumentsHasMore
    ) {
      return;
    }

    setSavedDocumentsLoadingMore(true);

    try {
      const result = await listSavedEditorV2Documents({
        limit: SAVED_DOCUMENTS_PAGE_SIZE,
        offset: nextSavedDocumentsOffsetRef.current,
      });
      nextSavedDocumentsOffsetRef.current =
        result.nextOffset ?? nextSavedDocumentsOffsetRef.current + result.documents.length;
      setSavedDocuments((existing) => [
        ...existing,
        ...result.documents.filter(
          (candidate) =>
            !existing.some((record) => record.storageId === candidate.storageId),
        ),
      ]);
      setSavedDocumentsHasMore(result.hasMore);
      setSavedDocumentsErrorMessage(null);
    } catch (error) {
      setSavedDocumentsErrorMessage(
        getErrorMessage(error, "Try signing in again or refreshing the page."),
      );
    } finally {
      setSavedDocumentsLoadingMore(false);
    }
  }, [
    isLoaded,
    isSignedIn,
    savedDocumentsHasMore,
    savedDocumentsLoading,
    savedDocumentsLoadingMore,
  ]);

  const restoreAuthHandoffDocumentLocally = useCallback(
    (document: EditorDocumentState) => {
      pendingAuthHandoffDocumentRef.current = null;
      resetCurrentDesignState();
      setSetupModalMode("full");
      setDesignConfig({
        kind: "loaded",
        document,
        storageId: "",
        instanceKey: `auth_handoff_${document.project.id ?? Date.now()}`,
      });
      setSetupModalOpen(false);
    },
    [resetCurrentDesignState],
  );

  const applySavedRouteState = useCallback(
    (
      document: EditorDocumentState,
      savedRecord: SaveEditorV2DocumentResult,
      navigationMode: "push" | "replace",
    ) => {
      const loadedDocument = applySavedRecordToDocument(document, savedRecord);
      const nextRoute = `/editor/designs/${savedRecord.storageId}`;

      persistPendingSavedRouteHandoff({
        storageId: savedRecord.storageId,
        versionToken: savedRecord.versionToken,
        document: loadedDocument,
      });
      setSavedDocuments((existing) => {
        const nextRecord: SavedEditorV2DocumentRecord = {
          storageId: savedRecord.storageId,
          title: savedRecord.title,
          gridWidth: savedRecord.gridWidth,
          gridHeight: savedRecord.gridHeight,
          updatedAt: savedRecord.updatedAt,
        };

        return [
          nextRecord,
          ...existing.filter((record) => record.storageId !== nextRecord.storageId),
        ];
      });
      nextSavedDocumentsOffsetRef.current = Math.max(
        nextSavedDocumentsOffsetRef.current,
        savedDocuments.length + 1,
      );
      setCurrentStorageId(savedRecord.storageId);
      setCurrentServerVersion(savedRecord.versionToken);
      setSelectedStorageId(savedRecord.storageId);
      setCanvasLoadingKey("saved_route_handoff");
      setSetupModalOpen(false);
      setIsVersionHistoryMode(false);
      setVersionPreviewSession(null);

      if (navigationMode === "push") {
        router.push(nextRoute);
        return;
      }

      router.replace(nextRoute);
    },
    [resetCurrentDesignState, router, savedDocuments.length],
  );

  const openLoadedDesignState = useCallback(
    ({
      document,
      storageId,
      versionToken,
      instanceKey,
      recoveredLocalChanges = false,
      degradedLocalRecovery = false,
      localSnapshot = null,
    }: {
      document: EditorDocumentState;
      storageId: string;
      versionToken: string | null;
      instanceKey: string;
      recoveredLocalChanges?: boolean;
      degradedLocalRecovery?: boolean;
      localSnapshot?: EditorV2LocalSnapshotRecord | null;
    }) => {
      setCurrentStorageId(storageId);
      setCurrentServerVersion(versionToken);
      setSelectedStorageId(storageId);
      setInitialRecoveredLocalChanges(recoveredLocalChanges);
      setInitialDegradedLocalRecovery(degradedLocalRecovery);
      setInitialLocalSnapshot(localSnapshot);
      setSetupErrorMessage(null);
      setDesignConfig({
        kind: "loaded",
        document,
        storageId,
        instanceKey,
      });
      setCanvasLoadingKey(instanceKey);
      setSetupModalOpen(false);
    },
    [],
  );

  const previewVersionInWorkspace = useCallback(
    async ({
      storageId,
      versionId,
      currentDocument,
    }: {
      storageId: string;
      versionId: string;
      currentDocument: EditorDocumentState;
    }) => {
      const loadedVersion = await loadEditorV2DesignVersion(storageId, versionId);
      const baseLiveDocument = versionPreviewSession?.liveDocument ?? currentDocument;
      const baseLiveVersionToken =
        versionPreviewSession?.liveVersionToken ?? currentServerVersion;
      setVersionPreviewSession({
        liveDocument: baseLiveDocument,
        liveStorageId: storageId,
        liveVersionToken: baseLiveVersionToken,
        previewVersionId: loadedVersion.versionId,
        previewCreatedAt: loadedVersion.createdAt,
        previewSaveSource: loadedVersion.saveSource,
      });
      openLoadedDesignState({
        document: loadedVersion.document,
        storageId,
        versionToken: baseLiveVersionToken ?? null,
        instanceKey: `preview_${storageId}_${loadedVersion.versionId}_${Date.now()}`,
      });
    },
    [currentServerVersion, openLoadedDesignState, versionPreviewSession],
  );

  const exitVersionPreview = useCallback(() => {
    if (!versionPreviewSession) {
      return;
    }

    openLoadedDesignState({
      document: versionPreviewSession.liveDocument,
      storageId: versionPreviewSession.liveStorageId,
      versionToken: versionPreviewSession.liveVersionToken ?? null,
      instanceKey: `preview_exit_${versionPreviewSession.liveStorageId}_${Date.now()}`,
    });
    setVersionPreviewSession(null);
  }, [openLoadedDesignState, versionPreviewSession]);

  const previewCurrentVersionInHistoryMode = useCallback(() => {
    if (!versionPreviewSession) {
      return;
    }

    openLoadedDesignState({
      document: versionPreviewSession.liveDocument,
      storageId: versionPreviewSession.liveStorageId,
      versionToken: versionPreviewSession.liveVersionToken ?? null,
      instanceKey: `preview_current_${versionPreviewSession.liveStorageId}_${Date.now()}`,
    });
    setVersionPreviewSession(null);
  }, [openLoadedDesignState, versionPreviewSession]);

  const exitVersionHistoryMode = useCallback(() => {
    if (versionPreviewSession) {
      openLoadedDesignState({
        document: versionPreviewSession.liveDocument,
        storageId: versionPreviewSession.liveStorageId,
        versionToken: versionPreviewSession.liveVersionToken ?? null,
        instanceKey: `version_history_exit_${versionPreviewSession.liveStorageId}_${Date.now()}`,
      });
      setVersionPreviewSession(null);
    }

    setIsVersionHistoryMode(false);
  }, [openLoadedDesignState, versionPreviewSession]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      if (pendingAuthHandoffDocumentRef.current) {
        return;
      }

      hasLoadedSavedDocumentsRef.current = false;
      nextSavedDocumentsOffsetRef.current = 0;
      setSavedDocumentsLoading(false);
      setSavedDocumentsLoadingMore(false);
      setSavedDocuments([]);
      setSavedDocumentsErrorMessage(null);
      setSavedDocumentsHasMore(false);
      pendingAuthHandoffDocumentRef.current = null;
      didConsumeAuthHandoffRef.current = false;
      setAuthHandoffLocalRestoreReady(false);
      resetCurrentDesignState();
    }
  }, [isLoaded, isSignedIn, resetCurrentDesignState]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    const duplicateToken = url.searchParams.get(DUPLICATE_QUERY_PARAM);

    if (!duplicateToken) {
      return;
    }

    const storageKey = `${DUPLICATE_STORAGE_PREFIX}${duplicateToken}`;
    const rawPayload = window.localStorage.getItem(storageKey);

    window.localStorage.removeItem(storageKey);
    url.searchParams.delete(DUPLICATE_QUERY_PARAM);
    window.history.replaceState({}, "", url.toString());

    if (!rawPayload) {
      return;
    }

    const duplicatedDocument = parseDuplicatedDocument(rawPayload);

    if (!duplicatedDocument) {
      return;
    }

    resetCurrentDesignState();
    setSetupModalMode("full");
    setDesignConfig({
      kind: "loaded",
      document: duplicatedDocument,
      storageId: "",
      instanceKey: `duplicate_${duplicatedDocument.project.id ?? Date.now()}`,
    });
    setSetupModalOpen(false);
  }, [resetCurrentDesignState]);

  useEffect(() => {
    if (didConsumeAuthHandoffRef.current) {
      return;
    }

    const handedOffDocument = consumeEditorV2AuthHandoffFromUrl();

    if (!handedOffDocument) {
      return;
    }

    didConsumeAuthHandoffRef.current = true;
    pendingAuthHandoffDocumentRef.current = handedOffDocument;
    setAuthHandoffLocalRestoreReady(false);
    resetCurrentDesignState();
    setCanvasLoadingKey("auth_handoff_restore");
    setSetupModalOpen(false);
  }, [resetCurrentDesignState]);

  useEffect(() => {
    const handedOffDocument = pendingAuthHandoffDocumentRef.current;

    if (!handedOffDocument || !isLoaded || isSignedIn) {
      setAuthHandoffLocalRestoreReady(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAuthHandoffLocalRestoreReady(true);
    }, AUTH_HANDOFF_LOCAL_RESTORE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isLoaded, isSignedIn, currentStorageId]);

  useEffect(() => {
    const handedOffDocument = pendingAuthHandoffDocumentRef.current;

    if (
      !isLoaded ||
      !handedOffDocument ||
      currentStorageId
    ) {
      return;
    }

    if (!isSignedIn) {
      if (!authHandoffLocalRestoreReady) {
        return;
      }

      restoreAuthHandoffDocumentLocally(handedOffDocument);
      return;
    }

    if (persistingAuthHandoffRef.current) {
      return;
    }

    persistingAuthHandoffRef.current = true;
    setCreatingPersistedDraft(true);
    setSetupErrorMessage(null);
    setCanvasLoadingKey("auth_handoff_restore");
    setSetupModalOpen(false);

    void saveEditorV2Document(handedOffDocument)
      .then((savedRecord) => {
        pendingAuthHandoffDocumentRef.current = null;
        setAuthHandoffLocalRestoreReady(false);
        applySavedRouteState(handedOffDocument, savedRecord, "replace");
      })
      .catch((error) => {
        setSetupErrorMessage(
          getErrorMessage(error, "Couldn't finish restoring your design."),
        );
        setAuthHandoffLocalRestoreReady(true);
        restoreAuthHandoffDocumentLocally(handedOffDocument);
      })
      .finally(() => {
        persistingAuthHandoffRef.current = false;
        setCreatingPersistedDraft(false);
      });
  }, [
    applySavedRouteState,
    authHandoffLocalRestoreReady,
    currentStorageId,
    isLoaded,
    isSignedIn,
    restoreAuthHandoffDocumentLocally,
  ]);

  const initialState = useMemo(() => {
    if (designConfig.kind === "loaded") {
      return createEditorStateFromDocument(designConfig.document);
    }

    return createNewDesignState(designConfig.width, designConfig.height, {
      projectId: designConfig.draftId,
      sizingMode: designConfig.sizingMode,
      meshCount: designConfig.meshCount,
      widthInches: designConfig.widthInches,
      heightInches: designConfig.heightInches,
    });
  }, [designConfig]);

  const loadDesignIntoWorkspace = useCallback(async (storageId: string) => {
    const instanceKey = `loaded_${storageId}_${Date.now()}`;
    setCanvasLoadingKey(instanceKey);
    setVersionPreviewSession(null);

    try {
      const loaded = await loadSavedEditorV2Document(storageId);
      const localSnapshot = await readLocalSnapshot(storageId);
      const shouldRecover = shouldRecoverLocalSnapshot({
        localSnapshot,
        currentServerVersion: loaded.versionToken,
      });
      const document = shouldRecover && localSnapshot
        ? localSnapshot.document
        : loaded.document;
      openLoadedDesignState({
        document,
        storageId,
        versionToken: loaded.versionToken,
        instanceKey,
        recoveredLocalChanges: shouldRecover,
        degradedLocalRecovery: localSnapshot?.degradedLocalRecovery ?? false,
        localSnapshot: shouldRecover ? localSnapshot : null,
      });
    } catch (error) {
      setCanvasLoadingKey(null);
      throw error;
    }
  }, [openLoadedDesignState]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const previousRoute = previousRouteRef.current;
    previousRouteRef.current = { mode: routeMode, storageId: routeStorageId };

    if (routeMode === "saved" && routeStorageId) {
      if (isLocalDesignId(routeStorageId)) {
        if (activeDraftId === routeStorageId && !setupModalOpen) {
          return;
        }

        void readLocalSnapshot(routeStorageId)
          .then((localSnapshot) => {
            if (!localSnapshot) {
              router.replace("/editor");
              return;
            }

            resetCurrentDesignState();
            setInitialRecoveredLocalChanges(localSnapshot.recoveredLocalChanges);
            setInitialDegradedLocalRecovery(localSnapshot.degradedLocalRecovery);
            setInitialLocalSnapshot(localSnapshot);
            setDesignConfig({
              kind: "loaded",
              document: localSnapshot.document,
              storageId: "",
              instanceKey: `draft_${routeStorageId}_${Date.now()}`,
            });
            setSetupModalOpen(false);
          })
          .catch(() => {
            router.replace("/editor");
          });
        return;
      }

      const pendingSavedRouteHandoff = consumePendingSavedRouteHandoff(routeStorageId);

      if (pendingSavedRouteHandoff) {
        const instanceKey = `loaded_${routeStorageId}_${Date.now()}`;

        resetCurrentDesignState();
        setCurrentStorageId(routeStorageId);
        setCurrentServerVersion(pendingSavedRouteHandoff.versionToken);
        setSelectedStorageId(routeStorageId);
        setInitialRecoveredLocalChanges(false);
        setInitialDegradedLocalRecovery(false);
        setInitialLocalSnapshot(null);
        setDesignConfig({
          kind: "loaded",
          document: pendingSavedRouteHandoff.document,
          storageId: routeStorageId,
          instanceKey,
        });
        setCanvasLoadingKey(instanceKey);
        setSetupModalOpen(false);
        return;
      }

      if (
        currentStorageId === routeStorageId &&
        designConfig.kind === "loaded"
      ) {
        if (!(setupModalOpen && setupModalMode === "new-only")) {
          setSetupModalOpen(false);
        }
        setSelectedStorageId(routeStorageId);
        return;
      }

      void loadDesignIntoWorkspace(routeStorageId).catch((error) => {
        const message = getErrorMessage(error, "Try again in a moment.");
        navigateToEntryRoute("full");
        setSetupErrorMessage(message);
      });
      return;
    }

    const pendingEntryMode = pendingEntryRouteModeRef.current;

    if (pendingEntryMode) {
      pendingEntryRouteModeRef.current = null;
      openEntryRoute(pendingEntryMode);
      return;
    }

    if (previousRoute?.mode === "saved") {
      openEntryRoute("full");
    }
  }, [
    currentStorageId,
    designConfig.kind,
    isLoaded,
    loadDesignIntoWorkspace,
    openEntryRoute,
    resetCurrentDesignState,
    activeDraftId,
    isInitialSession,
    navigateToEntryRoute,
    routeMode,
    routeStorageId,
    setupModalOpen,
  ]);

  if (!mounted) {
    return null;
  }

  return (
    <EditorV2Providers
      key={designConfig.instanceKey}
      initialState={initialState}
    >
      <EditorV2Workspace
        canvasLoading={canvasLoadingKey !== null}
        hasSavedDesignAccess={hasSavedDesignAccess}
        onCanvasReady={() => {
          setCanvasLoadingKey((currentKey) =>
            currentKey === designConfig.instanceKey ? null : currentKey,
          );
        }}
        currentStorageId={currentStorageId}
        currentServerVersion={currentServerVersion}
        initialRecoveredLocalChanges={initialRecoveredLocalChanges}
        initialDegradedLocalRecovery={initialDegradedLocalRecovery}
        initialLocalSnapshot={initialLocalSnapshot}
        isVersionHistoryMode={isVersionHistoryMode}
        isVersionPreview={versionPreviewSession !== null}
        versionPreviewMeta={
          versionPreviewSession
            ? {
                versionId: versionPreviewSession.previewVersionId,
                createdAt: versionPreviewSession.previewCreatedAt,
                saveSource: versionPreviewSession.previewSaveSource,
              }
            : null
        }
        saveMode={EDITOR_V2_SAVE_MODE}
        savedDocuments={savedDocuments}
        savedDocumentsLoading={savedDocumentsLoading}
        savedDocumentsHasMore={savedDocumentsHasMore}
        savedDocumentsLoadingMore={savedDocumentsLoadingMore}
        onOpenSavedDocuments={loadSavedDocuments}
        onLoadMoreSavedDocuments={loadMoreSavedDocuments}
        selectedStorageId={selectedStorageId}
        setSelectedStorageId={setSelectedStorageId}
        onSaveDocument={async (
          document,
          storageId,
          baseVersion,
          saveSource: "manual" | "autosave" = "manual",
          forceVersion = false,
        ) => {
          if (!isLoaded || !isSignedIn) {
            openSignIn({
              redirectUrl: createEditorV2AuthHandoffRedirectUrl(
                document,
                typeof window !== "undefined"
                  ? `${window.location.pathname}${window.location.search}`
                  : `/editor/designs/${document.project.id ?? "local_draft"}`,
              ),
            });
            return null;
          }

          const savedRecord = await saveEditorV2Document(
            document,
            storageId,
            baseVersion,
            saveSource,
            forceVersion,
          );
          setCurrentStorageId(savedRecord.storageId);
          setCurrentServerVersion(savedRecord.versionToken);
          setSelectedStorageId(savedRecord.storageId);
          setInitialRecoveredLocalChanges(false);
          setInitialDegradedLocalRecovery(false);
          setInitialLocalSnapshot(null);
          setSetupErrorMessage(null);
          setSavedDocuments((existing) => {
            const nextRecord: SavedEditorV2DocumentRecord = {
              storageId: savedRecord.storageId,
              title: savedRecord.title,
              gridWidth: savedRecord.gridWidth,
              gridHeight: savedRecord.gridHeight,
              updatedAt: savedRecord.updatedAt,
            };

            return [
              nextRecord,
              ...existing.filter((record) => record.storageId !== nextRecord.storageId),
            ];
          });
          nextSavedDocumentsOffsetRef.current = Math.max(
            nextSavedDocumentsOffsetRef.current,
            savedDocuments.length + 1,
          );
          router.replace(`/editor/designs/${savedRecord.storageId}`);
          return savedRecord;
        }}
        onListVersions={async (storageId) => listEditorV2DesignVersions(storageId)}
        onEnterVersionHistoryMode={() => {
          setIsVersionHistoryMode(true);
        }}
        onExitVersionHistoryMode={() => {
          exitVersionHistoryMode();
        }}
        onPreviewVersion={async (storageId, versionId, currentDocument) => {
          await previewVersionInWorkspace({
            storageId,
            versionId,
            currentDocument,
          });
        }}
        onExitVersionPreview={() => {
          exitVersionPreview();
        }}
        onSelectCurrentVersionInHistoryMode={() => {
          previewCurrentVersionInHistoryMode();
        }}
        onRestoreVersion={async (storageId, versionId) => {
          const restored = await restoreEditorV2DesignVersion(storageId, versionId);
          setSavedDocuments((existing) => {
            const nextRecord: SavedEditorV2DocumentRecord = {
              storageId: restored.storageId,
              title: restored.title,
              gridWidth: restored.gridWidth,
              gridHeight: restored.gridHeight,
              updatedAt: restored.updatedAt,
            };

            return [
              nextRecord,
              ...existing.filter((record) => record.storageId !== nextRecord.storageId),
            ];
          });
          nextSavedDocumentsOffsetRef.current = Math.max(
            nextSavedDocumentsOffsetRef.current,
            savedDocuments.length + 1,
          );
          setIsVersionHistoryMode(false);
          setVersionPreviewSession(null);
          openLoadedDesignState({
            document: restored.document,
            storageId: restored.storageId,
            versionToken: restored.versionToken,
            instanceKey: `restored_${restored.storageId}_${Date.now()}`,
          });
          setRestoreSuccessNotification({
            title: "Version restored",
            // description: "The selected version is now the current design.",
          });
          router.replace(`/editor/designs/${restored.storageId}`);
          return restored;
        }}
        onRestoreVersionAsCopy={async (storageId, versionId) => {
          const restored = await restoreEditorV2DesignVersion(storageId, versionId, {
            mode: "copy",
          });
          setSavedDocuments((existing) => {
            const nextRecord: SavedEditorV2DocumentRecord = {
              storageId: restored.storageId,
              title: restored.title,
              gridWidth: restored.gridWidth,
              gridHeight: restored.gridHeight,
              updatedAt: restored.updatedAt,
            };

            return [
              nextRecord,
              ...existing.filter((record) => record.storageId !== nextRecord.storageId),
            ];
          });
          nextSavedDocumentsOffsetRef.current = Math.max(
            nextSavedDocumentsOffsetRef.current,
            savedDocuments.length + 1,
          );
          setRestoreSuccessNotification({
            title: "Copy created",
          });
          return restored;
        }}
        onLoadDocument={async (record) => {
          setSelectedStorageId(record.storageId);
          router.push(`/editor/designs/${record.storageId}`);
        }}
        onDeleteCurrentDesign={async (document) => {
          const localSnapshotKey = currentStorageId || document.project.id;

          if (currentStorageId) {
            await deleteSavedEditorV2Document(currentStorageId);
            setSavedDocuments((existing) =>
              existing.filter((record) => record.storageId !== currentStorageId),
            );
          }

          if (localSnapshotKey) {
            await deleteLocalSnapshot(localSnapshotKey);
          }

          navigateToEntryRoute("full");
        }}
        onStartOver={() => {
          setSetupErrorMessage(null);
          setSetupModalMode("new-only");
          setSetupModalOpen(true);
        }}
        persistentSuccessNotification={restoreSuccessNotification}
        onDismissPersistentSuccessNotification={() => setRestoreSuccessNotification(null)}
        setupModalOpen={setupModalOpen}
        setupModal={
          <EditorV2SetupModal
            canClose={!isInitialSession}
            draftHeight={draftHeight}
            draftHeightInches={draftHeightInches}
            draftMeshCount={draftMeshCount}
            draftSizingMode={draftSizingMode}
            draftWidth={draftWidth}
            draftWidthInches={draftWidthInches}
            hasSavedDesignAccess={hasSavedDesignAccess}
            mode={setupModalMode}
            creatingDesign={creatingPersistedDraft}
            hasMoreSavedDocuments={savedDocumentsHasMore}
            onDismissSavedDocumentsError={() => setSavedDocumentsErrorMessage(null)}
            onDismissSetupError={() => setSetupErrorMessage(null)}
            onOpenSavedDocuments={loadSavedDocuments}
            onLoadMoreSavedDocuments={loadMoreSavedDocuments}
            onSignIn={() => {
              if (isInitialSession && setupModalOpen) {
                openSignIn({
                  redirectUrl:
                    typeof window !== "undefined"
                      ? `${window.location.pathname}${window.location.search}`
                      : "/editor",
                });
                return;
              }

              openSignIn({
                redirectUrl: createEditorV2AuthHandoffRedirectUrl(
                  initialState.document,
                  typeof window !== "undefined"
                    ? `${window.location.pathname}${window.location.search}`
                    : "/editor",
                ),
              });
            }}
            onClose={() => setSetupModalOpen(false)}
            onCreateDesign={async (config) => {
              if (isLoaded && isSignedIn) {
                setCreatingPersistedDraft(true);
                setSetupErrorMessage(null);

                try {
                  const persistedDraft = createPersistedDraftDocument(config);
                  const savedRecord = await saveEditorV2Document(
                    persistedDraft,
                    undefined,
                    null,
                    "manual",
                  );
                  applySavedRouteState(persistedDraft, savedRecord, "push");
                } catch (error) {
                  setSetupErrorMessage(
                    getErrorMessage(error, "Couldn't create a new design."),
                  );
                } finally {
                  setCreatingPersistedDraft(false);
                }
                return;
              }

              resetCurrentDesignState();
              setSetupModalMode("full");
              setDesignConfig(config);
              setSetupModalOpen(false);
            }}
            onDraftHeightChange={setDraftHeight}
            onDraftHeightInchesChange={setDraftHeightInches}
            onDraftMeshCountChange={setDraftMeshCount}
            onDraftSizingModeChange={setDraftSizingMode}
            onDraftWidthChange={setDraftWidth}
            onDraftWidthInchesChange={setDraftWidthInches}
            onLoadSavedDesign={(storageId) => {
              setSelectedStorageId(storageId);
              setSetupErrorMessage(null);
              router.push(`/editor/designs/${storageId}`);
            }}
            savedDocuments={savedDocuments}
            savedDocumentsLoading={savedDocumentsLoading}
            savedDocumentsLoadingMore={savedDocumentsLoadingMore}
            savedDocumentsErrorMessage={savedDocumentsErrorMessage}
            selectedStorageId={selectedStorageId}
            setSelectedStorageId={setSelectedStorageId}
            setupErrorMessage={setupErrorMessage}
          />
        }
      />
    </EditorV2Providers>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function parseDuplicatedDocument(rawPayload: string): EditorDocumentState | null {
  try {
    const candidate = JSON.parse(rawPayload) as EditorDocumentState;

    if (!candidate || typeof candidate !== "object") {
      return null;
    }

    if (
      !candidate.project ||
      !candidate.grid ||
      !candidate.palette ||
      !candidate.text ||
      typeof candidate.project.title !== "string" ||
      typeof candidate.grid.width !== "number" ||
      typeof candidate.grid.height !== "number" ||
      !Array.isArray(candidate.grid.cells)
    ) {
      return null;
    }

    return candidate;
  } catch {
    return null;
  }
}

function createPersistedDraftDocument(
  config: EditorV2DesignConfigNew,
): EditorDocumentState {
  return createNewDesignState(config.width, config.height, {
    projectId: config.draftId,
    sizingMode: config.sizingMode,
    meshCount: config.meshCount,
    widthInches: config.widthInches,
    heightInches: config.heightInches,
  }).document;
}

function applySavedRecordToDocument(
  document: EditorDocumentState,
  savedRecord: SaveEditorV2DocumentResult,
): EditorDocumentState {
  return {
    ...document,
    project: {
      ...document.project,
      id: savedRecord.storageId,
      title: savedRecord.title,
      createdAt: savedRecord.createdAt,
      updatedAt: savedRecord.updatedAt,
    },
  };
}

function isLocalDesignId(designId: string): boolean {
  return designId.startsWith("local_");
}

interface PendingSavedRouteHandoff {
  storageId: string;
  versionToken: string;
  document: EditorDocumentState;
}

function persistPendingSavedRouteHandoff(handoff: PendingSavedRouteHandoff): void {
  pendingSavedRouteHandoffCache.set(handoff.storageId, handoff);

  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    getPendingSavedRouteHandoffStorageKey(handoff.storageId),
    JSON.stringify(handoff),
  );
}

function consumePendingSavedRouteHandoff(
  storageId: string,
): PendingSavedRouteHandoff | null {
  const cachedHandoff = pendingSavedRouteHandoffCache.get(storageId);

  if (cachedHandoff) {
    pendingSavedRouteHandoffCache.delete(storageId);
    return cachedHandoff;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = getPendingSavedRouteHandoffStorageKey(storageId);
  const rawHandoff = window.sessionStorage.getItem(storageKey);

  if (!rawHandoff) {
    return null;
  }

  window.sessionStorage.removeItem(storageKey);

  try {
    const candidate = JSON.parse(rawHandoff) as PendingSavedRouteHandoff;

    if (
      !candidate ||
      candidate.storageId !== storageId ||
      typeof candidate.versionToken !== "string" ||
      !candidate.document ||
      typeof candidate.document !== "object"
    ) {
      return null;
    }

    if (
      !candidate.document.project ||
      !candidate.document.grid ||
      !candidate.document.palette ||
      !candidate.document.text ||
      typeof candidate.document.project.title !== "string" ||
      typeof candidate.document.grid.width !== "number" ||
      typeof candidate.document.grid.height !== "number" ||
      !Array.isArray(candidate.document.grid.cells)
    ) {
      return null;
    }

    return candidate;
  } catch {
    return null;
  }
}

function getPendingSavedRouteHandoffStorageKey(storageId: string): string {
  return `${PENDING_SAVED_ROUTE_HANDOFF_STORAGE_KEY}:${storageId}`;
}
