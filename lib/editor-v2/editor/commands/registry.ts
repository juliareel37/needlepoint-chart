import type { EditorCommandHandler } from "./handlers/types";
import { gridClearCommandHandler } from "./handlers/gridClear";
import { gridEraseCommandHandler } from "./handlers/gridErase";
import { gridPaintCommandHandler } from "./handlers/gridPaint";
import {
  applyMirrorCommandHandler,
  cancelMirrorCommandHandler,
  commitMirrorCommandHandler,
  doneMirrorCommandHandler,
  resetMirrorCommandHandler,
  startMirrorCommandHandler,
  updateMirrorCommandHandler,
} from "./handlers/mirror";
import { openPanelCommandHandler } from "./handlers/openPanel";
import { paletteSwapColorCommandHandler } from "./handlers/paletteSwapColor";
import { setGridlinesVisibleCommandHandler } from "./handlers/setGridlinesVisible";
import { setPreviewModeCommandHandler } from "./handlers/setPreviewMode";
import { setRulerVisibleCommandHandler } from "./handlers/setRulerVisible";
import { setSymbolsVisibleCommandHandler } from "./handlers/setSymbolsVisible";
import {
  setActiveSidebarSectionCommandHandler,
  setSidebarCollapsedCommandHandler,
} from "./handlers/sidebarShell";
import {
  clearSelectionCommandHandler,
  commitSelectionCommandHandler,
  setSelectionShapeCommandHandler,
  startSelectionCommandHandler,
  updateSelectionCommandHandler,
} from "./handlers/selection";
import { setActiveToolCommandHandler } from "./handlers/setActiveTool";
import { setProjectTitleCommandHandler } from "./handlers/setProjectTitle";
import {
  attachTraceCommandHandler,
  beginTraceRepositionCommandHandler,
  cancelTraceRepositionCommandHandler,
  commitTraceRepositionCommandHandler,
  previewTraceRepositionCommandHandler,
  removeTraceCommandHandler,
  updateTraceCommandHandler,
} from "./handlers/trace";
import {
  beginTextPlacementCommandHandler,
  cancelTextPlacementCommandHandler,
  previewTextPlacementCommandHandler,
  updateTextPlacementCommandHandler,
} from "./handlers/textPlacement";
import {
  panViewportCommandHandler,
  setViewportZoomCommandHandler,
} from "./handlers/viewport";

export const commandHandlers: EditorCommandHandler[] = [
  gridPaintCommandHandler,
  gridEraseCommandHandler,
  gridClearCommandHandler,
  setProjectTitleCommandHandler,
  startSelectionCommandHandler,
  updateSelectionCommandHandler,
  commitSelectionCommandHandler,
  clearSelectionCommandHandler,
  setSelectionShapeCommandHandler,
  startMirrorCommandHandler,
  updateMirrorCommandHandler,
  commitMirrorCommandHandler,
  applyMirrorCommandHandler,
  resetMirrorCommandHandler,
  cancelMirrorCommandHandler,
  doneMirrorCommandHandler,
  paletteSwapColorCommandHandler,
  beginTextPlacementCommandHandler,
  updateTextPlacementCommandHandler,
  previewTextPlacementCommandHandler,
  cancelTextPlacementCommandHandler,
  attachTraceCommandHandler,
  updateTraceCommandHandler,
  beginTraceRepositionCommandHandler,
  previewTraceRepositionCommandHandler,
  cancelTraceRepositionCommandHandler,
  commitTraceRepositionCommandHandler,
  removeTraceCommandHandler,
  setViewportZoomCommandHandler,
  panViewportCommandHandler,
  setActiveToolCommandHandler,
  setSidebarCollapsedCommandHandler,
  setActiveSidebarSectionCommandHandler,
  setGridlinesVisibleCommandHandler,
  setRulerVisibleCommandHandler,
  setSymbolsVisibleCommandHandler,
  setPreviewModeCommandHandler,
  openPanelCommandHandler,
];
