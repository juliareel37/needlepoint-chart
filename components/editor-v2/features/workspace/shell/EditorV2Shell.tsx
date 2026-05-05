"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { typographyStyles } from "@/app/design-system/typography";
import { useOpenSignIn } from "@/components/auth/useOpenSignIn";
import { IS_DEV_APP_MODE } from "@/lib/editor-v2/config";
import {
  getActiveColor,
  getActiveColorId,
  getCanRedo,
  getCanUndo,
  getPaletteColors,
  getSelectionBounds,
  getTraceDocument,
  getUsedColors,
  getViewport,
} from "@/lib/editor-v2/editor/selectors";
import { createGridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import {
  Button,
  ButtonIcon,
  MenuCaretIcon,
  MenuDivider,
  MenuItem,
  MenuSurface,
  MenuTrigger,
  SingleSelectDropdown,
  ToolbarButton,
  ToolbarIcon,
} from "@/components/design-system";
import { useEditorStoreDispatch, useEditorStoreSelector } from "../../../app/editorStoreContext";
import type {
  EditorDocumentState,
} from "@/lib/editor-v2/editor/store";
import type { TraceCropRect } from "@/lib/editor-v2/editor/trace/crop";
import {
  createFullTraceCrop,
  getNormalizedTraceCrop,
} from "@/lib/editor-v2/editor/trace/crop";
import {
  getContainedRect,
  getPositionedBounds,
} from "@/lib/editor-v2/editor/positioning";
import type { SavedEditorV2DocumentRecord } from "../../../app/editorV2ServerPersistence";
import type {
  EditorDesignVersionListItem,
  LoadEditorV2VersionResult,
  RestoreEditorV2VersionResult,
} from "../../../app/editorV2ServerPersistence";
import type {
  DeleteButtonState,
  ExportButtonState,
  EditorV2ErrorNotification,
  EditorV2SuccessNotification,
  SaveButtonState,
} from "../../../app/EditorV2Workspace";
import {
  createCancelTraceRepositionCommand,
  createCommitTraceRepositionCommand,
  createCancelIconPlacementCommand,
  createClearSelectionCommand,
  createRedoCommand,
  createSetActiveSidebarSectionCommand,
  createSetPreviewModeCommand,
  createPanViewportCommand,
  createSetSidebarCollapsedCommand,
  createSetViewportZoomCommand,
  createUpdateTraceCommand,
  createUndoCommand,
} from "../workspaceCommands";
import { EditorRail } from "./EditorRail";
import { EditorSidebar } from "./EditorSidebar";
import { FloatingToolbar } from "./FloatingToolbar";
import { Modal, Notification } from "@/components/design-system";
import { TextPlacementToolbar } from "./TextPlacementToolbar";
import { IconPlacementToolbar } from "./IconPlacementToolbar";
import { TraceRepositionToolbar } from "./TraceRepositionToolbar";
import {
  type TraceCropAspectRatioId,
} from "./TraceRepositionToolbar";
import { SaveStatusCard } from "./SaveStatusCard";
import { GridWorldSurface } from "../stage/GridWorldSurface";
import { ViewportToolbar } from "./ViewportToolbar";
import { EditableDesignTitle } from "./EditableDesignTitle";
import { createEditorV2AuthHandoffRedirectUrl } from "../../../app/editorV2AuthHandoff";
import styles from "./EditorV2Shell.module.css";

const EXPANDED_SIDEBAR_WIDTH = 320;
const DEFAULT_CELL_SIZE = 28;
const FIT_ZOOM_PADDING_FACTOR = 0.92;
const SAVE_SUCCESS_PREFIX = "Saved at ";
const AUTOSAVE_SUCCESS_PREFIX = "Autosaved at ";
const VERSION_SAVE_SUCCESS_PREFIX = "Version saved at ";
const VERSION_HISTORY_TRACE_OPACITY = 0.35;
const ERROR_NOTIFICATION_DURATION_MS = 8000;
const ENABLE_MOBILE_SELECTION_DOCK = false;
const DUPLICATE_QUERY_PARAM = "duplicate";
const DUPLICATE_STORAGE_PREFIX = "editor-v2-duplicate:";
const HEADER_FILE_RECENT_LIMIT = 5;
const versionHistoryCache = new Map<string, EditorDesignVersionListItem[]>();
const versionHistoryTimelineScrollCache = new Map<string, number>();
type HeaderFileMenuItem = {
  id: string;
  label: string;
  icon?: string;
  kind?: "action" | "divider";
};
const HEADER_FILE_MENU_ITEMS = [
  { id: "new", label: "Create new", icon: "/icons/lucide/file-plus-corner.svg" },
  { id: "duplicate", label: "Duplicate", icon: "/icons/lucide/copy.svg" },
  { id: "rename", label: "Rename", icon: "/icons/lucide/pencil.svg" },
  { id: "library", label: "My designs", icon: "/icons/lucide/list.svg" },
  { id: "divider-primary", label: "", kind: "divider" },
  { id: "version-history", label: "Version history", icon: "/icons/lucide/history.svg" },
  { id: "save-version", label: "Save snapshot", icon: "/icons/lucide/save.svg" },
  { id: "divider-secondary", label: "", kind: "divider" },
  { id: "download", label: "Download", icon: "/icons/lucide/download.svg" },
  { id: "delete", label: "Delete", icon: "/icons/lucide/trash.svg" },
] satisfies readonly HeaderFileMenuItem[];
const AUTH_REQUIRED_FILE_MENU_ACTION_IDS = new Set([
  "duplicate",
  "version-history",
  "save-version",
  "delete",
]);

function getAspectRatioValueFromId(
  value: TraceCropAspectRatioId,
  assetWidth: number,
  assetHeight: number,
): number | null {
  if (value === "freehand") {
    return null;
  }

  if (value === "original") {
    return assetWidth > 0 && assetHeight > 0 ? assetWidth / assetHeight : null;
  }

  const [widthText, heightText] = value.split(":");
  const width = Number(widthText);
  const height = Number(heightText);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return width / height;
}

function fitCropToAspectRatio(
  crop: TraceCropRect,
  aspectRatio: number | null,
  assetWidth: number,
  assetHeight: number,
): TraceCropRect {
  if (!aspectRatio || aspectRatio <= 0) {
    return crop;
  }

  const centeredWidth = Math.min(crop.cropWidth, crop.cropHeight * aspectRatio);
  const centeredHeight = centeredWidth / aspectRatio;
  const fallbackHeight = Math.min(crop.cropHeight, crop.cropWidth / aspectRatio);
  const nextWidth = centeredWidth > 0 ? centeredWidth : fallbackHeight * aspectRatio;
  const nextHeight = centeredWidth > 0 ? centeredHeight : fallbackHeight;
  const centerX = crop.cropX + crop.cropWidth / 2;
  const centerY = crop.cropY + crop.cropHeight / 2;

  return getNormalizedTraceCrop(
    {
      imageWidth: assetWidth,
      imageHeight: assetHeight,
      cropX: centerX - nextWidth / 2,
      cropY: centerY - nextHeight / 2,
      cropWidth: nextWidth,
      cropHeight: nextHeight,
    },
    assetWidth,
    assetHeight,
  );
}

type EditorV2WindowWithDraftGetter = Window & {
  __editorV2GetCurrentDocument?: () => EditorDocumentState;
  __editorV2ShouldPreserveDraftOnSignIn?: () => boolean;
};

interface PreviewSessionSnapshot {
  sidebarCollapsed: boolean;
  viewport: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
}

interface BottomPanelCanvasFocusSnapshot {
  viewport: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
}

export function EditorV2Shell({
  canvasLoading,
  currentStorageId,
  deleteButtonState,
  errorNotification,
  exportButtonState,
  hasSavedDesignAccess,
  onCanvasReady,
  onDeleteCurrentDesign,
  onDismissErrorNotification,
  onDismissSuccessNotification,
  onExportDocument,
  onSaveDocument,
  onSaveVersionSnapshot,
  onLoadDocument,
  onListVersions,
  onEnterVersionHistoryMode,
  onExitVersionHistoryMode,
  onPreviewVersion,
  onExitVersionPreview,
  onSelectCurrentVersionInHistoryMode,
  onRestoreVersion,
  onRestoreVersionAsCopy,
  onStartOver,
  onCloseSetupModal,
  hasPersistableUnsavedChanges,
  recoveredLocalChanges,
  saveButtonState,
  saveMessage,
  isVersionHistoryMode,
  isVersionPreview,
  versionPreviewMeta,
  saveMode,
  savedDocuments,
  savedDocumentsLoading,
  savedDocumentsHasMore,
  savedDocumentsLoadingMore,
  onOpenSavedDocuments,
  onLoadMoreSavedDocuments,
  selectedStorageId,
  setSelectedStorageId,
  setupModal,
  setupModalMode,
  setupModalOpen,
  successNotification,
}: {
  canvasLoading: boolean;
  currentStorageId: string;
  deleteButtonState: DeleteButtonState;
  errorNotification: EditorV2ErrorNotification | null;
  exportButtonState: ExportButtonState;
  hasSavedDesignAccess: boolean;
  onCanvasReady: () => void;
  onDeleteCurrentDesign: (document: EditorDocumentState) => Promise<void> | void;
  onDismissErrorNotification: () => void;
  onDismissSuccessNotification: () => void;
  onExportDocument: (document: EditorDocumentState) => Promise<void> | void;
  onSaveDocument: (document: EditorDocumentState) => Promise<void> | void;
  onSaveVersionSnapshot: () => Promise<void> | void;
  onLoadDocument: (record: SavedEditorV2DocumentRecord) => Promise<void> | void;
  onListVersions: (storageId: string) => Promise<EditorDesignVersionListItem[]>;
  onEnterVersionHistoryMode: () => void;
  onExitVersionHistoryMode: () => void;
  onPreviewVersion: (
    storageId: string,
    versionId: string,
    currentDocument: EditorDocumentState,
  ) => Promise<void> | void;
  onExitVersionPreview: () => void;
  onSelectCurrentVersionInHistoryMode: () => void;
  onRestoreVersion: (
    storageId: string,
    versionId: string,
  ) => Promise<RestoreEditorV2VersionResult>;
  onRestoreVersionAsCopy: (
    storageId: string,
    versionId: string,
  ) => Promise<RestoreEditorV2VersionResult>;
  onStartOver: () => void;
  onCloseSetupModal: () => void;
  hasPersistableUnsavedChanges: boolean;
  recoveredLocalChanges: boolean;
  saveButtonState: SaveButtonState;
  saveMessage: string;
  isVersionHistoryMode: boolean;
  isVersionPreview: boolean;
  versionPreviewMeta: {
    versionId: string;
    createdAt: string;
    saveSource: LoadEditorV2VersionResult["saveSource"];
  } | null;
  saveMode: "manual" | "autosave";
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  savedDocumentsHasMore: boolean;
  savedDocumentsLoadingMore: boolean;
  onOpenSavedDocuments: () => Promise<void> | void;
  onLoadMoreSavedDocuments: () => Promise<void> | void;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  setupModal: ReactNode;
  setupModalMode: "full" | "new-only";
  setupModalOpen: boolean;
  successNotification: EditorV2SuccessNotification | null;
}) {
  const openSignIn = useOpenSignIn();
  const dispatch = useEditorStoreDispatch();
  const state = useEditorStoreSelector((currentState) => currentState);

  const document = state.document;
  const title = state.document.project.title;
  const activeTool = state.session.activeTool.tool;
  const brushSize = state.session.activeTool.brushSize;
  const colorsById = state.document.palette.colorsById;
  const selectionScopeActive =
    state.session.selection.mode !== "none" && state.session.selection.rect !== null;
  const selectionControlActive =
    activeTool === "lasso" || state.session.selection.mode !== "none";
  const usedColors = getUsedColors(state, { scope: "auto" });
  const selectionBounds = getSelectionBounds(state);
  const activeColorId = getActiveColorId(state);
  const activeColor = getActiveColor(state);
  const palette = getPaletteColors(state);
  const featuredColorIds = usedColors.map((entry) => entry.colorId);
  const canUndo = getCanUndo(state);
  const canRedo = getCanRedo(state);
  const suppressHeaderForSetupModal = setupModalOpen && setupModalMode === "full";
  const hasPaintedCells = state.document.grid.cells.some((cell) => cell !== null);
  const trace = getTraceDocument(state);
  const viewport = getViewport(state);
  const showGridlines = state.ui.preferences.showGridlines;
  const showRuler = state.ui.preferences.showRuler;
  const showSymbols = state.ui.preferences.showSymbols;
  const previewMode = state.ui.preferences.previewMode;
  const activeSidebarSection = state.ui.shell.activeSidebarSection;
  const sidebarCollapsed = state.ui.shell.sidebarCollapsed;
  const hasUnsavedChanges = hasPersistableUnsavedChanges;
  const hasCompletedSave = state.session.persistence.lastSavedAt !== null;
  const traceRepositionActive = Boolean(state.session.traceInteraction.repositionSnapshot);
  const traceRepositionOrigin = state.session.traceInteraction.repositionOrigin;
  const mirrorSession = state.session.mirrorInteraction.session;
  const textPlacement = state.session.textInteraction.placement;
  const iconPlacement = state.session.iconInteraction.placement;
  const selectionCommitted = Boolean(selectionBounds && !state.session.selection.preview);
  const canvasWorldRef = useRef<HTMLDivElement | null>(null);
  const versionHistoryTimelineRef = useRef<HTMLDivElement | null>(null);
  const stageToolbarTopRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedInitialFitRef = useRef(false);
  const hasAppliedMobileLayoutRef = useRef(false);
  const mobileTraceRepositionWasActiveRef = useRef(false);
  const mobileTextPlacementWasActiveRef = useRef(false);
  const previewSessionSnapshotRef = useRef<PreviewSessionSnapshot | null>(null);
  const bottomPanelCanvasFocusSnapshotRef =
    useRef<BottomPanelCanvasFocusSnapshot | null>(null);
  const previewFitPendingRef = useRef(false);
  const versionHistoryFitPendingRef = useRef(false);
  const bottomPanelCanvasFocusFitPendingRef = useRef(false);
  const reopenColorPanelAfterSelectionRef = useRef(false);
  const usedColorsSelectionPromptStartedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [isBottomPanelLayout, setIsBottomPanelLayout] = useState(false);
  const visibleSidebarSection =
    !isBottomPanelLayout && activeSidebarSection === "document"
      ? "color"
      : activeSidebarSection;
  const [isBottomPanelCanvasFocusActive, setIsBottomPanelCanvasFocusActive] =
    useState(false);
  const [isCompactHistoryLayout, setIsCompactHistoryLayout] = useState(false);
  const [layoutModeResolved, setLayoutModeResolved] = useState(false);
  const [canvasWorldSize, setCanvasWorldSize] = useState({ width: 0, height: 0 });
  const [stageToolbarTopInset, setStageToolbarTopInset] = useState(0);
  const [saveNotificationVisible, setSaveNotificationVisible] = useState(false);
  const [saveBannerDismissed, setSaveBannerDismissed] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [highlightedColorId, setHighlightedColorId] = useState<string | null>(null);
  const [tracePreviewCrop, setTracePreviewCrop] = useState<TraceCropRect | null>(null);
  const [traceCropSnapshot, setTraceCropSnapshot] = useState<TraceCropRect | null>(null);
  const [traceCropAspectRatioId, setTraceCropAspectRatioId] =
    useState<TraceCropAspectRatioId>("freehand");
  const [renameRequestToken, setRenameRequestToken] = useState(0);
  const [headerFileLeftTarget, setHeaderFileLeftTarget] = useState<HTMLElement | null>(null);
  const [headerTitleTarget, setHeaderTitleTarget] = useState<HTMLElement | null>(null);
  const [headerActionsTarget, setHeaderActionsTarget] = useState<HTMLElement | null>(null);
  const [headerAutosaveTarget, setHeaderAutosaveTarget] = useState<HTMLElement | null>(null);
  const [headerHistoryTarget, setHeaderHistoryTarget] = useState<HTMLElement | null>(null);
  const [headerOverflowTarget, setHeaderOverflowTarget] = useState<HTMLElement | null>(null);
  const [topBannerTarget, setTopBannerTarget] = useState<HTMLElement | null>(null);
  const [usedColorsSelectionPromptVisible, setUsedColorsSelectionPromptVisible] =
    useState(false);
  const [versionHistory, setVersionHistory] = useState<EditorDesignVersionListItem[]>(() =>
    currentStorageId ? versionHistoryCache.get(currentStorageId) ?? [] : [],
  );
  const [versionHistoryLoading, setVersionHistoryLoading] = useState(false);
  const [versionHistoryError, setVersionHistoryError] = useState<string | null>(null);
  const [selectedVersionHistoryId, setSelectedVersionHistoryId] = useState<"current" | string>(
    () => versionPreviewMeta?.versionId ?? "current",
  );

  useEffect(() => {
    setTracePreviewCrop(null);
    setTraceCropSnapshot(null);
    setTraceCropAspectRatioId("freehand");
  }, [trace?.previewUrl]);
  const traceCropEditing = tracePreviewCrop !== null && traceCropSnapshot !== null;
  const repositionModeActive =
    traceRepositionActive || traceCropEditing || textPlacement !== null || iconPlacement !== null;
  const canUndoFromToolbar = canUndo && !repositionModeActive;
  const canRedoFromToolbar = canRedo && !repositionModeActive;
  const handleBeginTraceCrop = useCallback(() => {
    if (!trace || traceRepositionActive) {
      return;
    }

    const nextCrop = getNormalizedTraceCrop(trace);
    setTraceCropSnapshot(nextCrop);
    setTracePreviewCrop(nextCrop);
    setTraceCropAspectRatioId("freehand");
  }, [trace, traceRepositionActive]);

  const handlePreviewTraceCropChange = useCallback((crop: TraceCropRect | null) => {
    setTracePreviewCrop(crop);
  }, []);

  const handleCancelTraceCrop = useCallback(() => {
    setTracePreviewCrop(null);
    setTraceCropSnapshot(null);
    setTraceCropAspectRatioId("freehand");
  }, []);

  const handleResetTraceCrop = useCallback(() => {
    if (!trace || !tracePreviewCrop) {
      return;
    }

    setTracePreviewCrop(
      createFullTraceCrop(trace.imageWidth ?? tracePreviewCrop.cropWidth, trace.imageHeight ?? tracePreviewCrop.cropHeight),
    );
  }, [trace, tracePreviewCrop]);

  const handleCommitTraceCrop = useCallback(() => {
    if (!trace || !traceCropSnapshot || !tracePreviewCrop) {
      setTracePreviewCrop(null);
      setTraceCropSnapshot(null);
      return;
    }

    if (
      traceCropSnapshot.cropX === tracePreviewCrop.cropX &&
      traceCropSnapshot.cropY === tracePreviewCrop.cropY &&
      traceCropSnapshot.cropWidth === tracePreviewCrop.cropWidth &&
      traceCropSnapshot.cropHeight === tracePreviewCrop.cropHeight
    ) {
      setTracePreviewCrop(null);
      setTraceCropSnapshot(null);
      return;
    }

    const cropMetrics = createGridWorldMetrics(
      state.document.grid.width,
      state.document.grid.height,
      DEFAULT_CELL_SIZE,
      0,
    );
    const baseRect = getContainedRect(
      traceCropSnapshot.cropWidth,
      traceCropSnapshot.cropHeight,
      cropMetrics.surfaceWidth,
      cropMetrics.surfaceHeight,
    );
    const baseFrameBounds = getPositionedBounds(baseRect, {
      offsetX: trace.offsetX,
      offsetY: trace.offsetY,
      scale: trace.scale,
      rotation: trace.rotation,
    });
    const imageScaleX = baseFrameBounds.width / Math.max(traceCropSnapshot.cropWidth, 1);
    const imageScaleY = baseFrameBounds.height / Math.max(traceCropSnapshot.cropHeight, 1);
    const imageBounds = {
      left: baseFrameBounds.left - traceCropSnapshot.cropX * imageScaleX,
      top: baseFrameBounds.top - traceCropSnapshot.cropY * imageScaleY,
      width: (trace.imageWidth ?? tracePreviewCrop.cropWidth) * imageScaleX,
      height: (trace.imageHeight ?? tracePreviewCrop.cropHeight) * imageScaleY,
    };
    const committedFrameBounds = {
      left: imageBounds.left + tracePreviewCrop.cropX * imageScaleX,
      top: imageBounds.top + tracePreviewCrop.cropY * imageScaleY,
      width: tracePreviewCrop.cropWidth * imageScaleX,
      height: tracePreviewCrop.cropHeight * imageScaleY,
    };
    const nextBaseRect = getContainedRect(
      tracePreviewCrop.cropWidth,
      tracePreviewCrop.cropHeight,
      cropMetrics.surfaceWidth,
      cropMetrics.surfaceHeight,
    );
    const nextScale = committedFrameBounds.width / Math.max(nextBaseRect.width, 1);

    dispatch(
      createUpdateTraceCommand(
        {
          ...tracePreviewCrop,
          offsetX: committedFrameBounds.left - nextBaseRect.left,
          offsetY: committedFrameBounds.top - nextBaseRect.top,
          scale: nextScale,
        },
        {
        history: { mode: "push", label: "Crop Trace" },
        source: "toolbar",
        },
      ),
    );
    setTracePreviewCrop(null);
    setTraceCropSnapshot(null);
    setTraceCropAspectRatioId("freehand");
  }, [dispatch, state.document.grid.height, state.document.grid.width, trace, traceCropSnapshot, tracePreviewCrop]);
  const traceCropAspectRatio = useMemo(() => {
    if (!trace) {
      return null;
    }

    const assetWidth = trace.imageWidth ?? tracePreviewCrop?.cropWidth ?? traceCropSnapshot?.cropWidth ?? 0;
    const assetHeight = trace.imageHeight ?? tracePreviewCrop?.cropHeight ?? traceCropSnapshot?.cropHeight ?? 0;

    return getAspectRatioValueFromId(traceCropAspectRatioId, assetWidth, assetHeight);
  }, [trace, traceCropAspectRatioId, traceCropSnapshot, tracePreviewCrop]);
  const handleTraceCropAspectRatioChange = useCallback(
    (value: TraceCropAspectRatioId) => {
      setTraceCropAspectRatioId(value);

      if (!trace || !tracePreviewCrop) {
        return;
      }

      const assetWidth = trace.imageWidth ?? tracePreviewCrop.cropWidth;
      const assetHeight = trace.imageHeight ?? tracePreviewCrop.cropHeight;
      const nextAspectRatio = getAspectRatioValueFromId(value, assetWidth, assetHeight);

      setTracePreviewCrop((currentCrop) => {
        if (!currentCrop) {
          return currentCrop;
        }

        return fitCropToAspectRatio(currentCrop, nextAspectRatio, assetWidth, assetHeight);
      });
    },
    [trace, tracePreviewCrop],
  );
  const [versionHistoryActionPendingId, setVersionHistoryActionPendingId] =
    useState<string | null>(null);
  const openSignInForCurrentDesign = useCallback(() => {
    openSignIn({
      redirectUrl: createEditorV2AuthHandoffRedirectUrl(
        document,
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : `/editor/designs/${document.project.id ?? "local_draft"}`,
      ),
    });
  }, [document, openSignIn]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const editorWindow = window as EditorV2WindowWithDraftGetter;
    editorWindow.__editorV2GetCurrentDocument = () => document;
    editorWindow.__editorV2ShouldPreserveDraftOnSignIn = () => !setupModalOpen;

    return () => {
      if (editorWindow.__editorV2GetCurrentDocument) {
        delete editorWindow.__editorV2GetCurrentDocument;
      }

      if (editorWindow.__editorV2ShouldPreserveDraftOnSignIn) {
        delete editorWindow.__editorV2ShouldPreserveDraftOnSignIn;
      }
    };
  }, [document, setupModalOpen]);
  const mobileSelectionDocked =
    ENABLE_MOBILE_SELECTION_DOCK &&
    isBottomPanelLayout &&
    (Boolean(selectionBounds) || activeTool === "lasso");
  const mobileBottomPanelVisibleHeightRatio =
    isBottomPanelLayout && !sidebarCollapsed
      ? isBottomPanelCanvasFocusActive
        ? 0.6
        : 0.25
      : 1;
  const previewModeDisabled =
    Boolean(textPlacement) ||
    Boolean(iconPlacement) ||
    traceRepositionActive ||
    selectionControlActive;
  const mobileVisibleTopInset =
    isBottomPanelLayout && !sidebarCollapsed ? stageToolbarTopInset * 0.5 : 0;
  const mobileHeaderMenuItems = useMemo(
    (): HeaderFileMenuItem[] =>
      hasSavedDesignAccess
        ? [
            {
              id: previewMode ? "exit-preview" : "preview",
              label: previewMode ? "Exit preview" : "Preview",
              kind: "action",
            },
            ...HEADER_FILE_MENU_ITEMS,
          ]
        : [
            { id: "sign-in", label: "Sign in", kind: "action" },
            {
              id: previewMode ? "exit-preview" : "preview",
              label: previewMode ? "Exit preview" : "Preview",
              kind: "action",
            },
            ...HEADER_FILE_MENU_ITEMS,
          ],
    [hasSavedDesignAccess, previewMode],
  );
  const gridMetrics = useMemo(
    () =>
      createGridWorldMetrics(
        state.document.grid.width,
        state.document.grid.height,
        DEFAULT_CELL_SIZE,
        0,
      ),
    [state.document.grid.height, state.document.grid.width],
  );
  const shellSidebarInset =
    isVersionHistoryMode || sidebarCollapsed || isBottomPanelLayout
      ? 0
      : EXPANDED_SIDEBAR_WIDTH;
  const fitZoom = useMemo(() => {
    if (canvasWorldSize.width <= 0 || canvasWorldSize.height <= 0) {
      return 1;
    }

    const availableWidth = Math.max(
      canvasWorldSize.width - shellSidebarInset,
      1,
    );
    const availableHeight = Math.max(
      canvasWorldSize.height * mobileBottomPanelVisibleHeightRatio - mobileVisibleTopInset,
      1,
    );

    return Math.min(
      availableWidth / Math.max(gridMetrics.surfaceWidth, 1),
      availableHeight / Math.max(gridMetrics.surfaceHeight, 1),
    ) * FIT_ZOOM_PADDING_FACTOR;
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    gridMetrics.surfaceHeight,
    gridMetrics.surfaceWidth,
    mobileVisibleTopInset,
    mobileBottomPanelVisibleHeightRatio,
    shellSidebarInset,
  ]);
  const zoomAnchor = useMemo(() => {
    if (canvasWorldSize.width <= 0 || canvasWorldSize.height <= 0) {
      return null;
    }

    const visibleLeftInset = shellSidebarInset;
    const visibleCenterX =
      visibleLeftInset + (canvasWorldSize.width - visibleLeftInset) / 2;
    const visibleCanvasHeight = Math.max(
      canvasWorldSize.height * mobileBottomPanelVisibleHeightRatio - mobileVisibleTopInset,
      1,
    );
    const visibleCenterY = mobileVisibleTopInset + visibleCanvasHeight / 2;
    const centeredWorldOriginX =
      (canvasWorldSize.width - gridMetrics.surfaceWidth) / 2;
    const centeredWorldOriginY =
      (canvasWorldSize.height - gridMetrics.surfaceHeight) / 2;

    return {
      x: visibleCenterX - centeredWorldOriginX,
      y: visibleCenterY - centeredWorldOriginY,
    };
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    gridMetrics.surfaceHeight,
    gridMetrics.surfaceWidth,
    mobileVisibleTopInset,
    mobileBottomPanelVisibleHeightRatio,
    shellSidebarInset,
  ]);
  const textViewportCenter = useMemo(() => {
    if (viewport.zoom <= 0 || canvasWorldSize.width <= 0 || canvasWorldSize.height <= 0) {
      return null;
    }

    const visibleLeftInset = shellSidebarInset;
    const visibleCenterX =
      visibleLeftInset + (canvasWorldSize.width - visibleLeftInset) / 2;
    const visibleCanvasHeight = Math.max(
      canvasWorldSize.height - mobileVisibleTopInset,
      1,
    );
    const visibleCenterY = mobileVisibleTopInset + visibleCanvasHeight / 2;
    const centeredWorldOriginX =
      (canvasWorldSize.width - gridMetrics.surfaceWidth) / 2;
    const centeredWorldOriginY =
      (canvasWorldSize.height - gridMetrics.surfaceHeight) / 2;
    const anchorX = visibleCenterX - centeredWorldOriginX;
    const anchorY = visibleCenterY - centeredWorldOriginY;

    return {
      x: (anchorX - viewport.offsetX) / viewport.zoom,
      y: (anchorY - viewport.offsetY) / viewport.zoom,
    };
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    gridMetrics.surfaceHeight,
    gridMetrics.surfaceWidth,
    mobileVisibleTopInset,
    shellSidebarInset,
    viewport.offsetX,
    viewport.offsetY,
    viewport.zoom,
  ]);
  const textViewportWidth = useMemo(() => {
    if (viewport.zoom <= 0 || canvasWorldSize.width <= 0) {
      return null;
    }

    const visibleLeftInset = shellSidebarInset;
    const visibleCanvasWidth = Math.max(canvasWorldSize.width - visibleLeftInset, 1);

    return visibleCanvasWidth / viewport.zoom;
  }, [
    canvasWorldSize.width,
    shellSidebarInset,
    viewport.zoom,
  ]);
  const textViewportHeight = useMemo(() => {
    if (viewport.zoom <= 0 || canvasWorldSize.height <= 0) {
      return null;
    }

    return Math.max(
      canvasWorldSize.height - mobileVisibleTopInset,
      1,
    ) / viewport.zoom;
  }, [
    canvasWorldSize.height,
    mobileVisibleTopInset,
    viewport.zoom,
  ]);
  const fitToGrid = useCallback(() => {
    if (
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    const visibleLeftInset = shellSidebarInset;
    const availableLeft = visibleLeftInset;
    const availableTop = mobileVisibleTopInset;
    const availableWidth = canvasWorldSize.width - visibleLeftInset;
    const visibleCanvasHeight =
      canvasWorldSize.height * mobileBottomPanelVisibleHeightRatio - mobileVisibleTopInset;
    const renderedWidth = gridMetrics.surfaceWidth * fitZoom;
    const renderedHeight = gridMetrics.surfaceHeight * fitZoom;
    const frameOriginX =
      (canvasWorldSize.width - gridMetrics.surfaceWidth) / 2;
    const frameOriginY =
      (canvasWorldSize.height - gridMetrics.surfaceHeight) / 2;
    const targetOffsetX =
      availableLeft + (availableWidth - renderedWidth) / 2 - frameOriginX;
    const targetOffsetY =
      availableTop + (visibleCanvasHeight - renderedHeight) / 2 - frameOriginY;

    dispatch(createSetViewportZoomCommand(fitZoom));
    dispatch(
      createPanViewportCommand(
        targetOffsetX - viewport.offsetX,
        targetOffsetY - viewport.offsetY,
      ),
    );
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    dispatch,
    fitZoom,
    gridMetrics.surfaceHeight,
    gridMetrics.surfaceWidth,
    mobileVisibleTopInset,
    mobileBottomPanelVisibleHeightRatio,
    shellSidebarInset,
    viewport.offsetX,
    viewport.offsetY,
  ]);

  const enterPreviewMode = useCallback(() => {
    if (previewMode || previewModeDisabled) {
      return;
    }

    previewSessionSnapshotRef.current = {
      sidebarCollapsed,
      viewport: {
        zoom: viewport.zoom,
        offsetX: viewport.offsetX,
        offsetY: viewport.offsetY,
      },
    };
    previewFitPendingRef.current = true;

    dispatch(createSetPreviewModeCommand(true));
    if (!sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(true));
    }
  }, [
    dispatch,
    previewMode,
    previewModeDisabled,
    sidebarCollapsed,
    viewport.offsetX,
    viewport.offsetY,
    viewport.zoom,
  ]);

  const exitPreviewMode = useCallback(() => {
    if (!previewMode) {
      return;
    }

    const snapshot = previewSessionSnapshotRef.current;
    previewFitPendingRef.current = false;
    dispatch(createSetPreviewModeCommand(false));

    if (!snapshot) {
      return;
    }

    if (sidebarCollapsed !== snapshot.sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(snapshot.sidebarCollapsed));
    }

    dispatch(createSetViewportZoomCommand(snapshot.viewport.zoom));
    dispatch(
      createPanViewportCommand(
        snapshot.viewport.offsetX - viewport.offsetX,
        snapshot.viewport.offsetY - viewport.offsetY,
      ),
    );

    previewSessionSnapshotRef.current = null;
  }, [
    dispatch,
    previewMode,
    sidebarCollapsed,
    viewport.offsetX,
    viewport.offsetY,
  ]);

  const exitBottomPanelCanvasFocus = useCallback(
    (options?: { restoreViewport?: boolean }) => {
      const restoreViewport = options?.restoreViewport ?? true;
      const snapshot = bottomPanelCanvasFocusSnapshotRef.current;

      bottomPanelCanvasFocusFitPendingRef.current = false;
      setIsBottomPanelCanvasFocusActive(false);

      if (!restoreViewport || !snapshot) {
        bottomPanelCanvasFocusSnapshotRef.current = null;
        return;
      }

      dispatch(createSetViewportZoomCommand(snapshot.viewport.zoom));
      dispatch(
        createPanViewportCommand(
          snapshot.viewport.offsetX - viewport.offsetX,
          snapshot.viewport.offsetY - viewport.offsetY,
        ),
      );

      bottomPanelCanvasFocusSnapshotRef.current = null;
    },
    [dispatch, viewport.offsetX, viewport.offsetY],
  );

  const enterBottomPanelCanvasFocus = useCallback(() => {
    if (isBottomPanelCanvasFocusActive || !isBottomPanelLayout || sidebarCollapsed) {
      return;
    }

    bottomPanelCanvasFocusSnapshotRef.current = {
      viewport: {
        zoom: viewport.zoom,
        offsetX: viewport.offsetX,
        offsetY: viewport.offsetY,
      },
    };
    bottomPanelCanvasFocusFitPendingRef.current = true;
    setIsBottomPanelCanvasFocusActive(true);
  }, [
    isBottomPanelCanvasFocusActive,
    isBottomPanelLayout,
    sidebarCollapsed,
    viewport.offsetX,
    viewport.offsetY,
    viewport.zoom,
  ]);

  const toggleBottomPanelCanvasFocus = useCallback(() => {
    if (isBottomPanelCanvasFocusActive) {
      exitBottomPanelCanvasFocus();
      return;
    }

    enterBottomPanelCanvasFocus();
  }, [
    enterBottomPanelCanvasFocus,
    exitBottomPanelCanvasFocus,
    isBottomPanelCanvasFocusActive,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setLayoutModeResolved(true);
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => {
      setIsBottomPanelLayout(mediaQuery.matches);
      setLayoutModeResolved(true);
    };

    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 1000px)");
    const update = () => {
      setIsCompactHistoryLayout(mediaQuery.matches);
    };

    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  useEffect(() => {
    const element = canvasWorldRef.current;

    if (!element) {
      return;
    }

    const update = () => {
      const rect = element.getBoundingClientRect();

      setCanvasWorldSize({
        width: rect.width,
        height: rect.height,
      });
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, [isVersionHistoryMode]);

  useEffect(() => {
    const update = () => {
      const canvasElement = canvasWorldRef.current;
      const toolbarElement = stageToolbarTopRef.current;

      if (
        isVersionHistoryMode ||
        !canvasElement ||
        !toolbarElement ||
        previewMode ||
        isBottomPanelCanvasFocusActive
      ) {
        setStageToolbarTopInset(0);
        return;
      }

      const canvasRect = canvasElement.getBoundingClientRect();
      const toolbarRect = toolbarElement.getBoundingClientRect();
      const nextInset = Math.max(0, toolbarRect.bottom - canvasRect.top + 12);
      setStageToolbarTopInset((current) =>
        Math.abs(current - nextInset) < 0.5 ? current : nextInset,
      );
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const observer = new ResizeObserver(update);
    if (canvasWorldRef.current) {
      observer.observe(canvasWorldRef.current);
    }
    if (stageToolbarTopRef.current) {
      observer.observe(stageToolbarTopRef.current);
    }

    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [
    activeSidebarSection,
    isBottomPanelCanvasFocusActive,
    isVersionHistoryMode,
    previewMode,
    sidebarCollapsed,
  ]);

  useEffect(() => {
    if (!isVersionHistoryMode) {
      versionHistoryFitPendingRef.current = false;
      return;
    }

    if (
      !versionHistoryFitPendingRef.current ||
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      fitToGrid();
      versionHistoryFitPendingRef.current = false;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    fitToGrid,
    fitZoom,
    isVersionHistoryMode,
  ]);

  useEffect(() => {
    if (
      !layoutModeResolved ||
      hasAppliedInitialFitRef.current ||
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    fitToGrid();
    hasAppliedInitialFitRef.current = true;
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    fitZoom,
    fitToGrid,
    layoutModeResolved,
  ]);

  useEffect(() => {
    if (!isBottomPanelLayout) {
      hasAppliedMobileLayoutRef.current = false;
      if (isBottomPanelCanvasFocusActive) {
        exitBottomPanelCanvasFocus({ restoreViewport: false });
      }
      return;
    }

    if (
      !layoutModeResolved ||
      hasAppliedMobileLayoutRef.current ||
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    if (!sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(true));
      return;
    }

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      fitToGrid();
      hasAppliedMobileLayoutRef.current = true;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    dispatch,
    fitToGrid,
    fitZoom,
    isBottomPanelLayout,
    isBottomPanelCanvasFocusActive,
    layoutModeResolved,
    sidebarCollapsed,
    exitBottomPanelCanvasFocus,
  ]);

  useEffect(() => {
    if (
      !previewMode ||
      !previewFitPendingRef.current ||
      !sidebarCollapsed ||
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      fitToGrid();
      previewFitPendingRef.current = false;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    fitToGrid,
    fitZoom,
    previewMode,
    sidebarCollapsed,
  ]);

  useEffect(() => {
    if (!isBottomPanelCanvasFocusActive || sidebarCollapsed) {
      if (isBottomPanelCanvasFocusActive && sidebarCollapsed) {
        exitBottomPanelCanvasFocus({ restoreViewport: false });
      }
      return;
    }

    if (
      !bottomPanelCanvasFocusFitPendingRef.current ||
      fitZoom <= 0 ||
      canvasWorldSize.width <= 0 ||
      canvasWorldSize.height <= 0
    ) {
      return;
    }

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      fitToGrid();
      bottomPanelCanvasFocusFitPendingRef.current = false;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [
    canvasWorldSize.height,
    canvasWorldSize.width,
    exitBottomPanelCanvasFocus,
    fitToGrid,
    fitZoom,
    isBottomPanelCanvasFocusActive,
    sidebarCollapsed,
  ]);

  useEffect(() => {
    if (!traceRepositionActive) {
      mobileTraceRepositionWasActiveRef.current = false;
      return;
    }

    if (!isBottomPanelLayout && activeSidebarSection !== "trace") {
      dispatch(createSetActiveSidebarSectionCommand("trace"));
    }

    if (isBottomPanelLayout) {
      if (!mobileTraceRepositionWasActiveRef.current && !sidebarCollapsed) {
        dispatch(createSetSidebarCollapsedCommand(true));
      }
      mobileTraceRepositionWasActiveRef.current = true;
      return;
    }

    if (sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(false));
    }
  }, [
    activeSidebarSection,
    dispatch,
    isBottomPanelLayout,
    sidebarCollapsed,
    traceRepositionActive,
  ]);

  useEffect(() => {
    if (!textPlacement) {
      mobileTextPlacementWasActiveRef.current = false;
      return;
    }

    if (!isBottomPanelLayout) {
      return;
    }

    if (!mobileTextPlacementWasActiveRef.current && !sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(true));
    }

    mobileTextPlacementWasActiveRef.current = true;
  }, [dispatch, isBottomPanelLayout, sidebarCollapsed, textPlacement]);

  useEffect(() => {
    if (!previewMode) {
      return;
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      exitPreviewMode();
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [exitPreviewMode, previewMode]);

  useEffect(() => {
    if (!iconPlacement) {
      return;
    }

    if (!isBottomPanelLayout) {
      return;
    }

    if (!sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(true));
    }
  }, [dispatch, iconPlacement, isBottomPanelLayout, sidebarCollapsed]);

  useEffect(() => {
    if (!reopenColorPanelAfterSelectionRef.current) {
      return;
    }

    if (selectionCommitted) {
      dispatch(createSetSidebarCollapsedCommand(false));
      reopenColorPanelAfterSelectionRef.current = false;
      return;
    }

    if (activeTool !== "lasso" && !selectionScopeActive) {
      reopenColorPanelAfterSelectionRef.current = false;
    }
  }, [activeTool, dispatch, selectionCommitted, selectionScopeActive]);

  useEffect(() => {
    if (!usedColorsSelectionPromptVisible) {
      usedColorsSelectionPromptStartedRef.current = false;
      return;
    }

    if (selectionCommitted) {
      setUsedColorsSelectionPromptVisible(false);
      return;
    }

    if (selectionControlActive) {
      usedColorsSelectionPromptStartedRef.current = true;
      return;
    }

    if (usedColorsSelectionPromptStartedRef.current) {
      setUsedColorsSelectionPromptVisible(false);
    }
  }, [
    selectionCommitted,
    selectionControlActive,
    usedColorsSelectionPromptVisible,
  ]);

  const [selectionRequestKey, setSelectionRequestKey] = useState(0);

  const handleUsedColorsScopeModeChange = useCallback(
    (mode: "full-canvas" | "selection") => {
      if (mode === "selection") {
        if (isBottomPanelLayout) {
          if (!sidebarCollapsed) {
            dispatch(createSetSidebarCollapsedCommand(true));
          }
          reopenColorPanelAfterSelectionRef.current = true;
        } else if (sidebarCollapsed) {
          dispatch(createSetSidebarCollapsedCommand(false));
        }

        setSelectionRequestKey((current) => current + 1);
        setUsedColorsSelectionPromptVisible(true);
        return;
      }

      reopenColorPanelAfterSelectionRef.current = false;
      setUsedColorsSelectionPromptVisible(false);
      dispatch(createClearSelectionCommand());
    },
    [dispatch, isBottomPanelLayout, sidebarCollapsed],
  );

  useEffect(() => {
    if (!iconPlacement) {
      return;
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.key !== "Backspace" && event.key !== "Delete") {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      dispatch(createCancelIconPlacementCommand());
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [dispatch, iconPlacement]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const saveSucceeded =
      saveMessage.startsWith(SAVE_SUCCESS_PREFIX) ||
      saveMessage.startsWith(AUTOSAVE_SUCCESS_PREFIX) ||
      saveMessage.startsWith(VERSION_SAVE_SUCCESS_PREFIX);

    if (!saveSucceeded) {
      setSaveNotificationVisible(false);
      return;
    }

    if (currentStorageId) {
      versionHistoryCache.delete(currentStorageId);
    }

    setSaveNotificationVisible(true);

    const timeoutId = window.setTimeout(() => {
      setSaveNotificationVisible(false);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [currentStorageId, saveMessage]);

  useEffect(() => {
    setHeaderFileLeftTarget(window.document.getElementById("app-header-file-left"));
    setHeaderTitleTarget(window.document.getElementById("app-header-title"));
    setHeaderActionsTarget(window.document.getElementById("app-header-actions"));
    setHeaderAutosaveTarget(window.document.getElementById("app-header-autosave"));
    setHeaderHistoryTarget(window.document.getElementById("app-header-history-right"));
    setHeaderOverflowTarget(window.document.getElementById("app-header-overflow-right"));
    setTopBannerTarget(window.document.getElementById("app-top-banner"));
  }, []);

  const showSaveStatus =
    saveMode === "autosave" && !hasCompletedSave && !saveMessage
      ? true
      : Boolean(saveMessage || hasUnsavedChanges);
  const showDocumentPanelStatus =
    isBottomPanelLayout &&
    ((saveMode === "autosave" && showSaveStatus) ||
      (saveMode === "manual" && hasSavedDesignAccess && showSaveStatus));
  const showHeaderSaveStatus = hasSavedDesignAccess || saveMode === "autosave";
  const versionHistoryDisplayState = useMemo(() => {
    if (!isVersionHistoryMode || !state.document.trace) {
      return state;
    }

    return {
      ...state,
      document: {
        ...state.document,
        trace: {
          ...state.document.trace,
          visible: true,
          blendMode: "image" as const,
          opacity: VERSION_HISTORY_TRACE_OPACITY,
          locked: true,
        },
      },
    };
  }, [isVersionHistoryMode, state]);
  const headerFileMenuItems = useMemo(
    () =>
      HEADER_FILE_MENU_ITEMS.filter((item) =>
        saveMode === "autosave" ? true : item.id !== "save-version",
      ),
    [saveMode],
  );
  const recentSavedDocuments = useMemo(
    () =>
      savedDocuments
        .filter((record) => record.storageId !== currentStorageId)
        .slice(0, HEADER_FILE_RECENT_LIMIT),
    [currentStorageId, savedDocuments],
  );
  const showLoggedOutTopBanner = !hasSavedDesignAccess && !saveBannerDismissed;
  const showTopSaveBanner = showLoggedOutTopBanner;
  const showSaveConfirmationOverlay =
    saveNotificationVisible &&
    (IS_DEV_APP_MODE || saveMode === "manual" || !hasSavedDesignAccess);

  useEffect(() => {
    setSaveBannerDismissed(false);
  }, [hasUnsavedChanges, saveMessage]);

  useEffect(() => {
    const appShellRoot = window.document.getElementById("app-shell-root");
    if (!appShellRoot) {
      return;
    }

    appShellRoot.style.setProperty(
      "--app-top-banner-height",
      showTopSaveBanner ? "30px" : "0px",
    );

    return () => {
      appShellRoot.style.setProperty("--app-top-banner-height", "0px");
    };
  }, [showTopSaveBanner]);

  useEffect(() => {
    const appShellRoot = window.document.getElementById("app-shell-root");
    if (!appShellRoot) {
      return;
    }

    appShellRoot.setAttribute(
      "data-mobile-header-overflow-auth",
      isBottomPanelLayout ? "true" : "false",
    );

    return () => {
      appShellRoot.removeAttribute("data-mobile-header-overflow-auth");
    };
  }, [isBottomPanelLayout]);

  useEffect(() => {
    const appShellRoot = window.document.getElementById("app-shell-root");
    if (!appShellRoot) {
      return;
    }

    appShellRoot.setAttribute(
      "data-editor-version-history-mode",
      isVersionHistoryMode ? "true" : "false",
    );

    return () => {
      appShellRoot.removeAttribute("data-editor-version-history-mode");
    };
  }, [isVersionHistoryMode]);

  useEffect(() => {
    versionHistoryFitPendingRef.current = isVersionHistoryMode;
  }, [isVersionHistoryMode]);

  useEffect(() => {
    setVersionHistory(currentStorageId ? versionHistoryCache.get(currentStorageId) ?? [] : []);
    setVersionHistoryError(null);
  }, [currentStorageId]);

  useEffect(() => {
    if (!errorNotification) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onDismissErrorNotification();
    }, ERROR_NOTIFICATION_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [errorNotification, onDismissErrorNotification]);

  useEffect(() => {
    if (!successNotification) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onDismissSuccessNotification();
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [onDismissSuccessNotification, successNotification]);

  const loadVersionHistory = useCallback(async () => {
    if (!currentStorageId) {
      setVersionHistory([]);
      setVersionHistoryError(null);
      return;
    }

    const cachedVersions = versionHistoryCache.get(currentStorageId);
    if (cachedVersions) {
      setVersionHistory(cachedVersions);
      setVersionHistoryError(null);
      return;
    }

    setVersionHistoryLoading(true);

    try {
      const versions = await onListVersions(currentStorageId);
      versionHistoryCache.set(currentStorageId, versions);
      setVersionHistory(versions);
      setVersionHistoryError(null);
    } catch (error) {
      setVersionHistoryError(
        error instanceof Error ? error.message : "Couldn't load version history.",
      );
    } finally {
      setVersionHistoryLoading(false);
    }
  }, [currentStorageId, onListVersions]);

  useEffect(() => {
    if (!isVersionHistoryMode) {
      setVersionHistoryError(null);
      setVersionHistoryActionPendingId(null);
      return;
    }

    void loadVersionHistory();
  }, [isVersionHistoryMode, loadVersionHistory]);

  useEffect(() => {
    if (!isVersionHistoryMode) {
      setSelectedVersionHistoryId("current");
      return;
    }

    setSelectedVersionHistoryId(versionPreviewMeta?.versionId ?? "current");
  }, [isVersionHistoryMode, versionPreviewMeta]);

  useLayoutEffect(() => {
    if (!isVersionHistoryMode || !currentStorageId) {
      return;
    }

    const timelineElement = versionHistoryTimelineRef.current;
    if (!timelineElement) {
      return;
    }

    const savedScrollTop = versionHistoryTimelineScrollCache.get(currentStorageId);
    if (typeof savedScrollTop === "number") {
      timelineElement.scrollTop = savedScrollTop;
    }

    const handleTimelineScroll = () => {
      versionHistoryTimelineScrollCache.set(currentStorageId, timelineElement.scrollTop);
    };

    handleTimelineScroll();
    timelineElement.addEventListener("scroll", handleTimelineScroll);

    return () => {
      versionHistoryTimelineScrollCache.set(currentStorageId, timelineElement.scrollTop);
      timelineElement.removeEventListener("scroll", handleTimelineScroll);
    };
  }, [currentStorageId, isVersionHistoryMode, versionHistory.length, versionHistoryLoading]);

  const handleSelectVersionHistoryItem = useCallback(
    async (versionId: "current" | string) => {
      if (!currentStorageId) {
        return;
      }

      const timelineElement = versionHistoryTimelineRef.current;
      if (timelineElement) {
        versionHistoryTimelineScrollCache.set(currentStorageId, timelineElement.scrollTop);
      }

      if (
        typeof window !== "undefined" &&
        window.document.activeElement instanceof HTMLElement
      ) {
        window.document.activeElement.blur();
      }

      setSelectedVersionHistoryId(versionId);
      setVersionHistoryActionPendingId(versionId);

      try {
        if (versionId === "current") {
          onSelectCurrentVersionInHistoryMode();
          setVersionHistoryError(null);
          return;
        }

        await onPreviewVersion(currentStorageId, versionId, document);
        setVersionHistoryError(null);
      } catch (error) {
        setVersionHistoryError(
          error instanceof Error ? error.message : "Couldn't preview this version.",
        );
      } finally {
        setVersionHistoryActionPendingId(null);
      }
    },
    [currentStorageId, document, onPreviewVersion, onSelectCurrentVersionInHistoryMode],
  );

  const handleRestoreSelectedVersion = useCallback(async () => {
    if (
      !currentStorageId ||
      selectedVersionHistoryId === "current" ||
      versionHistoryActionPendingId !== null
    ) {
      return;
    }

    setVersionHistoryActionPendingId(selectedVersionHistoryId);

    try {
      await onRestoreVersion(currentStorageId, selectedVersionHistoryId);
      versionHistoryCache.delete(currentStorageId);
      setVersionHistoryError(null);
    } catch (error) {
      setVersionHistoryError(
        error instanceof Error ? error.message : "Couldn't restore this version.",
      );
      setVersionHistoryActionPendingId(null);
    }
  }, [
    currentStorageId,
    onRestoreVersion,
    selectedVersionHistoryId,
    versionHistoryActionPendingId,
  ]);

  const handleRestoreSelectedVersionAsCopy = useCallback(async () => {
    if (
      !currentStorageId ||
      selectedVersionHistoryId === "current" ||
      versionHistoryActionPendingId !== null ||
      typeof window === "undefined"
    ) {
      return;
    }

    const openedWindow = window.open("", "_blank");
    if (openedWindow) {
      openedWindow.opener = null;
      openedWindow.document.title = "Opening restored copy...";
    }

    setVersionHistoryActionPendingId(selectedVersionHistoryId);

    try {
      const restored = await onRestoreVersionAsCopy(currentStorageId, selectedVersionHistoryId);
      versionHistoryCache.delete(currentStorageId);
      setVersionHistoryError(null);
      const restoredUrl = `/editor/designs/${restored.storageId}`;
      if (openedWindow && !openedWindow.closed) {
        openedWindow.location.assign(restoredUrl);
      } else {
        window.open(restoredUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      if (openedWindow && !openedWindow.closed) {
        openedWindow.close();
      }
      setVersionHistoryError(
        error instanceof Error ? error.message : "Couldn't make a copy from this version.",
      );
    } finally {
      setVersionHistoryActionPendingId(null);
    }
  }, [
    currentStorageId,
    onRestoreVersionAsCopy,
    selectedVersionHistoryId,
    versionHistoryActionPendingId,
  ]);

  function handleHeaderMenuAction(value: string): void {
    if (value === "preview") {
      enterPreviewMode();
      return;
    }

    if (value === "exit-preview") {
      exitPreviewMode();
      return;
    }

    if (value === "new") {
      onStartOver();
      return;
    }

    if (value === "library") {
      window.location.assign("/library");
      return;
    }

    if (
      !hasSavedDesignAccess &&
      AUTH_REQUIRED_FILE_MENU_ACTION_IDS.has(value)
    ) {
      openSignInForCurrentDesign();
      return;
    }

    if (value === "duplicate") {
      duplicateDesignToNewTab(document);
      return;
    }

    if (value === "rename") {
      if (isBottomPanelLayout) {
        dispatch(createSetActiveSidebarSectionCommand("document"));
        dispatch(createSetSidebarCollapsedCommand(false));
      }
      setRenameRequestToken((currentValue) => currentValue + 1);
      return;
    }

    if (value === "version-history") {
      onEnterVersionHistoryMode();
      return;
    }

    if (value === "save-version") {
      if (saveButtonState === "saving") {
        return;
      }
      void onSaveVersionSnapshot();
      return;
    }

    if (value === "download") {
      void onExportDocument(document);
      return;
    }

    if (value === "delete") {
      setDeleteConfirmationOpen(true);
      return;
    }

    if (value === "sign-in") {
      openSignInForCurrentDesign();
    }
  }

  function renderHeaderMenuItemLabel(item: HeaderFileMenuItem) {
    if (item.id === "preview" || item.id === "exit-preview") {
      return (
        <span className={styles.headerOverflowItemLabel}>
          <ButtonIcon
            icon={
              item.id === "exit-preview"
                ? "/icons/lucide/eye-off.svg"
                : "/icons/lucide/eye.svg"
            }
            className={styles.saveButtonIcon}
          />
          <span>{item.label}</span>
        </span>
      );
    }

    if (item.id === "sign-in") {
      return (
        <span className={styles.headerOverflowItemLabel}>
          <ButtonIcon
            icon="/icons/lucide/user.svg"
            className={styles.saveButtonIcon}
          />
          <span>{item.label}</span>
        </span>
      );
    }

    if (item.id === "download") {
      return (
        <span className={styles.headerOverflowItemLabel}>
          {exportButtonState === "exporting" ? (
            <span className={styles.saveButtonSpinner} aria-hidden="true" />
          ) : (
            <ButtonIcon
              icon="/icons/lucide/download.svg"
              className={styles.saveButtonIcon}
            />
          )}
          <span>
            {exportButtonState === "exporting" ? "Exporting..." : item.label}
          </span>
        </span>
      );
    }

    if (item.id === "save-version") {
      return (
        <span className={styles.headerOverflowItemLabel}>
          {saveButtonState === "saving" ? (
            <span className={styles.saveButtonSpinner} aria-hidden="true" />
          ) : (
            <ButtonIcon
              icon="/icons/lucide/save.svg"
              className={styles.saveButtonIcon}
            />
          )}
          <span>{saveButtonState === "saving" ? "Saving version..." : item.label}</span>
        </span>
      );
    }

    if (item.icon) {
      return (
        <span
          className={[
            styles.headerOverflowItemLabel,
            item.id === "delete" ? styles.headerOverflowItemLabelDestructive : null,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <ButtonIcon icon={item.icon} className={styles.saveButtonIcon} />
          <span>{item.label}</span>
        </span>
      );
    }

    return item.label;
  }

  return (
    <main className={styles.shell}>
      {!suppressHeaderForSetupModal &&
      !isVersionHistoryMode &&
      headerFileLeftTarget &&
      saveMode === "manual" &&
      !isVersionPreview &&
      hasSavedDesignAccess
        ? createPortal(
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={styles.headerSaveButton}
              disabled={saveButtonState === "saving"}
              onClick={() => onSaveDocument(document)}
            >
              <SaveButtonLabel
                hasSavedDesignAccess={hasSavedDesignAccess}
                state={saveButtonState}
              />
            </Button>,
            headerFileLeftTarget,
          )
        : null}
      {!suppressHeaderForSetupModal && !isVersionHistoryMode && !showDocumentPanelStatus && headerAutosaveTarget
        ? createPortal(
            isBottomPanelLayout ? (
              showHeaderSaveStatus ? (
                <SaveStatusCard
                  autoSaveEnabled={saveMode === "autosave" && !hasCompletedSave && !saveMessage}
                  hasSavedDesignAccess={hasSavedDesignAccess}
                  hasUnsavedChanges={hasUnsavedChanges}
                  layout="header"
                  onDismiss={null}
                  onSignIn={openSignInForCurrentDesign}
                  recoveredLocalChanges={recoveredLocalChanges}
                  saveMode={saveMode}
                  saveMessage={saveMessage}
                />
              ) : null
            ) : (
              <div className={styles.headerFileMenuGroup}>
                <HeaderFileMenu
                  currentStorageId={currentStorageId}
                  deleteButtonState={deleteButtonState}
                  exportButtonState={exportButtonState}
                  getItemLabel={renderHeaderMenuItemLabel}
                  hasPersistableUnsavedChanges={hasPersistableUnsavedChanges}
                  hasSavedDesignAccess={hasSavedDesignAccess}
                  items={headerFileMenuItems}
                  onAction={handleHeaderMenuAction}
                  onOpenSavedDocuments={onOpenSavedDocuments}
                  recentSavedDocuments={recentSavedDocuments}
                  saveButtonState={saveButtonState}
                  savedDocumentsLoading={savedDocumentsLoading}
                />
                {showHeaderSaveStatus ? (
                  <SaveStatusCard
                    autoSaveEnabled={saveMode === "autosave" && !hasCompletedSave && !saveMessage}
                    hasSavedDesignAccess={hasSavedDesignAccess}
                    hasUnsavedChanges={hasUnsavedChanges}
                    layout="header"
                    onDismiss={null}
                    onSignIn={openSignInForCurrentDesign}
                    recoveredLocalChanges={recoveredLocalChanges}
                    saveMode={saveMode}
                    saveMessage={saveMessage}
                  />
                ) : null}
              </div>
            ),
            headerAutosaveTarget,
          )
        : null}
      {!isVersionHistoryMode && showTopSaveBanner && topBannerTarget
        ? createPortal(
            <SaveStatusCard
              autoSaveEnabled={false}
              hasSavedDesignAccess={hasSavedDesignAccess}
              hasUnsavedChanges={hasUnsavedChanges}
              layout="banner"
              onDismiss={() => setSaveBannerDismissed(true)}
              onSignIn={openSignInForCurrentDesign}
              recoveredLocalChanges={recoveredLocalChanges}
              saveMode={saveMode}
              saveMessage={saveMessage}
            />,
            topBannerTarget,
          )
        : null}
      {!suppressHeaderForSetupModal && !isVersionHistoryMode && headerHistoryTarget && isBottomPanelLayout
        ? createPortal(
            <div className={styles.headerHistoryControls}>
              {previewMode ? (
                <Button
                  type="button"
                  variant="outlined"
                  size="sm"
                  className={styles.headerMobilePreviewButton}
                  onClick={exitPreviewMode}
                >
                  <ButtonIcon
                    icon="/icons/lucide/eye-off.svg"
                    className={styles.saveButtonIcon}
                  />
                  Exit preview
                </Button>
              ) : (
                <>
                  <ToolbarButton
                    type="button"
                    disabled={!canUndoFromToolbar}
                    aria-label="Undo"
                    title="Undo"
                    className={[styles.historyButton, styles.headerHistoryButton].join(" ")}
                    onClick={() => dispatch(createUndoCommand())}
                  >
                    <ToolbarIcon icon="/icons/lucide/undo.svg" />
                  </ToolbarButton>
                  <ToolbarButton
                    type="button"
                    disabled={!canRedoFromToolbar}
                    aria-label="Redo"
                    title="Redo"
                    className={[styles.historyButton, styles.headerHistoryButton].join(" ")}
                    onClick={() => dispatch(createRedoCommand())}
                  >
                    <ToolbarIcon icon="/icons/lucide/redo.svg" />
                  </ToolbarButton>
                </>
              )}
            </div>,
            headerHistoryTarget,
          )
        : null}
      {!suppressHeaderForSetupModal && !isVersionHistoryMode && headerOverflowTarget && isBottomPanelLayout
        ? createPortal(
            <SingleSelectDropdown
              ariaLabel="More actions"
              items={mobileHeaderMenuItems}
              value=""
              placeholder="More actions"
              triggerLabel={<span className={styles.headerOverflowDots}>⋮</span>}
              triggerVariant="ghost"
              showChevron={false}
              menuPortalToViewport
              menuPlacement="bottom-end"
              menuShowTrailingCheck={false}
              minWidth="auto"
              getItemIsDivider={(item) => item.kind === "divider"}
              getItemValue={(item) => item.id}
              getItemLabel={renderHeaderMenuItemLabel}
              getItemDisabled={(item) =>
                item.kind === "divider" ||
                (item.id === "download" && exportButtonState === "exporting") ||
                (item.id === "delete" && deleteButtonState === "deleting") ||
                (item.id === "preview" && previewModeDisabled)
              }
              onValueChange={handleHeaderMenuAction}
              wrapperClassName={styles.headerOverflowMenu}
              triggerClassName={styles.headerOverflowTrigger}
              menuClassName={styles.headerOverflowSurface}
              triggerStyle={{ minWidth: "32px", padding: "6px 8px" }}
            />,
            headerOverflowTarget,
          )
        : null}
      {!suppressHeaderForSetupModal && !isVersionHistoryMode && headerActionsTarget && !isBottomPanelLayout
        ? createPortal(
            <div className={styles.headerActionGroup}>
              {isCompactHistoryLayout ? (
                <div className={styles.headerHistoryControls}>
                  <ToolbarButton
                    type="button"
                    disabled={!canUndoFromToolbar}
                    aria-label="Undo"
                    title="Undo"
                    className={[styles.historyButton, styles.headerHistoryButton].join(" ")}
                    onClick={() => dispatch(createUndoCommand())}
                  >
                    <ToolbarIcon icon="/icons/lucide/undo.svg" />
                  </ToolbarButton>
                  <ToolbarButton
                    type="button"
                    disabled={!canRedoFromToolbar}
                    aria-label="Redo"
                    title="Redo"
                    className={[styles.historyButton, styles.headerHistoryButton].join(" ")}
                    onClick={() => dispatch(createRedoCommand())}
                  >
                    <ToolbarIcon icon="/icons/lucide/redo.svg" />
                  </ToolbarButton>
                </div>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="md"
                className={styles.headerPreviewButton}
                disabled={!previewMode && previewModeDisabled}
                onClick={previewMode ? exitPreviewMode : enterPreviewMode}
              >
                <ButtonIcon
                  icon={previewMode ? "/icons/lucide/eye-off.svg" : "/icons/lucide/eye.svg"}
                  className={styles.saveButtonIcon}
                />
                {previewMode ? "Exit preview" : "Preview"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                className={styles.headerExportButton}
                disabled={exportButtonState === "exporting"}
                onClick={() => onExportDocument(document)}
              >
                {exportButtonState === "exporting" ? (
                  <>
                    <span className={styles.saveButtonSpinner} aria-hidden="true" />
                    Exporting
                  </>
                ) : (
                  <>
                    <ButtonIcon icon="/icons/lucide/download.svg" className={styles.saveButtonIcon} />
                    Export
                  </>
                )}
              </Button>
            </div>,
            headerActionsTarget,
          )
        : null}
      {!suppressHeaderForSetupModal && !isVersionHistoryMode && headerTitleTarget
        ? createPortal(
            <EditableDesignTitle
              className={styles.headerDesignTitle}
              dispatch={dispatch}
              documentTitle={title}
              renameRequestToken={renameRequestToken}
              variant="header"
            />,
            headerTitleTarget,
          )
        : null}
      {!suppressHeaderForSetupModal && isVersionHistoryMode && headerFileLeftTarget
        ? createPortal(
            <Button
              type="button"
              variant="ghostV2"
              size="sm"
              className={styles.versionHistoryHeaderExitButton}
              onClick={onExitVersionHistoryMode}
            >
              <ButtonIcon icon="/icons/lucide/arrow-left.svg" className={styles.saveButtonIcon} />
              Exit
            </Button>,
            headerFileLeftTarget,
          )
        : null}
      {/* {!setupModalOpen && isVersionHistoryMode && headerTitleTarget
        ? createPortal(
            <div className={styles.versionHistoryHeaderTitle} style={typographyStyles.h4}>
              Version history
            </div>,
            headerTitleTarget,
          )
        : null} */}
      {!suppressHeaderForSetupModal && isVersionHistoryMode && headerActionsTarget
        ? createPortal(
            <div className={styles.versionHistoryHeaderActionGroup}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                className={styles.versionHistoryHeaderRestoreButton}
                disabled={
                  selectedVersionHistoryId === "current" || versionHistoryActionPendingId !== null
                }
                onClick={() => {
                  void handleRestoreSelectedVersionAsCopy();
                }}
              >
                <ButtonIcon icon="/icons/lucide/copy.svg" />
                Make a copy
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                className={styles.versionHistoryHeaderRestoreButton}
                disabled={
                  selectedVersionHistoryId === "current" || versionHistoryActionPendingId !== null
                }
                onClick={() => {
                  void handleRestoreSelectedVersion();
                }}
              >
                <ButtonIcon icon="/icons/lucide/rotate-ccw.svg" />
                Restore this version
              </Button>
            </div>,
            headerActionsTarget,
          )
        : null}
      {mounted && showSaveConfirmationOverlay
        ? createPortal(
            <div className={styles.editorNotificationOverlayTop}>
              <div className={styles.editorNotificationStack} 
              data-auto-dismiss="true"
              >
                <Notification
                  tone="success"
                  title="Design saved"
                  onDismiss={() => setSaveNotificationVisible(false)}
                />
              </div>
            </div>,
            window.document.body,
          )
        : null}
      {mounted && successNotification
        ? createPortal(
            <div className={styles.editorNotificationOverlayTop}>
              <div
                className={styles.editorNotificationStack}
                data-auto-dismiss="true"
              >
                <Notification
                  tone="success"
                  title={successNotification.title}
                  description={successNotification.description}
                  onDismiss={onDismissSuccessNotification}
                />
              </div>
            </div>,
            window.document.body,
          )
        : null}
      {mounted && errorNotification
        ? createPortal(
            <div className={styles.editorNotificationOverlayTop}>
              <div
                className={styles.editorNotificationStack}
                data-auto-dismiss="true"
                style={{ animationDuration: `${ERROR_NOTIFICATION_DURATION_MS}ms` }}
              >
                <Notification
                  tone="destructive"
                  title={errorNotification.title}
                  description={errorNotification.description}
                  onDismiss={onDismissErrorNotification}
                />
              </div>
            </div>,
            window.document.body,
          )
        : null}
      <Modal
        isOpen={deleteConfirmationOpen}
        title={currentStorageId ? "Move this design to Trash?" : "Discard this design?"}
        description={
          currentStorageId
            ? "This design can be restored for 30 days from My Designs."
            : "This will discard the current design."
        }
        tone="fail"
        dismissLabel="Cancel"
        confirmLabel={
          deleteButtonState === "deleting"
            ? currentStorageId
              ? "Moving..."
              : "Discarding..."
            : currentStorageId
              ? "Move to Trash"
              : "Discard design"
        }
        confirmVariant="destructive"
        onDismiss={() => {
          if (deleteButtonState === "deleting") {
            return;
          }

          setDeleteConfirmationOpen(false);
        }}
        onConfirm={() => {
          void Promise.resolve(onDeleteCurrentDesign(document))
            .finally(() => {
              setDeleteConfirmationOpen(false);
            });
        }}
        confirmDisabled={deleteButtonState === "deleting"}
        dismissDisabled={deleteButtonState === "deleting"}
      />

      <div
        className={styles.shellContent}
        data-modal-open={setupModalOpen ? "true" : "false"}
        data-mobile-selection-docked={mobileSelectionDocked ? "true" : "false"}
        data-version-history-mode={isVersionHistoryMode ? "true" : "false"}
      >
        {isVersionHistoryMode ? (
          <section className={styles.versionHistoryLayout}>
            <div className={styles.versionHistoryCanvasPane}>
              <div className={styles.canvasStage}>
                {canvasLoading ? (
                  <div className={styles.canvasLoadingOverlay} role="status" aria-live="polite">
                    <div className={styles.canvasLoadingCard}>
                      <span className={styles.canvasLoadingSpinner} aria-hidden="true" />
                      <span style={{ ...typographyStyles.p2 }}>Loading design...</span>
                    </div>
                  </div>
                ) : null}

                <div
                  ref={canvasWorldRef}
                  className={[styles.canvasWorld, styles.versionHistoryCanvasWorld].join(" ")}
                  data-loading={canvasLoading ? "true" : "false"}
                >
                  <GridWorldSurface
                    activeColorId={activeColorId}
                    activeTool={activeTool}
                    brushSize={brushSize}
                    colorsById={colorsById}
                    dispatch={dispatch}
                    highlightedColorId={highlightedColorId}
                    interactionLocked
                    onSurfaceReady={onCanvasReady}
                    previewMode={previewMode}
                    showGridlines={false}
                    showRuler={showRuler}
                    showSymbols={showSymbols}
                    state={versionHistoryDisplayState}
                    zoomAnchor={zoomAnchor}
                  />
                </div>
              </div>
            </div>

            <aside className={styles.versionHistoryPanel}>
              <div className={styles.versionHistoryPanelCard}>
                <div className={styles.versionHistoryPanelHeader}>
                  <h2 className={styles.versionHistoryPanelTitle} style={typographyStyles.h3}>
                    Version history
                  </h2>
                  {/* <p className={styles.versionHistoryPanelHint} style={typographyStyles.p2}>
                    Select a point in time to preview it on the canvas.
                  </p> */}
                </div>

                <div
                  ref={versionHistoryTimelineRef}
                  className={styles.versionHistoryTimeline}
                  role="list"
                  aria-label="Version history timeline"
                >
                  <button
                    type="button"
                    className={styles.versionHistoryTimelineItem}
                    data-selected={selectedVersionHistoryId === "current" ? "true" : "false"}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => {
                      void handleSelectVersionHistoryItem("current");
                    }}
                  >
                    <span className={styles.versionHistoryTimelineMarker} aria-hidden="true" />
                    <span className={styles.versionHistoryTimelineLine} aria-hidden="true" />
                    <span className={styles.versionHistoryTimelineContent}>
                      <span className={styles.versionHistoryTimelineTitle}>Current version</span>
                      <span className={styles.versionHistoryTimelineMeta}>Live design</span>
                    </span>
                  </button>

                  {versionHistoryLoading ? (
                    <div className={styles.versionHistoryTimelineState} style={typographyStyles.p2}>
                      Loading version history...
                    </div>
                  ) : versionHistory.length === 0 ? (
                    <div className={styles.versionHistoryTimelineState} style={typographyStyles.p2}>
                      No saved versions yet.
                    </div>
                  ) : (
                    versionHistory.map((version, index) => {
                      const isSelected = selectedVersionHistoryId === version.id;
                      const isPending = versionHistoryActionPendingId === version.id;

                      return (
                        <button
                          key={version.id}
                          type="button"
                          className={styles.versionHistoryTimelineItem}
                          data-selected={isSelected ? "true" : "false"}
                          data-last={index === versionHistory.length - 1 ? "true" : "false"}
                          onMouseDown={(event) => {
                            event.preventDefault();
                          }}
                          onClick={() => {
                            void handleSelectVersionHistoryItem(version.id);
                          }}
                        >
                          <span className={styles.versionHistoryTimelineMarker} aria-hidden="true" />
                          <span className={styles.versionHistoryTimelineLine} aria-hidden="true" />
                          <span className={styles.versionHistoryTimelineContent}>
                            <span className={styles.versionHistoryTimelineTitle}>
                              {isPending ? "Loading preview..." : formatVersionHistoryTimestamp(version.createdAt)}
                            </span>
                            <span className={styles.versionHistoryTimelineMeta}>
                              {formatVersionHistorySaveSource(version.saveSource, {
                                isInitialSnapshot: index === versionHistory.length - 1,
                              })}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {versionHistoryError ? (
                  <p className={styles.versionHistoryPanelError} style={typographyStyles.p2}>
                    {versionHistoryError}
                  </p>
                ) : null}
              </div>
            </aside>
          </section>
        ) : (
          <>
            <EditorRail
              activeSection={visibleSidebarSection}
              hideDocumentItem={!isBottomPanelLayout}
              panelCollapsed={sidebarCollapsed}
              onSelectSection={(section) => {
                if (!sidebarCollapsed && activeSidebarSection === section) {
                  dispatch(createSetSidebarCollapsedCommand(true));
                  return;
                }

                dispatch(createSetActiveSidebarSectionCommand(section));
                dispatch(createSetSidebarCollapsedCommand(false));
              }}
            />

            <section className={styles.canvasColumn}>
              <div className={styles.canvasStage}>
                {canvasLoading ? (
                  <div className={styles.canvasLoadingOverlay} role="status" aria-live="polite">
                    <div className={styles.canvasLoadingCard}>
                      <span className={styles.canvasLoadingSpinner} aria-hidden="true" />
                      <span style={{ ...typographyStyles.p2 }}>Loading design...</span>
                    </div>
                  </div>
                ) : null}

                <div
                  className={styles.sidePanelOverlay}
                  data-collapsed={sidebarCollapsed ? "true" : "false"}
                  data-mobile-canvas-focus={isBottomPanelCanvasFocusActive ? "true" : "false"}
                >
                  <EditorSidebar
                    activeSection={visibleSidebarSection}
                    autoSaveEnabled={saveMode === "autosave" && !hasCompletedSave && !saveMessage}
                    activeColor={activeColor}
                    activeColorId={activeColorId}
                    colorsById={colorsById}
                    documentTitle={title}
                    hasSavedDesignAccess={hasSavedDesignAccess}
                    hasUnsavedChanges={hasUnsavedChanges}
                    isDocumentPanelStatusVisible={showDocumentPanelStatus}
                    isBottomPanelCanvasFocusActive={isBottomPanelCanvasFocusActive}
                    palette={palette}
                    renameRequestToken={renameRequestToken}
                    gridMetrics={gridMetrics}
                    onScopeModeChange={handleUsedColorsScopeModeChange}
                    selectionScopeActive={selectionScopeActive}
                    selectionControlActive={selectionControlActive}
                    selectionPromptVisible={usedColorsSelectionPromptVisible}
                    showRuler={showRuler}
                    savedDocuments={savedDocuments}
                    savedDocumentsLoading={savedDocumentsLoading}
                    savedDocumentsHasMore={savedDocumentsHasMore}
                    savedDocumentsLoadingMore={savedDocumentsLoadingMore}
                    onOpenSavedDocuments={onOpenSavedDocuments}
                    onLoadMoreSavedDocuments={onLoadMoreSavedDocuments}
                    currentStorageId={currentStorageId}
                    onEnterVersionHistoryMode={onEnterVersionHistoryMode}
                    selectedStorageId={selectedStorageId}
                    setSelectedStorageId={setSelectedStorageId}
                    onLoadSelected={() => {
                      const selectedRecord = savedDocuments.find(
                        (record) => record.storageId === selectedStorageId,
                      );
                      if (!selectedRecord) return;
                      void onLoadDocument(selectedRecord);
                    }}
                    onClose={() => dispatch(createSetSidebarCollapsedCommand(true))}
                    onEnterBottomPanelCanvasFocus={enterBottomPanelCanvasFocus}
                    onExitBottomPanelCanvasFocus={exitBottomPanelCanvasFocus}
                    onSignIn={openSignInForCurrentDesign}
                    onStartOver={onStartOver}
                    previewMode={previewMode}
                    previewModeDisabled={previewModeDisabled}
                    traceCropDraft={tracePreviewCrop}
                    traceCropEditing={traceCropEditing}
                    onBeginTraceCrop={handleBeginTraceCrop}
                    onCancelTraceCrop={handleCancelTraceCrop}
                    onCommitTraceCrop={handleCommitTraceCrop}
                    onResetTraceCrop={handleResetTraceCrop}
                    trace={trace}
                    traceRepositionActive={traceRepositionActive}
                    traceRepositionOrigin={traceRepositionOrigin}
                    textPlacement={textPlacement}
                    iconPlacement={iconPlacement}
                    isBottomPanelLayout={isBottomPanelLayout}
                    usedColors={usedColors}
                    document={document}
                    dispatch={dispatch}
                    highlightedColorId={highlightedColorId}
                    recoveredLocalChanges={recoveredLocalChanges}
                    saveMessage={saveMessage}
                    saveMode={saveMode}
                    onHighlightColorChange={setHighlightedColorId}
                    showGridlines={showGridlines}
                    showSymbols={showSymbols}
                    textViewportCenter={textViewportCenter}
                    textViewportWidth={textViewportWidth}
                    textViewportHeight={textViewportHeight}
                  />
                </div>

                {previewMode || isBottomPanelCanvasFocusActive ? null : (
                  <div
                    ref={stageToolbarTopRef}
                    className={styles.stageToolbarTop}
                    style={{
                      ["--stage-toolbar-left-inset" as string]:
                        sidebarCollapsed || isBottomPanelLayout
                          ? "0px"
                          : `${EXPANDED_SIDEBAR_WIDTH}px`,
                    }}
                  >
                    {(traceRepositionActive || traceCropEditing) && trace ? (
                      <TraceRepositionToolbar
                        cropAspectRatioId={traceCropEditing ? traceCropAspectRatioId : undefined}
                        dispatch={dispatch}
                        onCropAspectRatioChange={
                          traceCropEditing ? handleTraceCropAspectRatioChange : undefined
                        }
                        onCancel={
                          traceCropEditing
                            ? handleCancelTraceCrop
                            : () => dispatch(createCancelTraceRepositionCommand())
                        }
                        onCommit={
                          traceCropEditing
                            ? handleCommitTraceCrop
                            : () => dispatch(createCommitTraceRepositionCommand())
                        }
                        trace={trace}
                      />
                    ) : textPlacement ? (
                      <TextPlacementToolbar
                        activeColorHex={activeColor?.hex ?? null}
                        activeColorId={activeColorId}
                        dispatch={dispatch}
                        featuredColorIds={featuredColorIds}
                        grid={document.grid}
                        gridMetrics={gridMetrics}
                        palette={palette}
                        placement={textPlacement}
                        showSymbols={showSymbols}
                        symbolAssignments={document.palette.symbolAssignments}
                      />
                    ) : iconPlacement ? (
                      <IconPlacementToolbar
                        activeColorHex={activeColor?.hex ?? null}
                        activeColorId={activeColorId}
                        dispatch={dispatch}
                        featuredColorIds={featuredColorIds}
                        grid={document.grid}
                        gridMetrics={gridMetrics}
                        palette={palette}
                        placement={iconPlacement}
                        showSymbols={showSymbols}
                        symbolAssignments={document.palette.symbolAssignments}
                      />
                    ) : (
                      <FloatingToolbar
                        activeColor={activeColor}
                        activeColorId={activeColorId}
                        activeTool={activeTool}
                        brushSize={brushSize}
                        canRedo={canRedoFromToolbar}
                        canUndo={canUndoFromToolbar}
                        dispatch={dispatch}
                        eyedropperReturnTool={state.session.eyedropperReturnTool}
                        hasPaintedCells={hasPaintedCells}
                        featuredColorIds={featuredColorIds}
                        palette={palette}
                        selectionBounds={selectionBounds}
                        selectionCommitted={selectionCommitted}
                        selectionMode={state.session.selection.mode}
                        selectionShape={state.session.selection.shape}
                        trace={trace}
                        mirrorSessionActive={Boolean(mirrorSession)}
                        isBottomPanelLayout={isBottomPanelLayout}
                        selectionRequestKey={selectionRequestKey}
                        showSymbols={showSymbols}
                        symbolAssignments={document.palette.symbolAssignments}
                      />
                    )}
                  </div>
                )}

                {previewMode ? null : (
                  <div className={styles.stageToolbarBottomRight}>
                    <ViewportToolbar
                      dispatch={dispatch}
                      fitZoom={fitZoom}
                      onFitToGrid={fitToGrid}
                      zoomAnchor={zoomAnchor}
                      viewport={viewport}
                    />
                  </div>
                )}

                <div
                  ref={canvasWorldRef}
                  className={styles.canvasWorld}
                  data-loading={canvasLoading ? "true" : "false"}
                >
                  <GridWorldSurface
                    activeColorId={activeColorId}
                    activeTool={activeTool}
                    brushSize={brushSize}
                    colorsById={colorsById}
                    dispatch={dispatch}
                    highlightedColorId={highlightedColorId}
                    onSurfaceReady={onCanvasReady}
                    previewMode={previewMode}
                    showGridlines={showGridlines}
                    showRuler={showRuler}
                    showSymbols={showSymbols}
                    state={state}
                    traceCropBase={traceCropSnapshot}
                    traceCropAspectRatio={traceCropAspectRatio}
                    traceCropEditing={traceCropEditing}
                    traceDisplayOverride={tracePreviewCrop}
                    onTraceCropPreviewChange={handlePreviewTraceCropChange}
                    zoomAnchor={zoomAnchor}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {mounted && setupModalOpen
        ? createPortal(
            <div
              className={styles.modalOverlay}
              data-blur-mode={setupModalMode}
              onClick={() => {
                if (setupModalMode === "new-only") {
                  onCloseSetupModal();
                }
              }}
            >
              {setupModal}
            </div>,
            window.document.body,
          )
        : null}
    </main>
  );
}

function HeaderFileMenu({
  currentStorageId,
  deleteButtonState,
  exportButtonState,
  getItemLabel,
  hasPersistableUnsavedChanges,
  hasSavedDesignAccess,
  items,
  onAction,
  onOpenSavedDocuments,
  recentSavedDocuments,
  saveButtonState,
  savedDocumentsLoading,
}: {
  currentStorageId: string;
  deleteButtonState: DeleteButtonState;
  exportButtonState: ExportButtonState;
  getItemLabel: (item: HeaderFileMenuItem) => ReactNode;
  hasPersistableUnsavedChanges: boolean;
  hasSavedDesignAccess: boolean;
  items: HeaderFileMenuItem[];
  onAction: (value: string) => void;
  onOpenSavedDocuments: () => Promise<void> | void;
  recentSavedDocuments: SavedEditorV2DocumentRecord[];
  saveButtonState: SaveButtonState;
  savedDocumentsLoading: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const recentCloseTimeoutRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [portalStyle, setPortalStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(
    () => () => {
      if (recentCloseTimeoutRef.current !== null) {
        window.clearTimeout(recentCloseTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      const clickedTrigger = Boolean(target && rootRef.current?.contains(target));
      const clickedMenu = Boolean(target && menuRef.current?.contains(target));

      if (!target || clickedTrigger || clickedMenu) {
        return;
      }

      setOpen(false);
      setRecentOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setRecentOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setRecentOpen(false);
      return;
    }

    if (
      hasSavedDesignAccess &&
      !savedDocumentsLoading &&
      recentSavedDocuments.length === 0
    ) {
      void onOpenSavedDocuments();
    }
  }, [
    hasSavedDesignAccess,
    onOpenSavedDocuments,
    open,
    recentSavedDocuments.length,
    savedDocumentsLoading,
  ]);

  const updatePortalStyle = useCallback(() => {
    if (!rootRef.current || !menuRef.current) {
      return;
    }

    const viewportPadding = 8;
    const triggerRect = rootRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const measuredMenuWidth = menuRect.width || 220;
    const measuredMenuHeight = menuRect.height || 0;
    const left = Math.min(
      Math.max(triggerRect.left, viewportPadding),
      window.innerWidth - measuredMenuWidth - viewportPadding,
    );
    const top = Math.min(
      triggerRect.bottom + 4,
      window.innerHeight - measuredMenuHeight - viewportPadding,
    );
    const maxHeight = Math.max(window.innerHeight - triggerRect.bottom - 12, 160);

    setPortalStyle({
      position: "fixed",
      top,
      left,
      zIndex: "var(--z-editor-popover)",
      width: 220,
      maxHeight: Math.min(400, maxHeight),
      overflowY: "auto",
      visibility: "visible",
    });
  }, []);

  useLayoutEffect(() => {
    if (!open || !mounted) {
      return;
    }

    updatePortalStyle();

    const rafId = window.requestAnimationFrame(updatePortalStyle);
    window.addEventListener("resize", updatePortalStyle);
    window.addEventListener("scroll", updatePortalStyle, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePortalStyle);
      window.removeEventListener("scroll", updatePortalStyle, true);
    };
  }, [mounted, open, updatePortalStyle]);

  function getItemDisabled(item: HeaderFileMenuItem) {
    return (
      item.kind === "divider" ||
      (item.id === "save-version" && saveButtonState === "saving") ||
      (item.id === "version-history" &&
        hasSavedDesignAccess &&
        !currentStorageId) ||
      (item.id === "download" && exportButtonState === "exporting") ||
      (item.id === "delete" && deleteButtonState === "deleting")
    );
  }

  function closeMenus() {
    if (recentCloseTimeoutRef.current !== null) {
      window.clearTimeout(recentCloseTimeoutRef.current);
      recentCloseTimeoutRef.current = null;
    }
    setOpen(false);
    setRecentOpen(false);
  }

  function clearRecentCloseTimeout() {
    if (recentCloseTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(recentCloseTimeoutRef.current);
    recentCloseTimeoutRef.current = null;
  }

  function scheduleRecentClose() {
    clearRecentCloseTimeout();
    recentCloseTimeoutRef.current = window.setTimeout(() => {
      setRecentOpen(false);
      recentCloseTimeoutRef.current = null;
    }, 180);
  }

  function handleAction(value: string) {
    closeMenus();
    onAction(value);
  }

  function handleOpenRecentDesign(storageId: string) {
    closeMenus();
    window.location.assign(`/editor/designs/${storageId}`);
  }

  function handleViewAll() {
    closeMenus();
    window.location.assign("/library");
  }

  const recentSubmenuLabel = !hasSavedDesignAccess
    ? "Sign in to view recent designs"
    : savedDocumentsLoading && recentSavedDocuments.length === 0
      ? "Loading recent designs..."
      : recentSavedDocuments.length === 0
        ? "No recent designs yet"
        : null;

  return (
    <div ref={rootRef} className={styles.headerFileMenu}>
      <MenuTrigger
        type="button"
        variant="ghost"
        open={open}
        onClick={() => setOpen((currentValue) => !currentValue)}
        className={styles.headerFileMenuTrigger}
        style={{ minWidth: "auto", padding: "6px 8px" }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.headerFileMenuTriggerLabel}>File</span>
      </MenuTrigger>
      {open && mounted
        ? createPortal(
            <MenuSurface
              ref={menuRef}
              className={[
                styles.headerFileMenuSurface,
                recentOpen ? styles.headerFileMenuSurfaceSubmenuOpen : null,
              ]
                .filter(Boolean)
                .join(" ")}
              role="menu"
              aria-label="File actions"
              style={portalStyle ?? { visibility: "hidden" }}
            >
              {items.map((item) =>
                item.kind === "divider" ? (
                  <MenuDivider key={item.id} />
                ) : item.id === "library" ? (
                  <div key={item.id} className={styles.headerFileMenuSubmenuGroup}>
                    <MenuItem
                      type="button"
                      disabled={getItemDisabled(item)}
                      onClick={() => handleAction(item.id)}
                    >
                      {getItemLabel(item)}
                    </MenuItem>
                    <div
                      className={styles.headerFileMenuSubmenuItem}
                      onMouseEnter={() => {
                        clearRecentCloseTimeout();
                        setRecentOpen(true);
                      }}
                      onMouseLeave={scheduleRecentClose}
                    >
                      <MenuItem
                        type="button"
                        trailing={<MenuCaretIcon />}
                        onClick={() => {
                          clearRecentCloseTimeout();
                          setRecentOpen((currentValue) => !currentValue);
                        }}
                        onFocus={() => {
                          clearRecentCloseTimeout();
                          setRecentOpen(true);
                        }}
                        onBlur={scheduleRecentClose}
                        className={styles.headerFileMenuSubmenuTrigger}
                      >
                        <span className={styles.headerOverflowItemLabel}>
                          <ButtonIcon
                            icon="/icons/lucide/history.svg"
                            className={styles.saveButtonIcon}
                          />
                          <span>Open recent</span>
                        </span>
                      </MenuItem>
                      {recentOpen ? (
                        <MenuSurface
                          className={styles.headerFileRecentMenuSurface}
                          role="menu"
                          aria-label="Recent designs"
                          onMouseEnter={clearRecentCloseTimeout}
                          onMouseLeave={scheduleRecentClose}
                        >
                          {recentSubmenuLabel ? (
                            <MenuItem type="button" disabled>
                              {recentSubmenuLabel}
                            </MenuItem>
                          ) : (
                            recentSavedDocuments.map((record) => (
                              <MenuItem
                                key={record.storageId}
                                type="button"
                                onClick={() => handleOpenRecentDesign(record.storageId)}
                                className={styles.headerFileRecentMenuItem}
                                title={record.title}
                              >
                                {record.title}
                              </MenuItem>
                            ))
                          )}
                          <MenuDivider />
                          <MenuItem type="button" onClick={handleViewAll}>
                            View all
                          </MenuItem>
                        </MenuSurface>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <MenuItem
                    key={item.id}
                    type="button"
                    disabled={getItemDisabled(item)}
                    onClick={() => handleAction(item.id)}
                  >
                    {getItemLabel(item)}
                  </MenuItem>
                ),
              )}
            </MenuSurface>,
            document.body,
          )
        : null}
    </div>
  );
}

function formatVersionHistoryTimestamp(value: string): string {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatVersionHistorySaveSource(
  value: EditorDesignVersionListItem["saveSource"],
  options?: { isInitialSnapshot?: boolean },
): string {
  if (options?.isInitialSnapshot && value === "MANUAL") {
    return "Initial canvas state";
  }

  if (value === "AUTOSAVE") {
    return "Autosave snapshot";
  }

  if (value === "RESTORE") {
    return "Restore snapshot";
  }

  return "Manual save";
}

function SaveButtonLabel({
  hasSavedDesignAccess,
  state,
}: {
  hasSavedDesignAccess: boolean;
  state: SaveButtonState;
}) {
  if (state === "saving") {
    return (
      <>
        <span className={styles.saveButtonSpinner} aria-hidden="true" />
        Saving
      </>
    );
  }

  if (state === "saved") {
    return (
      <>
        <ButtonIcon icon="/icons/lucide/check.svg" className={styles.saveButtonIcon} />
        Saved
      </>
    );
  }

  return hasSavedDesignAccess ? (
    <>
      <ButtonIcon icon="/icons/lucide/save.svg" className={styles.saveButtonIcon} />
      Save
    </>
  ) : (
    <>
      <ButtonIcon icon="/icons/lucide/alert.svg" data-state="alert" className={styles.alertButtonIcon} />
      Save
    </>
  );
}

function getSaveStatusState(
  saveMessage: string,
  hasSavedDesignAccess: boolean,
): "ready" | "saving" | "saved" | "error" | "info" | "alert" {
  if (!hasSavedDesignAccess && !saveMessage) {
    return "info";
  }

  if (!saveMessage) {
    return "ready";
  }

  if (saveMessage.startsWith("Saving")) {
    return "saving";
  }

  if (
    saveMessage.startsWith(SAVE_SUCCESS_PREFIX) ||
    saveMessage.startsWith(AUTOSAVE_SUCCESS_PREFIX) ||
    saveMessage.startsWith(VERSION_SAVE_SUCCESS_PREFIX)
  ) {
    return "saved";
  }

  if (saveMessage.startsWith("Couldn't")) {
    return "error";
  }

  if (saveMessage.startsWith("Sync conflict")) {
    return "alert";
  }

  if (saveMessage.startsWith("Local recovery")) {
    return "info";
  }

  return "info";
}

function duplicateDesignToNewTab(document: EditorDocumentState): void {
  if (typeof window === "undefined") {
    return;
  }

  const duplicateToken =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const localProjectId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? `local_${crypto.randomUUID()}`
      : `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const normalizedTitle = document.project.title.trim() || "Untitled Design";
  const duplicateDocument: EditorDocumentState = {
    ...document,
    project: {
      ...document.project,
      id: localProjectId,
      title: `${normalizedTitle} (Copy)`,
      createdAt: null,
      updatedAt: null,
    },
    grid: {
      ...document.grid,
      cells: [...document.grid.cells],
    },
    palette: {
      ...document.palette,
      colorsById: { ...document.palette.colorsById },
      customPalettesById: { ...document.palette.customPalettesById },
      extractedPaletteIds: [...document.palette.extractedPaletteIds],
      symbolAssignments: { ...document.palette.symbolAssignments },
    },
    trace: document.trace ? { ...document.trace } : null,
    text: {
      ...document.text,
      entities: document.text.entities.map((entity) => ({ ...entity })),
    },
    metadata: {
      ...document.metadata,
      persistedVersionId: null,
    },
  };

  window.localStorage.setItem(
    `${DUPLICATE_STORAGE_PREFIX}${duplicateToken}`,
    JSON.stringify(duplicateDocument),
  );

  const duplicateUrl = new URL(
    `/editor/designs/${duplicateDocument.project.id ?? duplicateToken}`,
    window.location.origin,
  );
  duplicateUrl.searchParams.set(DUPLICATE_QUERY_PARAM, duplicateToken);
  window.open(duplicateUrl.toString(), "_blank", "noopener,noreferrer");
}
