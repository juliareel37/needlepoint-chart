import type { EditorCommandKind, EditorCommandSource } from "../commands/types";
import type { DocumentPatch } from "./patches";
import type { IconColorSlot } from "../icons/iconColorSlots";
import type { PrimitiveIconKind } from "../icons/primitiveIcon";

export type GridCellValue = string | null;

export interface EditorStoreState {
  document: EditorDocumentState;
  session: EditorSessionState;
  ui: EditorUiState;
}

export interface EditorDocumentState {
  project: ProjectDocument;
  grid: GridDocument;
  palette: PaletteDocument;
  trace: TraceDocument | null;
  text: TextDocument;
  metadata: DocumentMetadata;
}

export interface ProjectDocument {
  id: string | null;
  title: string;
  createdAt: string | null;
  updatedAt: string | null;
  sourceVersion: number;
}

export interface GridDocument {
  width: number;
  height: number;
  meshCount: number | null;
  sizingMode: "stitches" | "inches";
  widthInches: number | null;
  heightInches: number | null;
  cells: GridCellValue[];
}

export interface PaletteDocument {
  colorsById: Record<string, PaletteColor>;
  customPalettesById: Record<string, CustomPalette>;
  extractedPaletteIds: string[];
  symbolAssignments: Record<string, string>;
}

export interface PaletteColor {
  id: string;
  brand: "dmc" | "custom";
  code: string;
  name: string;
  hex: string;
}

export interface CustomPalette {
  id: string;
  name: string;
  colorIds: string[];
}

export interface TraceDocument {
  previewUrl: string;
  thumbnailUrl: string;
  originalUrl: string;
  fileName: string | null;
  byteSize: number | null;
  mimeType: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  blendMode: TraceBlendMode;
  opacity: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
}

export type TraceBlendMode = "image" | "crossfade";

export interface TextDocument {
  mode: "destructive-grid" | "entities";
  entities: TextEntity[];
}

export interface TextEntity {
  id: string;
  text: string;
  colorId: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: "normal" | "italic";
  fontWeight: number;
  x: number;
  y: number;
}

export interface DocumentMetadata {
  legacyDraftId: string | null;
  persistedVersionId: string | null;
  schemaVersion: number;
}

export interface EditorSessionState {
  activeTool: ActiveToolState;
  eyedropperReturnTool: ActiveTool | null;
  viewport: ViewportState;
  selection: SelectionState;
  mirrorInteraction: MirrorInteractionState;
  history: HistoryState;
  persistence: PersistenceSessionState;
  traceInteraction: TraceInteractionState;
  textInteraction: TextInteractionState;
  iconInteraction: IconInteractionState;
  inFlightCommand: InFlightCommandState | null;
}

export type ActiveTool =
  | "none"
  | "paint"
  | "erase"
  | "fill"
  | "eyedropper"
  | "pan"
  | "lasso"
  | "mirror"
  | "trace"
  | "text";

export interface ActiveToolState {
  tool: ActiveTool;
  brushSize: number;
  paintBrushSize: number;
  eraseBrushSize: number;
  colorId: string | null;
}

export interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface SelectionState {
  mode: "none" | "rect" | "lasso" | "mirror";
  shape: "freehand" | "rect";
  rect: GridRect | null;
  lassoPoints: SelectionPoint[];
  mirrorAxis: "horizontal" | "vertical" | null;
  preview: SelectionPreviewState | null;
}

export type MirrorDirection = "left" | "right" | "top" | "bottom";

export interface MirrorInteractionState {
  session: MirrorSessionState | null;
}

export interface MirrorSessionState {
  sourceRect: GridRect | null;
  dragAnchor: GridPoint | null;
  appliedDirection: MirrorDirection | null;
  forwardPatches: DocumentPatch[];
  inversePatches: DocumentPatch[];
}

export interface GridPoint {
  x: number;
  y: number;
}

export interface SelectionPoint {
  x: number;
  y: number;
}

export interface GridRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionPreviewState {
  hoveredCell: GridPoint | null;
  liveRegion: GridRect | null;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  lastAppliedCommandId: string | null;
  transaction: HistoryTransactionState | null;
}

export interface HistoryEntry {
  commandId: string;
  label: string;
  forwardPatches: DocumentPatch[];
  inversePatches: DocumentPatch[];
  timestamp: number;
}

export interface HistoryTransactionState {
  id: string;
  label: string;
  forwardPatches: DocumentPatch[];
  inversePatches: DocumentPatch[];
}

export interface PersistenceSessionState {
  currentDraftId: string | null;
  dirty: boolean;
  saving: boolean;
  loading: boolean;
  lastSavedAt: number | null;
  lastLoadedAt: number | null;
  restoreSource: "none" | "server" | "local-backup" | "version-preview";
  versionPreview: VersionPreviewState | null;
}

export interface VersionPreviewState {
  versionId: string;
  draftId: string;
}

export interface TraceInteractionState {
  uploadStatus: "idle" | "uploading" | "uploaded" | "error";
  placementMode: "idle" | "move" | "scale" | "rotate";
  repositionOrigin: TraceRepositionOrigin | null;
  replacedTrace: TraceDocument | null;
  repositionSnapshot: TraceRepositionSnapshot | null;
  runtimeImageRefId: string | null;
}

export type TraceRepositionOrigin =
  | "upload"
  | "replace"
  | "panel"
  | "toolbar";

export type TraceRepositionSnapshot = Pick<
  TraceDocument,
  "offsetX" | "offsetY" | "scale" | "locked"
>;

export interface TextInteractionState {
  draftText: string;
  draftColorId: string | null;
  draftFontFamily: string;
  draftFontSize: number;
  draftFontStyle: "normal" | "italic";
  draftFontWeight: number;
  previewPosition: GridPoint | null;
  placement: TextPlacementSession | null;
}

export interface IconInteractionState {
  placement: IconPlacementSession | null;
}

export interface TextPlacementSession {
  text: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  baseFontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "italic";
  fontWeight: number;
  underline: boolean;
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface IconPlacementSession {
  iconId: string;
  name: string;
  src: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  colorSlots: IconColorSlot[];
  primitiveKind: PrimitiveIconKind | null;
  lockAspectRatio: boolean;
  primitiveStrokeReferenceSize: number | null;
  supportsStrokeWidth: boolean;
  strokeWidthScale: number;
  primitivePatternScale: number;
  primitiveSpacingScale: number;
  selectedColorSlotId: string | null;
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
}

export interface InFlightCommandState {
  id: string;
  kind: EditorCommandKind;
  startedAt: number;
  source: EditorCommandSource;
}

export interface EditorUiState {
  shell: ShellUiState;
  panels: PanelUiState;
  dialogs: DialogUiState;
  menus: MenuUiState;
  preferences: UiPreferenceState;
}

export type EditorSidebarSection =
  | "document"
  | "color"
  | "trace"
  | "text"
  | "icons"
  | "settings";

export interface ShellUiState {
  sidebarCollapsed: boolean;
  activeSidebarSection: EditorSidebarSection;
  mobileToolbarVisible: boolean;
  mobileToolbarCollapsed: boolean;
  isCompact: boolean;
  isNarrow: boolean;
}

export interface PanelUiState {
  gridOpen: boolean;
  wipOpen: boolean;
  traceOpen: boolean;
  usedColorsOpen: boolean;
  customPalettesOpen: boolean;
  imageToPatternOpen: boolean;
  textOpen: boolean;
  settingsOpen: boolean;
}

export interface DialogUiState {
  confirmDialog: ConfirmDialogState | null;
  draftPickerOpen: boolean;
  versionHistoryOpen: boolean;
}

export interface ConfirmDialogState {
  kind: "delete-draft" | "discard-changes" | "resize-grid" | "delete-color";
  payload: Record<string, unknown>;
}

export interface MenuUiState {
  fileMenuOpen: boolean;
  mobileSettingsOpen: boolean;
  activePopoverId: string | null;
}

export interface UiPreferenceState {
  darkMode: boolean;
  showGridlines: boolean;
  showMajorGridlines: boolean;
  showRuler: boolean;
  showSymbols: boolean;
  previewMode: boolean;
  threadView: boolean;
  darkCanvas: boolean;
  gridMajorInterval: number;
}

export function createInitialEditorStoreState(): EditorStoreState {
  return {
    document: {
      project: {
        id: null,
        title: "Untitled Pattern",
        createdAt: null,
        updatedAt: null,
        sourceVersion: 1,
      },
      grid: {
        width: 0,
        height: 0,
        meshCount: null,
        sizingMode: "stitches",
        widthInches: null,
        heightInches: null,
        cells: [],
      },
      palette: {
        colorsById: {},
        customPalettesById: {},
        extractedPaletteIds: [],
        symbolAssignments: {},
      },
      trace: null,
      text: {
        mode: "destructive-grid",
        entities: [],
      },
      metadata: {
        legacyDraftId: null,
        persistedVersionId: null,
        schemaVersion: 1,
      },
    },
    session: {
      activeTool: {
        tool: "pan",
        brushSize: 1,
        paintBrushSize: 1,
        eraseBrushSize: 1,
        colorId: null,
      },
      eyedropperReturnTool: null,
      viewport: {
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      },
      selection: {
        mode: "none",
        shape: "rect",
        rect: null,
        lassoPoints: [],
        mirrorAxis: null,
        preview: null,
      },
      mirrorInteraction: {
        session: null,
      },
      history: {
        past: [],
        future: [],
        lastAppliedCommandId: null,
        transaction: null,
      },
      persistence: {
        currentDraftId: null,
        dirty: false,
        saving: false,
        loading: false,
        lastSavedAt: null,
        lastLoadedAt: null,
        restoreSource: "none",
        versionPreview: null,
      },
      traceInteraction: {
        uploadStatus: "idle",
        placementMode: "idle",
        repositionOrigin: null,
        replacedTrace: null,
        repositionSnapshot: null,
        runtimeImageRefId: null,
      },
      textInteraction: {
        draftText: "",
        draftColorId: null,
        draftFontFamily: "Arial",
        draftFontSize: 6,
        draftFontStyle: "normal",
        draftFontWeight: 400,
        previewPosition: null,
        placement: null,
      },
      iconInteraction: {
        placement: null,
      },
      inFlightCommand: null,
    },
    ui: {
      shell: {
        sidebarCollapsed: false,
        activeSidebarSection: "document",
        mobileToolbarVisible: true,
        mobileToolbarCollapsed: false,
        isCompact: false,
        isNarrow: false,
      },
      panels: {
        gridOpen: true,
        wipOpen: false,
        traceOpen: false,
        usedColorsOpen: true,
        customPalettesOpen: false,
        imageToPatternOpen: false,
        textOpen: false,
        settingsOpen: false,
      },
      dialogs: {
        confirmDialog: null,
        draftPickerOpen: false,
        versionHistoryOpen: false,
      },
      menus: {
        fileMenuOpen: false,
        mobileSettingsOpen: false,
        activePopoverId: null,
      },
      preferences: {
        darkMode: false,
        showGridlines: true,
        showMajorGridlines: true,
        showRuler: true,
        showSymbols: true,
        previewMode: false,
        threadView: false,
        darkCanvas: false,
        gridMajorInterval: 10,
      },
    },
  };
}
