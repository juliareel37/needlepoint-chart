import type { EditorCommandHandler } from "./handlers/types";
import { gridClearCommandHandler } from "./handlers/gridClear";
import { gridEraseCommandHandler } from "./handlers/gridErase";
import { gridPaintCommandHandler } from "./handlers/gridPaint";
import { openPanelCommandHandler } from "./handlers/openPanel";
import { setGridlinesVisibleCommandHandler } from "./handlers/setGridlinesVisible";
import { setRulerVisibleCommandHandler } from "./handlers/setRulerVisible";
import {
  setActiveSidebarSectionCommandHandler,
  setSidebarCollapsedCommandHandler,
} from "./handlers/sidebarShell";
import {
  clearSelectionCommandHandler,
  commitSelectionCommandHandler,
  startSelectionCommandHandler,
  updateSelectionCommandHandler,
} from "./handlers/selection";
import { setActiveToolCommandHandler } from "./handlers/setActiveTool";
import { setProjectTitleCommandHandler } from "./handlers/setProjectTitle";
import {
  attachTraceCommandHandler,
  removeTraceCommandHandler,
  updateTraceCommandHandler,
} from "./handlers/trace";
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
  attachTraceCommandHandler,
  updateTraceCommandHandler,
  removeTraceCommandHandler,
  setViewportZoomCommandHandler,
  panViewportCommandHandler,
  setActiveToolCommandHandler,
  setSidebarCollapsedCommandHandler,
  setActiveSidebarSectionCommandHandler,
  setGridlinesVisibleCommandHandler,
  setRulerVisibleCommandHandler,
  openPanelCommandHandler,
];
