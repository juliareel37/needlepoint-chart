import { describe, expect, it } from "vitest";
import { createNewDesignState } from "./createNewDesignState";
import { createEditorStateFromDocument } from "./createEditorStateFromDocument";

describe("createEditorStateFromDocument", () => {
  it("restores a saved active color when it exists in the palette", () => {
    const source = createNewDesignState(4, 4);
    const restored = createEditorStateFromDocument(source.document, {
      activeColorId: "dmc-321",
    });

    expect(restored.session.activeTool.colorId).toBe("dmc-321");
  });

  it("falls back to the document palette when the saved active color is unavailable", () => {
    const source = createNewDesignState(4, 4);
    source.document.palette.extractedPaletteIds = ["dmc-666"];
    const restored = createEditorStateFromDocument(source.document, {
      activeColorId: "missing-color",
    });

    expect(restored.session.activeTool.colorId).toBe("dmc-666");
  });
});
