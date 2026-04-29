import { describe, expect, it } from "vitest";
import { createPaintCellCommand } from "@/components/editor-v2/features/workspace/workspaceCommands";
import { createNewDesignState } from "./createNewDesignState";
import { createEditorStore } from "./createEditorStore";

describe("createEditorStore", () => {
  it("publishes document patches with command events", () => {
    const store = createEditorStore({
      initialState: createNewDesignState(4, 4),
    });
    const events: Array<{ type: string; patchCount: number }> = [];

    const unsubscribe = store.subscribe((_nextState, _prevState, event) => {
      events.push({
        type: event.type,
        patchCount: event.patches?.length ?? 0,
      });
    });

    store.dispatch(createPaintCellCommand("dmc:310", { x: 0, y: 0 }));
    unsubscribe();

    expect(events).toEqual([
      {
        type: "command",
        patchCount: 2,
      },
    ]);
  });
});
