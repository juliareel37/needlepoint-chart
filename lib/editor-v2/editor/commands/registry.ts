import type { EditorCommandHandler } from "./handlers/types";
import { gridApplyTraceConversionCommandHandler } from "./handlers/gridApplyTraceConversion";
import { gridClearCommandHandler } from "./handlers/gridClear";
import { gridEraseCommandHandler } from "./handlers/gridErase";
import { gridPaintCommandHandler } from "./handlers/gridPaint";
import { applyProjectServerStateCommandHandler } from "./handlers/applyProjectServerState";
import {
  applyMirrorCommandHandler,
  beginMirrorFromSelectionCommandHandler,
  cancelMirrorCommandHandler,
  commitMirrorCommandHandler,
  doneMirrorCommandHandler,
  resetMirrorCommandHandler,
  startMirrorCommandHandler,
  updateMirrorCommandHandler,
} from "./handlers/mirror";
import { openPanelCommandHandler } from "./handlers/openPanel";
import { paletteDeleteUsedColorsCommandHandler } from "./handlers/paletteDeleteUsedColors";
import { paletteMergeUsedColorsCommandHandler } from "./handlers/paletteMergeUsedColors";
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
  beginCutPlacementCommandHandler,
  beginDuplicatePlacementCommandHandler,
  cancelDuplicatePlacementCommandHandler,
  commitDuplicatePlacementCommandHandler,
  clearSelectionCommandHandler,
  commitSelectionCommandHandler,
  moveSelectionCommandHandler,
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
  beginIconPlacementCommandHandler,
  cancelIconPlacementCommandHandler,
  previewIconPlacementCommandHandler,
  updateIconPlacementCommandHandler,
} from "./handlers/iconPlacement";
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
  applyProjectServerStateCommandHandler,
  gridPaintCommandHandler,
  gridEraseCommandHandler,
  gridClearCommandHandler,
  gridApplyTraceConversionCommandHandler,
  setProjectTitleCommandHandler,
  startSelectionCommandHandler,
  updateSelectionCommandHandler,
  commitSelectionCommandHandler,
  moveSelectionCommandHandler,
  beginDuplicatePlacementCommandHandler,
  beginCutPlacementCommandHandler,
  cancelDuplicatePlacementCommandHandler,
  commitDuplicatePlacementCommandHandler,
  clearSelectionCommandHandler,
  setSelectionShapeCommandHandler,
  beginMirrorFromSelectionCommandHandler,
  startMirrorCommandHandler,
  updateMirrorCommandHandler,
  commitMirrorCommandHandler,
  applyMirrorCommandHandler,
  resetMirrorCommandHandler,
  cancelMirrorCommandHandler,
  doneMirrorCommandHandler,
  paletteSwapColorCommandHandler,
  paletteDeleteUsedColorsCommandHandler,
  paletteMergeUsedColorsCommandHandler,
  beginIconPlacementCommandHandler,
  updateIconPlacementCommandHandler,
  previewIconPlacementCommandHandler,
  cancelIconPlacementCommandHandler,
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
