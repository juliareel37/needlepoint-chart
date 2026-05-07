"use client";

import { ColorLibrary } from "@/components/editor-v2/features/colors";
import { ToolbarPopover } from "@/components/design-system";
import { DMC_COLOR_LIBRARY } from "@/lib/editor-v2/editor/color-library";
import shellStyles from "@/components/editor-v2/features/workspace/shell/EditorV2Shell.module.css";

const FEATURED_COLOR_IDS = [
  "dmc-321",
  "dmc-347",
  "dmc-356",
  "dmc-498",
  "dmc-666",
  "dmc-761",
  "dmc-818",
  "dmc-915",
] as const;

export default function FloatingToolbarColorLibraryPreviewPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px",
        background:
          "linear-gradient(180deg, rgba(244, 240, 234, 0.96), rgba(238, 233, 226, 0.96))",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "grid",
          placeItems: "start center",
          minHeight: "calc(100vh - 96px)",
        }}
      >
        <ToolbarPopover
          role="dialog"
          aria-label="Color library preview"
          className={shellStyles.colorLibraryPopover}
          style={{ position: "relative", left: "auto", top: "auto", transform: "none" }}
        >
          <ColorLibrary
            activeColorId="dmc-761"
            className={shellStyles.toolbarColorLibrary}
            colors={DMC_COLOR_LIBRARY}
            featuredColorIds={[...FEATURED_COLOR_IDS]}
            onColorSelect={() => {}}
          />
        </ToolbarPopover>
      </div>
    </main>
  );
}
