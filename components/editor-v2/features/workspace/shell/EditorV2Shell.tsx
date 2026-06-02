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
  ToolbarButton,
  ToolbarIcon,
} from "@/components/design-system";
import { useEditorStoreDispatch, useEditorStoreSelector } from "../../../app/editorStoreContext";
import type {
  ActiveTool,
  EditorDocumentState,
  GridCellValue,
} from "@/lib/editor-v2/editor/store";
import { isCellInSelection } from "@/lib/editor-v2/editor/selection/lassoGeometry";
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
  createCancelTraceConversionPreviewCommand,
  createBeginTraceRepositionCommand,
  createCancelTraceRepositionCommand,
  createCommitTraceRepositionCommand,
  createCancelIconPlacementCommand,
  createCancelTextPlacementCommand,
  createClearSelectionCommand,
  createRedoCommand,
  createSetActiveSidebarSectionCommand,
  createSetPreviewModeCommand,
  createSetToolCommand,
  createPanViewportCommand,
  createSetSidebarCollapsedCommand,
  createSetViewportZoomCommand,
  createUpdateIconPlacementCommand,
  createUpdateTraceCommand,
  createUndoCommand,
} from "../workspaceCommands";
import { EditorRail } from "./EditorRail";
import { EditorSidebar } from "./EditorSidebar";
import type { ColorPanelView } from "./panel-pages/ColorPanelPage";
import {
  FloatingToolbar,
  type ColorLibraryDismissGesture,
} from "./FloatingToolbar";
import { Modal, Notification } from "@/components/design-system";
import { TextPlacementToolbar } from "./TextPlacementToolbar";
import { IconPlacementToolbar } from "./IconPlacementToolbar";
import { TraceEraserToolbar } from "./TraceEraserToolbar";
import { TraceRepositionToolbar } from "./TraceRepositionToolbar";
import { ConversionPreviewToolbar } from "./ConversionPreviewToolbar";
import {
  type TraceCropAspectRatioId,
} from "./TraceRepositionToolbar";
import { SaveStatusCard } from "./SaveStatusCard";
import { GridWorldSurface } from "../stage/GridWorldSurface";
import { CanvasAidsFloatingToolbar } from "./CanvasAidsFloatingToolbar";
import { ViewportToolbar } from "./ViewportToolbar";
import { EditableDesignTitle } from "./EditableDesignTitle";
import { createEditorV2AuthHandoffRedirectUrl } from "../../../app/editorV2AuthHandoff";
import { getWorkspaceEscapeAction } from "./escapeKeyBehavior";
import { composeMaskedImageDataUrl } from "@/lib/editor-v2/editor/imageMasking";
import type { EraserEditMode, EraserMode } from "@/lib/editor-v2/editor/magicWand";
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

interface TraceEraserHistoryEntry {
  maskUrl: string | null;
  isFullyVisible: boolean;
}

interface IconPlacementEraserInitialState extends TraceEraserHistoryEntry {
  sourceSrc: string;
}

function traceEraserDebugEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const debugWindow = window as typeof window & { __TRACE_ERASER_DEBUG__?: boolean };
  if (debugWindow.__TRACE_ERASER_DEBUG__) {
    return true;
  }

  return new URLSearchParams(window.location.search).get("traceEraserDebug") === "1";
}

function traceEraserDebugLog(event: string, payload: Record<string, unknown>): void {
  if (!traceEraserDebugEnabled()) {
    return;
  }

  console.debug(`[trace-eraser:shell:${event}]`, payload);
}
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
  // { id: "rename", label: "Rename", icon: "/icons/lucide/pencil.svg" },
  { id: "library", label: "My designs", icon: "/icons/lucide/list.svg" },
  { id: "divider-primary", label: "", kind: "divider" },
  { id: "version-history", label: "Version history", icon: "/icons/lucide/history.svg" },
  // { id: "save-version", label: "Take version snapshot", icon: "/icons/lucide/save.svg" },
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

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

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
  authResolved,
  hasSavedDesignAccess,
  onCanvasReady,
  onDeleteCurrentDesign,
  onClearLocalBrowserData,
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
  lastSaveConfirmedAt,
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
  authResolved: boolean;
  hasSavedDesignAccess: boolean;
  onCanvasReady: () => void;
  onDeleteCurrentDesign: (document: EditorDocumentState) => Promise<void> | void;
  onClearLocalBrowserData: () => Promise<void> | void;
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
  lastSaveConfirmedAt: number | null;
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
  const touchSnappingEnabled = state.ui.preferences.touchSnappingEnabled;
  const previewMode = state.ui.preferences.previewMode;
  const activeSidebarSection = state.ui.shell.activeSidebarSection;
  const sidebarCollapsed = state.ui.shell.sidebarCollapsed;
  const hasUnsavedChanges = hasPersistableUnsavedChanges;
  const hasCompletedSave = state.session.persistence.lastSavedAt !== null;
  const traceRepositionActive = Boolean(state.session.traceInteraction.repositionSnapshot);
  const traceRepositionOrigin = state.session.traceInteraction.repositionOrigin;
  const traceConversionPreview = state.session.traceInteraction.conversionPreview;
  const mirrorSession = state.session.mirrorInteraction.session;
  const textPlacement = state.session.textInteraction.placement;
  const iconPlacement = state.session.iconInteraction.placement;
  const selectionCommitted = Boolean(selectionBounds && !state.session.selection.preview);
  const canvasWorldRef = useRef<HTMLDivElement | null>(null);
  const versionHistoryTimelineRef = useRef<HTMLDivElement | null>(null);
  const stageToolbarTopRef = useRef<HTMLDivElement | null>(null);
  const colorLibraryDismissGestureRef = useRef<ColorLibraryDismissGesture | null>(null);
  const hasAppliedInitialFitRef = useRef(false);
  const hasAppliedMobileLayoutRef = useRef(false);
  const mobileTraceRepositionWasActiveRef = useRef(false);
  const mobileTraceConversionPreviewWasActiveRef = useRef(false);
  const mobileTextPlacementWasActiveRef = useRef(false);
  const previewSessionSnapshotRef = useRef<PreviewSessionSnapshot | null>(null);
  const bottomPanelCanvasFocusSnapshotRef =
    useRef<BottomPanelCanvasFocusSnapshot | null>(null);
  const previewFitPendingRef = useRef(false);
  const versionHistoryFitPendingRef = useRef(false);
  const bottomPanelCanvasFocusFitPendingRef = useRef(false);
  const reopenColorPanelAfterSelectionRef = useRef(false);
  const usedColorsSelectionPromptStartedRef = useRef(false);
  const previousActiveSidebarSectionRef = useRef(activeSidebarSection);
  const selectionScopeOwnerRef = useRef<"panel" | "toolbar" | null>(null);
  const traceEditReturnToolRef = useRef<ActiveTool | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isBottomPanelLayout, setIsBottomPanelLayout] = useState(false);
  const visibleSidebarSection =
    !isBottomPanelLayout &&
    activeSidebarSection === "settings"
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
  const [exportAuthModalOpen, setExportAuthModalOpen] = useState(false);
  const [highlightedColorId, setHighlightedColorId] = useState<string | null>(null);
  const [colorSwapPreview, setColorSwapPreview] = useState<{
    fromColorId: string;
    toColorId: string;
  } | null>(null);
  const [colorMergePreview, setColorMergePreview] = useState<{
    fromColorIds: string[];
    toColorId: string;
  } | null>(null);
  const [tracePreviewCrop, setTracePreviewCrop] = useState<TraceCropRect | null>(null);
  const [traceCropSnapshot, setTraceCropSnapshot] = useState<TraceCropRect | null>(null);
  const [traceCropAspectRatioId, setTraceCropAspectRatioId] =
    useState<TraceCropAspectRatioId>("freehand");
  const [traceEditModeActive, setTraceEditModeActive] = useState(false);
  const [traceEraserActive, setTraceEraserActive] = useState(false);
  const [traceEraserBrushSize, setTraceEraserBrushSize] = useState(1);
  const [traceEraserEditMode, setTraceEraserEditMode] = useState<EraserEditMode>("brush");
  const [traceEraserMode, setTraceEraserMode] = useState<EraserMode>("erase");
  const [traceEraserDraftMaskUrl, setTraceEraserDraftMaskUrl] = useState<string | null>(null);
  const [traceEraserDraftRevision, setTraceEraserDraftRevision] = useState(0);
  const [traceEraserBrushPreviewVisible, setTraceEraserBrushPreviewVisible] = useState(false);
  const [mainBrushPreviewVisible, setMainBrushPreviewVisible] = useState(false);
  const [traceEraserMaskFullyVisible, setTraceEraserMaskFullyVisible] = useState(true);
  const [traceEraserDirty, setTraceEraserDirty] = useState(false);
  const [traceEraserInitialState, setTraceEraserInitialState] =
    useState<TraceEraserHistoryEntry | null>(null);
  const [traceEraserUndoStack, setTraceEraserUndoStack] = useState<TraceEraserHistoryEntry[]>([]);
  const [traceEraserRedoStack, setTraceEraserRedoStack] = useState<TraceEraserHistoryEntry[]>([]);
  const [iconEraserActive, setIconEraserActive] = useState(false);
  const [iconEraserBrushSize, setIconEraserBrushSize] = useState(1);
  const [iconEraserEditMode, setIconEraserEditMode] = useState<EraserEditMode>("brush");
  const [iconEraserMode, setIconEraserMode] = useState<EraserMode>("erase");
  const [iconEraserDraftMaskUrl, setIconEraserDraftMaskUrl] = useState<string | null>(null);
  const [iconEraserDraftRevision, setIconEraserDraftRevision] = useState(0);
  const [iconEraserBrushPreviewVisible, setIconEraserBrushPreviewVisible] = useState(false);
  const [iconEraserMaskFullyVisible, setIconEraserMaskFullyVisible] = useState(true);
  const [iconEraserDirty, setIconEraserDirty] = useState(false);
  const [iconEraserInitialState, setIconEraserInitialState] =
    useState<IconPlacementEraserInitialState | null>(null);
  const [iconEraserUndoStack, setIconEraserUndoStack] = useState<TraceEraserHistoryEntry[]>([]);
  const [iconEraserRedoStack, setIconEraserRedoStack] = useState<TraceEraserHistoryEntry[]>([]);
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
  const colorSwapPreviewCells = useMemo<GridCellValue[] | null>(() => {
    if (!colorSwapPreview) {
      return null;
    }

    const { fromColorId, toColorId } = colorSwapPreview;

    if (
      fromColorId === toColorId ||
      !colorsById[fromColorId] ||
      !colorsById[toColorId]
    ) {
      return null;
    }

    const selectionActive =
      state.session.selection.mode !== "none" && state.session.selection.rect !== null;
    const gridWidth = state.document.grid.width;
    let changed = false;
    const previewCells = state.document.grid.cells.map((cell, index) => {
      if (cell !== fromColorId) {
        return cell;
      }

      if (
        selectionActive &&
        !isCellInSelection(state, {
          x: index % gridWidth,
          y: Math.floor(index / gridWidth),
        })
      ) {
        return cell;
      }

      changed = true;
      return toColorId;
    });

    return changed ? previewCells : null;
  }, [colorSwapPreview, colorsById, state]);
  const colorMergePreviewCells = useMemo<GridCellValue[] | null>(() => {
    if (!colorMergePreview) {
      return null;
    }

    const { fromColorIds, toColorId } = colorMergePreview;
    const fromColorIdSet = new Set(fromColorIds.filter((colorId) => colorId !== toColorId));

    if (
      fromColorIdSet.size === 0 ||
      !colorsById[toColorId] ||
      !Array.from(fromColorIdSet).every((colorId) => colorsById[colorId])
    ) {
      return null;
    }

    const selectionActive =
      state.session.selection.mode !== "none" && state.session.selection.rect !== null;
    const gridWidth = state.document.grid.width;
    let changed = false;
    const previewCells = state.document.grid.cells.map((cell, index) => {
      if (!cell || !fromColorIdSet.has(cell)) {
        return cell;
      }

      if (
        selectionActive &&
        !isCellInSelection(state, {
          x: index % gridWidth,
          y: Math.floor(index / gridWidth),
        })
      ) {
        return cell;
      }

      changed = true;
      return toColorId;
    });

    return changed ? previewCells : null;
  }, [colorMergePreview, colorsById, state]);
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
    setTraceEditModeActive(false);
    setTraceEraserActive(false);
    setTraceEraserEditMode("brush");
    setTraceEraserMode("erase");
    setTraceEraserDraftMaskUrl(null);
    setTraceEraserDraftRevision(0);
    setTraceEraserBrushPreviewVisible(false);
    setMainBrushPreviewVisible(false);
    setTraceEraserMaskFullyVisible(!trace?.maskUrl);
    setTraceEraserDirty(false);
    setTraceEraserInitialState(null);
    setTraceEraserUndoStack([]);
    setTraceEraserRedoStack([]);
  }, [trace?.previewUrl]);

  useEffect(() => {
    setIconEraserActive(false);
    setIconEraserEditMode("brush");
    setIconEraserMode("erase");
    setIconEraserDraftMaskUrl(null);
    setIconEraserDraftRevision(0);
    setIconEraserBrushPreviewVisible(false);
    setIconEraserMaskFullyVisible(true);
    setIconEraserDirty(false);
    setIconEraserInitialState(null);
    setIconEraserUndoStack([]);
    setIconEraserRedoStack([]);
  }, [iconPlacement?.iconId]);

  useEffect(() => {
    if (activeTool === "paint" || activeTool === "erase") {
      return;
    }

    setMainBrushPreviewVisible(false);
  }, [activeTool]);

  const traceCropEditing = tracePreviewCrop !== null && traceCropSnapshot !== null;
  const traceEraserEditing = traceEraserActive;
  const iconEraserEditing = iconEraserActive;
  const traceEraserCanUndo = traceEraserUndoStack.length > 0;
  const traceEraserCanRedo = traceEraserRedoStack.length > 0;
  const iconEraserCanUndo = iconEraserUndoStack.length > 0;
  const iconEraserCanRedo = iconEraserRedoStack.length > 0;
  const traceEditSubmode = traceCropEditing
    ? "crop"
    : traceEraserEditing
      ? "erase"
      : traceRepositionActive
        ? "reposition"
        : "none";
  const traceImageEditingActive =
    traceEditModeActive || traceEditSubmode !== "none";
  const allowTraceModeSwitchesWhileRepositioning =
    traceRepositionOrigin === "upload" || traceRepositionOrigin === "replace";
  const repositionModeActive =
    traceImageEditingActive ||
    traceRepositionActive ||
    traceCropEditing ||
    traceEraserEditing ||
    iconEraserEditing ||
    textPlacement !== null ||
    iconPlacement !== null;
  const canUndoFromToolbar = canUndo && !repositionModeActive;
  const canRedoFromToolbar = canRedo && !repositionModeActive;
  const handleBeginTraceCrop = useCallback(() => {
    if (!trace) {
      return;
    }

    const nextCrop = getNormalizedTraceCrop(trace);
    setTraceCropSnapshot(nextCrop);
    setTracePreviewCrop(nextCrop);
    setTraceCropAspectRatioId("freehand");
  }, [trace]);

  const handlePreviewTraceCropChange = useCallback((crop: TraceCropRect | null) => {
    setTracePreviewCrop(crop);
  }, []);

  const handleBeginTraceEraser = useCallback(() => {
    if (!trace) {
      return;
    }

    const nextInitialState = {
      maskUrl: trace.maskUrl ?? null,
      isFullyVisible: !trace.maskUrl,
    };

    traceEraserDebugLog("begin", {
      previewUrl: trace.previewUrl,
      maskUrl: trace.maskUrl,
      imageWidth: trace.imageWidth,
      imageHeight: trace.imageHeight,
      cropX: trace.cropX,
      cropY: trace.cropY,
      cropWidth: trace.cropWidth,
      cropHeight: trace.cropHeight,
    });
    setTraceEraserInitialState(nextInitialState);
    setTraceEraserDraftMaskUrl(nextInitialState.maskUrl);
    setTraceEraserDraftRevision((current) => current + 1);
    setTraceEraserMaskFullyVisible(nextInitialState.isFullyVisible);
    setTraceEraserEditMode("brush");
    setTraceEraserMode("erase");
    setTraceEraserBrushPreviewVisible(false);
    setTraceEraserDirty(false);
    setTraceEraserUndoStack([]);
    setTraceEraserRedoStack([]);
    setTraceEraserActive(true);
  }, [trace]);

  const handleTraceEraserEditModeChange = useCallback((nextMode: EraserEditMode) => {
    setTraceEraserEditMode(nextMode);
    if (nextMode === "magic") {
      setTraceEraserMode("erase");
      setTraceEraserBrushPreviewVisible(false);
    }
  }, []);

  const handleTraceEraserModeChange = useCallback(
    (nextMode: EraserMode) => {
      if (traceEraserEditMode === "magic" && nextMode === "restore") {
        return;
      }

      setTraceEraserMode(nextMode);
    },
    [traceEraserEditMode],
  );

  const applyTraceEraserHistoryEntry = useCallback(
    (entry: TraceEraserHistoryEntry) => {
      setTraceEraserDraftMaskUrl(entry.maskUrl);
      setTraceEraserDraftRevision((current) => current + 1);
      setTraceEraserMaskFullyVisible(entry.isFullyVisible);
      setTraceEraserDirty(
        traceEraserInitialState === null
          ? false
          : entry.maskUrl !== traceEraserInitialState.maskUrl ||
              entry.isFullyVisible !== traceEraserInitialState.isFullyVisible,
      );
    },
    [traceEraserInitialState],
  );

  const handleTraceEraserDraftChange = useCallback(
    (nextMaskUrl: string | null, isFullyVisible: boolean) => {
      if (
        nextMaskUrl === traceEraserDraftMaskUrl &&
        isFullyVisible === traceEraserMaskFullyVisible
      ) {
        return;
      }

      traceEraserDebugLog("draft-change", {
        nextMaskUrl,
        isFullyVisible,
      });
      setTraceEraserUndoStack((current) => [
        ...current,
        {
          maskUrl: traceEraserDraftMaskUrl,
          isFullyVisible: traceEraserMaskFullyVisible,
        },
      ]);
      setTraceEraserRedoStack([]);
      setTraceEraserDraftMaskUrl(nextMaskUrl);
      setTraceEraserMaskFullyVisible(isFullyVisible);
      setTraceEraserDirty(
        traceEraserInitialState === null
          ? true
          : nextMaskUrl !== traceEraserInitialState.maskUrl ||
              isFullyVisible !== traceEraserInitialState.isFullyVisible,
      );
    },
    [traceEraserDraftMaskUrl, traceEraserInitialState, traceEraserMaskFullyVisible],
  );

  const handleTraceEraserUndo = useCallback(() => {
    if (traceEraserUndoStack.length === 0) {
      return;
    }

    const previousEntry = traceEraserUndoStack[traceEraserUndoStack.length - 1];
    setTraceEraserUndoStack((current) => current.slice(0, -1));
    setTraceEraserRedoStack((current) => [
      {
        maskUrl: traceEraserDraftMaskUrl,
        isFullyVisible: traceEraserMaskFullyVisible,
      },
      ...current,
    ]);
    applyTraceEraserHistoryEntry(previousEntry);
  }, [
    applyTraceEraserHistoryEntry,
    traceEraserDraftMaskUrl,
    traceEraserMaskFullyVisible,
    traceEraserUndoStack,
  ]);

  const handleTraceEraserRedo = useCallback(() => {
    if (traceEraserRedoStack.length === 0) {
      return;
    }

    const [nextEntry, ...remainingEntries] = traceEraserRedoStack;
    setTraceEraserRedoStack(remainingEntries);
    setTraceEraserUndoStack((current) => [
      ...current,
      {
        maskUrl: traceEraserDraftMaskUrl,
        isFullyVisible: traceEraserMaskFullyVisible,
      },
    ]);
    applyTraceEraserHistoryEntry(nextEntry);
  }, [
    applyTraceEraserHistoryEntry,
    traceEraserDraftMaskUrl,
    traceEraserMaskFullyVisible,
    traceEraserRedoStack,
  ]);

  const handleCancelTraceEraser = useCallback(() => {
    traceEraserDebugLog("cancel", {});
    setTraceEraserActive(false);
    setTraceEraserDraftMaskUrl(null);
    setTraceEraserDraftRevision(0);
    setTraceEraserBrushPreviewVisible(false);
    setTraceEraserMaskFullyVisible(true);
    setTraceEraserDirty(false);
    setTraceEraserEditMode("brush");
    setTraceEraserMode("erase");
    setTraceEraserInitialState(null);
    setTraceEraserUndoStack([]);
    setTraceEraserRedoStack([]);
  }, []);

  const handleCommitTraceEraser = useCallback(async () => {
    if (!trace) {
      handleCancelTraceEraser();
      return;
    }

    let nextMaskUrl = trace.maskUrl ?? null;

    if (traceEraserDirty) {
      if (traceEraserMaskFullyVisible || !traceEraserDraftMaskUrl) {
        nextMaskUrl = null;
      } else {
        nextMaskUrl = await uploadTraceMask({
          dataUrl: traceEraserDraftMaskUrl,
          originalUrl: trace.originalUrl,
        });
      }

      traceEraserDebugLog("commit", {
        previousMaskUrl: trace.maskUrl,
        draftMaskUrl: traceEraserDraftMaskUrl,
        nextMaskUrl,
        traceEraserMaskFullyVisible,
      });

      if (nextMaskUrl !== trace.maskUrl) {
        dispatch(
          createUpdateTraceCommand(
            { maskUrl: nextMaskUrl },
            { history: { mode: "push", label: "Erase Trace" }, source: "toolbar" },
          ),
        );
      }
    }

    handleCancelTraceEraser();
  }, [
    dispatch,
    handleCancelTraceEraser,
    trace,
    traceEraserDirty,
    traceEraserDraftMaskUrl,
    traceEraserMaskFullyVisible,
  ]);

  const handleBeginIconEraser = useCallback(() => {
    if (!iconPlacement) {
      return;
    }

    const nextInitialState = {
      maskUrl: null,
      isFullyVisible: true,
      sourceSrc: iconPlacement.src,
    };

    setIconEraserInitialState(nextInitialState);
    setIconEraserDraftMaskUrl(nextInitialState.maskUrl);
    setIconEraserDraftRevision((current) => current + 1);
    setIconEraserMaskFullyVisible(nextInitialState.isFullyVisible);
    setIconEraserEditMode("brush");
    setIconEraserMode("erase");
    setIconEraserBrushPreviewVisible(false);
    setIconEraserDirty(false);
    setIconEraserUndoStack([]);
    setIconEraserRedoStack([]);
    setIconEraserActive(true);
  }, [iconPlacement]);

  const handleIconEraserEditModeChange = useCallback((nextMode: EraserEditMode) => {
    setIconEraserEditMode(nextMode);
    if (nextMode === "magic") {
      setIconEraserMode("erase");
      setIconEraserBrushPreviewVisible(false);
    }
  }, []);

  const handleIconEraserModeChange = useCallback(
    (nextMode: EraserMode) => {
      if (iconEraserEditMode === "magic" && nextMode === "restore") {
        return;
      }

      setIconEraserMode(nextMode);
    },
    [iconEraserEditMode],
  );

  const applyIconEraserHistoryEntry = useCallback(
    (entry: TraceEraserHistoryEntry) => {
      setIconEraserDraftMaskUrl(entry.maskUrl);
      setIconEraserDraftRevision((current) => current + 1);
      setIconEraserMaskFullyVisible(entry.isFullyVisible);
      setIconEraserDirty(
        iconEraserInitialState === null
          ? false
          : entry.maskUrl !== iconEraserInitialState.maskUrl ||
              entry.isFullyVisible !== iconEraserInitialState.isFullyVisible,
      );
    },
    [iconEraserInitialState],
  );

  const handleIconEraserDraftChange = useCallback(
    (nextMaskUrl: string | null, isFullyVisible: boolean) => {
      if (
        nextMaskUrl === iconEraserDraftMaskUrl &&
        isFullyVisible === iconEraserMaskFullyVisible
      ) {
        return;
      }

      setIconEraserUndoStack((current) => [
        ...current,
        {
          maskUrl: iconEraserDraftMaskUrl,
          isFullyVisible: iconEraserMaskFullyVisible,
        },
      ]);
      setIconEraserRedoStack([]);
      setIconEraserDraftMaskUrl(nextMaskUrl);
      setIconEraserMaskFullyVisible(isFullyVisible);
      setIconEraserDirty(
        iconEraserInitialState === null
          ? true
          : nextMaskUrl !== iconEraserInitialState.maskUrl ||
              isFullyVisible !== iconEraserInitialState.isFullyVisible,
      );
    },
    [iconEraserDraftMaskUrl, iconEraserInitialState, iconEraserMaskFullyVisible],
  );

  const handleIconEraserUndo = useCallback(() => {
    if (iconEraserUndoStack.length === 0) {
      return;
    }

    const previousEntry = iconEraserUndoStack[iconEraserUndoStack.length - 1];
    setIconEraserUndoStack((current) => current.slice(0, -1));
    setIconEraserRedoStack((current) => [
      {
        maskUrl: iconEraserDraftMaskUrl,
        isFullyVisible: iconEraserMaskFullyVisible,
      },
      ...current,
    ]);
    applyIconEraserHistoryEntry(previousEntry);
  }, [
    applyIconEraserHistoryEntry,
    iconEraserDraftMaskUrl,
    iconEraserMaskFullyVisible,
    iconEraserUndoStack,
  ]);

  const handleIconEraserRedo = useCallback(() => {
    if (iconEraserRedoStack.length === 0) {
      return;
    }

    const [nextEntry, ...remainingEntries] = iconEraserRedoStack;
    setIconEraserRedoStack(remainingEntries);
    setIconEraserUndoStack((current) => [
      ...current,
      {
        maskUrl: iconEraserDraftMaskUrl,
        isFullyVisible: iconEraserMaskFullyVisible,
      },
    ]);
    applyIconEraserHistoryEntry(nextEntry);
  }, [
    applyIconEraserHistoryEntry,
    iconEraserDraftMaskUrl,
    iconEraserMaskFullyVisible,
    iconEraserRedoStack,
  ]);

  const handleCancelIconEraser = useCallback(() => {
    setIconEraserActive(false);
    setIconEraserDraftMaskUrl(null);
    setIconEraserDraftRevision(0);
    setIconEraserBrushPreviewVisible(false);
    setIconEraserMaskFullyVisible(true);
    setIconEraserDirty(false);
    setIconEraserEditMode("brush");
    setIconEraserMode("erase");
    setIconEraserInitialState(null);
    setIconEraserUndoStack([]);
    setIconEraserRedoStack([]);
  }, []);

  const handleCommitIconEraser = useCallback(async () => {
    if (!iconPlacement || !iconEraserInitialState) {
      handleCancelIconEraser();
      return;
    }

    if (iconEraserDirty) {
      const nextSourceSrc =
        iconEraserMaskFullyVisible || !iconEraserDraftMaskUrl
          ? iconEraserInitialState.sourceSrc
          : await composeMaskedImageDataUrl({
              sourceSrc: iconEraserInitialState.sourceSrc,
              maskSrc: iconEraserDraftMaskUrl,
              width: iconPlacement.intrinsicWidth,
              height: iconPlacement.intrinsicHeight,
            });

      dispatch(
        createUpdateIconPlacementCommand({
          src: nextSourceSrc,
        }),
      );
    }

    handleCancelIconEraser();
  }, [
    dispatch,
    handleCancelIconEraser,
    iconEraserDirty,
    iconEraserDraftMaskUrl,
    iconEraserInitialState,
    iconEraserMaskFullyVisible,
    iconPlacement,
  ]);

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
          history: traceRepositionActive
            ? { mode: "skip" }
            : { mode: "push", label: "Crop Trace" },
          source: "toolbar",
        },
      ),
    );
    setTracePreviewCrop(null);
    setTraceCropSnapshot(null);
    setTraceCropAspectRatioId("freehand");
  }, [
    dispatch,
    state.document.grid.height,
    state.document.grid.width,
    trace,
    traceCropSnapshot,
    tracePreviewCrop,
    traceRepositionActive,
  ]);
  const handleCancelTraceReposition = useCallback(() => {
    dispatch(createCancelTraceRepositionCommand());
  }, [dispatch]);
  const handleCommitTraceReposition = useCallback(() => {
    dispatch(createCommitTraceRepositionCommand());
  }, [dispatch]);
  const handleBeginTraceReposition = useCallback(() => {
    dispatch(createBeginTraceRepositionCommand("toolbar"));
  }, [dispatch]);
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
  const handleDoneTraceEditing = useCallback(() => {
    setTraceEditModeActive(false);
  }, []);
  const handleToggleTraceEditMode = useCallback(() => {
    if (!trace) {
      return;
    }

    if (traceImageEditingActive) {
      void handleDoneTraceEditing();
      return;
    }

    setTraceEditModeActive(true);
  }, [handleDoneTraceEditing, trace, traceImageEditingActive]);
  const handleCancelActiveTraceEditMode = useCallback(() => {
    if (traceCropEditing) {
      handleCancelTraceCrop();
      return;
    }

    if (traceEraserEditing) {
      handleCancelTraceEraser();
      return;
    }

    if (traceRepositionActive) {
      if (traceRepositionOrigin === "upload" || traceRepositionOrigin === "replace") {
        setTraceEditModeActive(false);
      }
      handleCancelTraceReposition();
    }
  }, [
    handleCancelTraceCrop,
    handleCancelTraceEraser,
    handleCancelTraceReposition,
    traceCropEditing,
    traceEraserEditing,
    traceRepositionOrigin,
    traceRepositionActive,
  ]);
  const handleActivateTraceEditSubmode = useCallback(
    async (mode: "crop" | "erase" | "reposition") => {
      if (!trace) {
        return;
      }

      setTraceEditModeActive(true);

      if (traceEditSubmode === mode) {
        handleCancelActiveTraceEditMode();
        return;
      }

      const preserveUploadRepositionSession =
        traceRepositionActive &&
        (traceRepositionOrigin === "upload" || traceRepositionOrigin === "replace") &&
        mode !== "reposition";

      if (traceCropEditing) {
        handleCommitTraceCrop();
      } else if (traceEraserEditing) {
        await handleCommitTraceEraser();
      } else if (traceRepositionActive && !preserveUploadRepositionSession) {
        handleCommitTraceReposition();
      }

      if (mode === "crop") {
        handleBeginTraceCrop();
        return;
      }

      if (mode === "erase") {
        handleBeginTraceEraser();
        return;
      }

      handleBeginTraceReposition();
    },
    [
      handleBeginTraceCrop,
      handleBeginTraceEraser,
      handleBeginTraceReposition,
      handleCancelActiveTraceEditMode,
      handleCommitTraceCrop,
      handleCommitTraceEraser,
      handleCommitTraceReposition,
      trace,
      traceCropEditing,
      traceEditSubmode,
      traceEraserEditing,
      traceRepositionOrigin,
      traceRepositionActive,
    ],
  );
  const handleFitTraceToSurface = useCallback(
    (dimension: "width" | "height") => {
      if (!trace) {
        return;
      }

      const traceGridMetrics = createGridWorldMetrics(
        state.document.grid.width,
        state.document.grid.height,
        DEFAULT_CELL_SIZE,
        0,
      );
      const normalizedCrop = getNormalizedTraceCrop(trace);
      const baseRect = getContainedRect(
        normalizedCrop.cropWidth,
        normalizedCrop.cropHeight,
        traceGridMetrics.surfaceWidth,
        traceGridMetrics.surfaceHeight,
      );
      const baseDimension =
        dimension === "width" ? baseRect.width : baseRect.height;

      if (baseDimension <= 0) {
        return;
      }

      const nextScale =
        (dimension === "width"
          ? traceGridMetrics.surfaceWidth
          : traceGridMetrics.surfaceHeight) / baseDimension;
      const nextWidth = baseRect.width * nextScale;
      const nextHeight = baseRect.height * nextScale;

      dispatch(
        createUpdateTraceCommand(
          {
            offsetX: (traceGridMetrics.surfaceWidth - nextWidth) / 2 - baseRect.left,
            offsetY: (traceGridMetrics.surfaceHeight - nextHeight) / 2 - baseRect.top,
            scale: nextScale,
          },
          { history: { mode: "skip" }, source: "toolbar" },
        ),
      );
    },
    [dispatch, state.document.grid.height, state.document.grid.width, trace],
  );
  const handleApplyActiveTraceEditMode = useCallback(async () => {
    if (traceCropEditing) {
      handleCommitTraceCrop();
      return;
    }

    if (traceEraserEditing) {
      await handleCommitTraceEraser();
      return;
    }

    if (traceRepositionActive) {
      if (traceRepositionOrigin === "upload" || traceRepositionOrigin === "replace") {
        setTraceEditModeActive(false);
      }
      handleCommitTraceReposition();
    }
  }, [
    handleCommitTraceCrop,
    handleCommitTraceEraser,
    handleCommitTraceReposition,
    traceCropEditing,
    traceEraserEditing,
    traceRepositionOrigin,
    traceRepositionActive,
  ]);
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
  const handleExportRequest = useCallback(() => {
    if (!hasSavedDesignAccess) {
      setExportAuthModalOpen(true);
      return;
    }

    void onExportDocument(document);
  }, [document, hasSavedDesignAccess, onExportDocument]);

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
    traceImageEditingActive ||
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

  const clearHighlightedColor = useCallback(() => {
    setHighlightedColorId(null);

    if (isBottomPanelCanvasFocusActive) {
      exitBottomPanelCanvasFocus();
    }
  }, [exitBottomPanelCanvasFocus, isBottomPanelCanvasFocusActive]);

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
    if (!traceImageEditingActive) {
      mobileTraceRepositionWasActiveRef.current = false;
      return;
    }

    if (isBottomPanelLayout) {
      if (!mobileTraceRepositionWasActiveRef.current && !sidebarCollapsed) {
        dispatch(createSetSidebarCollapsedCommand(true));
      }
      mobileTraceRepositionWasActiveRef.current = true;
    }
  }, [
    dispatch,
    isBottomPanelLayout,
    sidebarCollapsed,
    traceImageEditingActive,
  ]);

  useEffect(() => {
    if (traceImageEditingActive) {
      if (traceEditReturnToolRef.current === null && activeTool !== "pan") {
        traceEditReturnToolRef.current = activeTool;
      }

      if (activeTool !== "pan") {
        dispatch(createSetToolCommand("pan"));
      }

      return;
    }

    const returnTool = traceEditReturnToolRef.current;
    traceEditReturnToolRef.current = null;

    if (returnTool && activeTool === "pan") {
      dispatch(createSetToolCommand(returnTool));
    }
  }, [activeTool, dispatch, traceImageEditingActive]);

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
    if (!traceConversionPreview) {
      mobileTraceConversionPreviewWasActiveRef.current = false;
      return;
    }

    if (!isBottomPanelLayout) {
      return;
    }

    if (!mobileTraceConversionPreviewWasActiveRef.current && !sidebarCollapsed) {
      dispatch(createSetSidebarCollapsedCommand(true));
    }

    mobileTraceConversionPreviewWasActiveRef.current = true;
  }, [dispatch, isBottomPanelLayout, sidebarCollapsed, traceConversionPreview]);

  const handleExitTraceConversionPreviewFromToolbar = useCallback(() => {
    dispatch(createCancelTraceConversionPreviewCommand());

    if (!isBottomPanelLayout) {
      return;
    }

    dispatch(createSetSidebarCollapsedCommand(false));
  }, [dispatch, isBottomPanelLayout]);

  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      if (isEditableKeyboardTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const isUndoShortcut = (event.metaKey || event.ctrlKey) && !event.shiftKey && key === "z";
      const isRedoShortcut =
        ((event.metaKey || event.ctrlKey) && event.shiftKey && key === "z") ||
        (event.ctrlKey && !event.shiftKey && key === "y");

      if (traceEraserEditing && isUndoShortcut && traceEraserCanUndo) {
        event.preventDefault();
        handleTraceEraserUndo();
        return;
      }

      if (traceEraserEditing && isRedoShortcut && traceEraserCanRedo) {
        event.preventDefault();
        handleTraceEraserRedo();
        return;
      }

      if (iconEraserEditing && isUndoShortcut && iconEraserCanUndo) {
        event.preventDefault();
        handleIconEraserUndo();
        return;
      }

      if (iconEraserEditing && isRedoShortcut && iconEraserCanRedo) {
        event.preventDefault();
        handleIconEraserRedo();
        return;
      }

      if (isUndoShortcut && canUndo) {
        event.preventDefault();
        dispatch(createUndoCommand());
        return;
      }

      if (isRedoShortcut && canRedo) {
        event.preventDefault();
        dispatch(createRedoCommand());
      }
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [
    canRedo,
    canUndo,
    dispatch,
    handleIconEraserRedo,
    handleIconEraserUndo,
    handleTraceEraserRedo,
    handleTraceEraserUndo,
    iconEraserCanRedo,
    iconEraserCanUndo,
    iconEraserEditing,
    traceEraserCanRedo,
    traceEraserCanUndo,
    traceEraserEditing,
  ]);

  useEffect(() => {
    const escapeAction = getWorkspaceEscapeAction({
      highlightedColorActive: highlightedColorId !== null,
      iconPlacementActive: Boolean(iconPlacement),
      previewMode,
      traceEditModeActive: traceImageEditingActive,
      textPlacementActive: Boolean(textPlacement),
      traceConversionPreviewActive: Boolean(traceConversionPreview),
      traceCropEditing,
      traceEraserEditing,
      traceRepositionActive,
    });

    if (!escapeAction) {
      return;
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented || isEditableKeyboardTarget(event.target)) {
        return;
      }

      event.preventDefault();

      if (iconEraserEditing) {
        handleCancelIconEraser();
        return;
      }

      if (escapeAction === "exit-trace-conversion-preview") {
        handleExitTraceConversionPreviewFromToolbar();
        return;
      }

      if (escapeAction === "cancel-trace-crop") {
        handleCancelTraceCrop();
        return;
      }

      if (escapeAction === "cancel-trace-eraser") {
        handleCancelTraceEraser();
        return;
      }

      if (escapeAction === "cancel-trace-reposition") {
        handleCancelTraceReposition();
        return;
      }

      if (escapeAction === "exit-trace-edit") {
        setTraceEditModeActive(false);
        return;
      }

      if (escapeAction === "cancel-text-placement") {
        dispatch(createCancelTextPlacementCommand());
        return;
      }

      if (escapeAction === "cancel-icon-placement") {
        dispatch(createCancelIconPlacementCommand());
        return;
      }

      if (escapeAction === "clear-highlight") {
        clearHighlightedColor();
        return;
      }

      exitPreviewMode();
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [
    clearHighlightedColor,
    dispatch,
    exitPreviewMode,
    handleCancelIconEraser,
    handleCancelTraceCrop,
    handleCancelTraceEraser,
    handleCancelTraceReposition,
    handleExitTraceConversionPreviewFromToolbar,
    highlightedColorId,
    iconEraserEditing,
    iconPlacement,
    previewMode,
    textPlacement,
    traceImageEditingActive,
    traceConversionPreview,
    traceCropEditing,
    traceEraserEditing,
    traceRepositionActive,
  ]);

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

  useEffect(() => {
    if (selectionControlActive || usedColorsSelectionPromptVisible) {
      return;
    }

    selectionScopeOwnerRef.current = null;
  }, [selectionControlActive, usedColorsSelectionPromptVisible]);

  const [selectionRequestKey, setSelectionRequestKey] = useState(0);
  const [requestedColorPanelView, setRequestedColorPanelView] =
    useState<ColorPanelView | null>(null);
  const [requestedColorPanelViewKey, setRequestedColorPanelViewKey] = useState(0);

  const handleUsedColorsScopeModeChange = useCallback(
    (mode: "full-canvas" | "selection") => {
      if (mode === "selection") {
        selectionScopeOwnerRef.current = "panel";
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

      selectionScopeOwnerRef.current = null;
      reopenColorPanelAfterSelectionRef.current = false;
      setUsedColorsSelectionPromptVisible(false);
      dispatch(createClearSelectionCommand());
    },
    [dispatch, isBottomPanelLayout, sidebarCollapsed],
  );

  const handleOpenSelectionColorsPanel = useCallback(() => {
    setRequestedColorPanelView("design-colors");
    setRequestedColorPanelViewKey((current) => current + 1);
    dispatch(createSetActiveSidebarSectionCommand("color"));
    dispatch(createSetSidebarCollapsedCommand(false));
  }, [dispatch]);

  const handleOpenCustomPalettesPanel = useCallback(() => {
    setRequestedColorPanelView("custom-palettes");
    setRequestedColorPanelViewKey((current) => current + 1);
    dispatch(createSetActiveSidebarSectionCommand("color"));
    dispatch(createSetSidebarCollapsedCommand(false));
  }, [dispatch]);

  const handleToolbarSelectionIntent = useCallback(() => {
    selectionScopeOwnerRef.current = "toolbar";
    reopenColorPanelAfterSelectionRef.current = false;
    setUsedColorsSelectionPromptVisible(false);
  }, []);

  useEffect(() => {
    const previousActiveSidebarSection = previousActiveSidebarSectionRef.current;

    if (
      previousActiveSidebarSection === "color" &&
      activeSidebarSection !== "color" &&
      selectionScopeOwnerRef.current === "panel"
    ) {
      selectionScopeOwnerRef.current = null;
      reopenColorPanelAfterSelectionRef.current = false;
      setUsedColorsSelectionPromptVisible(false);
      dispatch(createClearSelectionCommand());
    }

    previousActiveSidebarSectionRef.current = activeSidebarSection;
  }, [activeSidebarSection, dispatch]);

  useEffect(() => {
    if (!iconPlacement) {
      return;
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.key !== "Backspace" && event.key !== "Delete") {
        return;
      }

      const target = event.target;
      if (isEditableKeyboardTarget(target)) {
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
    activeSidebarSection === "document" &&
    hasSavedDesignAccess &&
    ((saveMode === "autosave" && showSaveStatus) ||
      (saveMode === "manual" && hasSavedDesignAccess && showSaveStatus));
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
  const showLoggedOutTopBanner =
    authResolved && !hasSavedDesignAccess && !saveBannerDismissed;
  const showTopSaveBanner = showLoggedOutTopBanner;
  const showSaveConfirmationOverlay =
    saveNotificationVisible &&
    (IS_DEV_APP_MODE || saveMode === "manual" || !hasSavedDesignAccess);

  useEffect(() => {
    if (!hasSavedDesignAccess) {
      setSaveBannerDismissed(false);
    }
  }, [hasSavedDesignAccess]);

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
      handleExportRequest();
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
      {!suppressHeaderForSetupModal && !isVersionHistoryMode && headerAutosaveTarget
        ? createPortal(
            isBottomPanelLayout ? (
              hasSavedDesignAccess ? null : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={styles.headerSaveButton}
                  onClick={() => {
                    void onClearLocalBrowserData();
                  }}
                >
                  Clear browser drafts
                </Button>
              )
            ) : (
              <div className={styles.headerFileMenuGroup}>
                <HeaderFileMenu
                  currentStorageId={currentStorageId}
                  deleteButtonState={deleteButtonState}
                  exportButtonState={exportButtonState}
                  getItemLabel={renderHeaderMenuItemLabel}
                  hasSavedDesignAccess={hasSavedDesignAccess}
                  items={headerFileMenuItems}
                  onAction={handleHeaderMenuAction}
                  onOpenSavedDocuments={onOpenSavedDocuments}
                  recentSavedDocuments={recentSavedDocuments}
                  saveButtonState={saveButtonState}
                  savedDocumentsLoading={savedDocumentsLoading}
                />
                {!hasSavedDesignAccess ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className={styles.headerSaveButton}
                    onClick={() => {
                      void onClearLocalBrowserData();
                    }}
                  >
                    Clear browser drafts
                  </Button>
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
            <HeaderFileMenu
              items={mobileHeaderMenuItems}
              saveButtonState={saveButtonState}
              exportButtonState={exportButtonState}
              deleteButtonState={deleteButtonState}
              currentStorageId={currentStorageId}
              hasSavedDesignAccess={hasSavedDesignAccess}
              savedDocumentsLoading={savedDocumentsLoading}
              recentSavedDocuments={recentSavedDocuments}
              getItemLabel={renderHeaderMenuItemLabel}
              getItemDisabled={(item) =>
                item.id === "preview" ? previewModeDisabled : false
              }
              onAction={handleHeaderMenuAction}
              onOpenSavedDocuments={onOpenSavedDocuments}
              ariaLabel="More actions"
              menuLabel="More actions"
              menuPlacement="right"
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
                onClick={handleExportRequest}
              >
                {exportButtonState === "exporting" ? (
                  <>
                    <span className={styles.saveButtonSpinner} aria-hidden="true" />
                    Exporting
                  </>
                ) : (
                  <>
                    <ButtonIcon icon="/icons/lucide/upload.svg" className={styles.saveButtonIcon} />
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
        isOpen={exportAuthModalOpen}
        title="Export your pattern as a PDF"
        description="Create a free account to download PDFs, save designs, and continue editing later."
        tone="none"
        dismissLabel="Not now"
        confirmLabel="Create free account"
        onDismiss={() => setExportAuthModalOpen(false)}
        onConfirm={() => {
          setExportAuthModalOpen(false);
          openSignInForCurrentDesign();
        }}
      />
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
                    colorLibraryDismissGestureRef={colorLibraryDismissGestureRef}
                    colorsById={colorsById}
                    dispatch={dispatch}
                    highlightedColorId={highlightedColorId}
                    interactionLocked
                    onSurfaceReady={onCanvasReady}
                    previewMode={previewMode}
                    showGridlines={false}
                    showRuler={showRuler}
                    showSymbols={showSymbols}
                    touchSnappingEnabled={touchSnappingEnabled}
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
              hideDocumentItem={false}
              hideSettingsItem={!isBottomPanelLayout}
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
                    onColorSwapPreviewChange={setColorSwapPreview}
                    onMergeColorsPreviewChange={setColorMergePreview}
                    onEnterBottomPanelCanvasFocus={enterBottomPanelCanvasFocus}
                    onExitBottomPanelCanvasFocus={exitBottomPanelCanvasFocus}
                    onDuplicateDocument={() => {
                      if (!hasSavedDesignAccess) {
                        openSignInForCurrentDesign();
                        return;
                      }

                      duplicateDesignToNewTab(document);
                    }}
                    onDownloadDocument={handleExportRequest}
                    onSaveVersionSnapshot={() => {
                      if (!hasSavedDesignAccess) {
                        openSignInForCurrentDesign();
                        return;
                      }

                      if (saveButtonState === "saving") {
                        return;
                      }

                      void onSaveVersionSnapshot();
                    }}
                    onOpenVersionHistory={() => {
                      if (!hasSavedDesignAccess) {
                        openSignInForCurrentDesign();
                        return;
                      }

                      if (!currentStorageId) {
                        return;
                      }

                      onEnterVersionHistoryMode();
                    }}
                    onSignIn={openSignInForCurrentDesign}
                    onStartOver={onStartOver}
                    onClearLocalBrowserData={onClearLocalBrowserData}
                    previewMode={previewMode}
                    snapshotSaving={saveButtonState === "saving"}
                    exportInProgress={exportButtonState === "exporting"}
                    previewModeDisabled={previewModeDisabled}
                    traceCropDraft={tracePreviewCrop}
                    traceCropEditing={traceCropEditing}
                    traceEditModeActive={traceImageEditingActive}
                    traceEraserEditing={traceEraserEditing}
                    onBeginTraceCrop={handleBeginTraceCrop}
                    onBeginTraceEraser={handleBeginTraceEraser}
                    onCancelTraceCrop={handleCancelTraceCrop}
                    onCommitTraceCrop={handleCommitTraceCrop}
                    onResetTraceCrop={handleResetTraceCrop}
                    onToggleTraceEditMode={handleToggleTraceEditMode}
                    trace={trace}
                    traceConversionPreview={traceConversionPreview}
                    traceRepositionActive={traceRepositionActive}
                    traceRepositionOrigin={traceRepositionOrigin}
                    textPlacement={textPlacement}
                    iconPlacement={iconPlacement}
                    isBottomPanelLayout={isBottomPanelLayout}
                    usedColors={usedColors}
                    document={document}
                    dispatch={dispatch}
                    highlightedColorId={highlightedColorId}
                    lastSaveConfirmedAt={lastSaveConfirmedAt}
                    recoveredLocalChanges={recoveredLocalChanges}
                    requestedColorPanelView={requestedColorPanelView}
                    requestedColorPanelViewKey={requestedColorPanelViewKey}
                    saveMessage={saveMessage}
                    saveMode={saveMode}
                    onHighlightColorChange={setHighlightedColorId}
                    showGridlines={showGridlines}
                    showSymbols={showSymbols}
                    touchSnappingEnabled={touchSnappingEnabled}
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
                    {traceConversionPreview ? (
                      <ConversionPreviewToolbar
                        dispatch={dispatch}
                        onExitPreview={handleExitTraceConversionPreviewFromToolbar}
                      />
                    ) : traceImageEditingActive && trace ? (
                      <TraceRepositionToolbar
                        activeMode={traceEditSubmode}
                        allowModeSwitchesWhileRepositioning={
                          traceEditSubmode === "reposition" &&
                          allowTraceModeSwitchesWhileRepositioning
                        }
                        cropEditing={traceCropEditing}
                        cropAspectRatioId={traceCropEditing ? traceCropAspectRatioId : undefined}
                        brushSize={traceEraserBrushSize}
                        canRedo={traceEraserCanRedo}
                        canUndo={traceEraserCanUndo}
                        eraserEditMode={traceEraserEditMode}
                        eraserMode={traceEraserMode}
                        onFitHeight={() => handleFitTraceToSurface("height")}
                        onFitWidth={() => handleFitTraceToSurface("width")}
                        onBeginCrop={() => {
                          void handleActivateTraceEditSubmode("crop");
                        }}
                        onBeginEraser={() => {
                          void handleActivateTraceEditSubmode("erase");
                        }}
                        onBeginReposition={() => {
                          void handleActivateTraceEditSubmode("reposition");
                        }}
                        onBrushSizeChange={setTraceEraserBrushSize}
                        onApplyCrop={handleCommitTraceCrop}
                        onApplyMode={() => {
                          void handleApplyActiveTraceEditMode();
                        }}
                        onCancelCrop={handleCancelTraceCrop}
                        onCancelMode={handleCancelActiveTraceEditMode}
                        onDone={handleDoneTraceEditing}
                        onCropAspectRatioChange={
                          traceCropEditing ? handleTraceCropAspectRatioChange : undefined
                        }
                        onEditModeChange={handleTraceEraserEditModeChange}
                        onModeChange={handleTraceEraserModeChange}
                        onPreviewVisibilityChange={setTraceEraserBrushPreviewVisible}
                        onRedo={handleTraceEraserRedo}
                        onResetCrop={handleResetTraceCrop}
                        onUndo={handleTraceEraserUndo}
                        trace={trace}
                      />
                    ) : textPlacement ? (
                      <TextPlacementToolbar
                        activeColorHex={activeColor?.hex ?? null}
                        activeColorId={activeColorId}
                        customPalettesById={document.palette.customPalettesById}
                        dispatch={dispatch}
                        featuredColorIds={featuredColorIds}
                        grid={document.grid}
                        gridMetrics={gridMetrics}
                        onOpenCustomPalettesPanel={handleOpenCustomPalettesPanel}
                        palette={palette}
                        placement={textPlacement}
                        showSymbols={showSymbols}
                        symbolAssignments={document.palette.symbolAssignments}
                      />
                    ) : iconEraserEditing && iconPlacement ? (
                      <TraceEraserToolbar
                        brushSize={iconEraserBrushSize}
                        canRedo={iconEraserCanRedo}
                        canUndo={iconEraserCanUndo}
                        editMode={iconEraserEditMode}
                        mode={iconEraserMode}
                        onBrushSizeChange={setIconEraserBrushSize}
                        onCancel={handleCancelIconEraser}
                        onCommit={() => {
                          void handleCommitIconEraser();
                        }}
                        onEditModeChange={handleIconEraserEditModeChange}
                        onModeChange={handleIconEraserModeChange}
                        onPreviewVisibilityChange={setIconEraserBrushPreviewVisible}
                        onRedo={handleIconEraserRedo}
                        onUndo={handleIconEraserUndo}
                      />
                    ) : iconPlacement ? (
                      <IconPlacementToolbar
                        activeColorHex={activeColor?.hex ?? null}
                        activeColorId={activeColorId}
                        customPalettesById={document.palette.customPalettesById}
                        dispatch={dispatch}
                        featuredColorIds={featuredColorIds}
                        grid={document.grid}
                        gridMetrics={gridMetrics}
                        onBeginEraser={handleBeginIconEraser}
                        onOpenCustomPalettesPanel={handleOpenCustomPalettesPanel}
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
                        activeSidebarSection={activeSidebarSection}
                        brushSize={brushSize}
                        canRedo={canRedoFromToolbar}
                        canUndo={canUndoFromToolbar}
                        customPalettesById={document.palette.customPalettesById}
                        dispatch={dispatch}
                        eyedropperReturnTool={state.session.eyedropperReturnTool}
                        gridHeight={document.grid.height}
                        gridWidth={document.grid.width}
                        hasPaintedCells={hasPaintedCells}
                        featuredColorIds={featuredColorIds}
                        palette={palette}
                        selectionBounds={selectionBounds}
                        selectionCommitted={selectionCommitted}
                        selectionMode={state.session.selection.mode}
                        selectionShape={state.session.selection.shape}
                        sidebarCollapsed={sidebarCollapsed}
                        trace={trace}
                        duplicatePlacementActive={Boolean(state.session.duplicatePlacement)}
                        duplicatePlacementOperation={
                          state.session.duplicatePlacement?.operation ?? null
                        }
                        mirrorSessionActive={Boolean(mirrorSession)}
                        isBottomPanelLayout={isBottomPanelLayout}
                        onOpenCustomPalettesPanel={handleOpenCustomPalettesPanel}
                        onToolbarSelectionIntent={handleToolbarSelectionIntent}
                        onToggleTraceEditMode={handleToggleTraceEditMode}
                        onColorLibraryDismissPointerDown={(gesture) => {
                          colorLibraryDismissGestureRef.current = gesture;
                        }}
                        onOpenSelectionColorsPanel={handleOpenSelectionColorsPanel}
                        onBrushPreviewVisibilityChange={setMainBrushPreviewVisible}
                        selectionRequestKey={selectionRequestKey}
                        showSymbols={showSymbols}
                        symbolAssignments={document.palette.symbolAssignments}
                      />
                    )}
                  </div>
                )}

                {previewMode ? null : (
                  <div className={styles.stageToolbarBottomRight}>
                    <div className={styles.stageToolbarBottomRightCluster}>
                      <ViewportToolbar
                        dispatch={dispatch}
                        fitZoom={fitZoom}
                        onFitToGrid={fitToGrid}
                        zoomAnchor={zoomAnchor}
                        viewport={viewport}
                      />
                      {!isBottomPanelLayout ? (
                        <CanvasAidsFloatingToolbar
                          dispatch={dispatch}
                          showGridlines={showGridlines}
                          showRuler={showRuler}
                          showSymbols={showSymbols}
                          touchSnappingEnabled={touchSnappingEnabled}
                        />
                      ) : null}
                    </div>
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
                    brushPreviewVisible={mainBrushPreviewVisible}
                    colorLibraryDismissGestureRef={colorLibraryDismissGestureRef}
                    colorsById={colorsById}
                    dispatch={dispatch}
                    highlightedColorId={highlightedColorId}
                    cellPreviewOverride={colorMergePreviewCells ?? colorSwapPreviewCells}
                    onSurfaceReady={onCanvasReady}
                    previewMode={previewMode}
                    showGridlines={showGridlines}
                    showRuler={showRuler}
                    showSymbols={showSymbols}
                    touchSnappingEnabled={touchSnappingEnabled}
                    state={state}
                    iconEraserBrushSize={iconEraserBrushSize}
                    iconEraserBrushPreviewVisible={iconEraserBrushPreviewVisible}
                    iconEraserEditing={iconEraserEditing}
                    iconEraserMaskUrl={iconEraserDraftMaskUrl}
                    iconEraserDraftRevision={iconEraserDraftRevision}
                    iconEraserMode={iconEraserMode}
                    iconEraserEditMode={iconEraserEditMode}
                    traceCropBase={traceCropSnapshot}
                    traceCropAspectRatio={traceCropAspectRatio}
                    traceCropEditing={traceCropEditing}
                    traceEraserBrushSize={traceEraserBrushSize}
                    traceEraserBrushPreviewVisible={traceEraserBrushPreviewVisible}
                    traceEraserEditing={traceEraserEditing}
                    traceEraserMaskUrl={traceEraserDraftMaskUrl}
                    traceEraserDraftRevision={traceEraserDraftRevision}
                    traceEraserMode={traceEraserMode}
                    traceEraserEditMode={traceEraserEditMode}
                    traceDisplayOverride={tracePreviewCrop}
                    onIconEraserDraftChange={handleIconEraserDraftChange}
                    onTraceCropPreviewChange={handlePreviewTraceCropChange}
                    onTraceEraserDraftChange={handleTraceEraserDraftChange}
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
  getItemDisabled: getAdditionalItemDisabled,
  getItemLabel,
  hasSavedDesignAccess,
  items,
  ariaLabel = "File menu",
  menuLabel = "File actions",
  menuPlacement = "left",
  onAction,
  onOpenSavedDocuments,
  recentSavedDocuments,
  saveButtonState,
  savedDocumentsLoading,
}: {
  currentStorageId: string;
  deleteButtonState: DeleteButtonState;
  exportButtonState: ExportButtonState;
  getItemDisabled?: (item: HeaderFileMenuItem) => boolean;
  getItemLabel: (item: HeaderFileMenuItem) => ReactNode;
  hasSavedDesignAccess: boolean;
  items: HeaderFileMenuItem[];
  ariaLabel?: string;
  menuLabel?: string;
  menuPlacement?: "left" | "right";
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
      if (event.key === "Escape" && open) {
        event.preventDefault();
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
    const preferredLeft =
      menuPlacement === "right"
        ? triggerRect.right - measuredMenuWidth
        : triggerRect.left;
    const left = Math.max(
      viewportPadding,
      Math.min(preferredLeft, window.innerWidth - measuredMenuWidth - viewportPadding),
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
  }, [menuPlacement]);

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
      getAdditionalItemDisabled?.(item) ||
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
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.headerFileMenuTriggerIcon} aria-hidden="true" />
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
              aria-label={menuLabel}
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

async function uploadTraceMask(input: {
  dataUrl: string;
  originalUrl: string;
}): Promise<string> {
  const blob = await dataUrlToBlob(input.dataUrl);
  const formData = new FormData();
  formData.set("file", new File([blob], "trace-mask.png", { type: "image/png" }));
  formData.set("originalUrl", input.originalUrl);

  const response = await fetch("/api/upload-trace-mask", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Couldn't upload trace mask.");
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Trace mask upload did not return a URL.");
  }

  return payload.url;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
