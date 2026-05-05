import { LibraryPageClient } from "@/app/library/LibraryPageClient";
import type { LibraryDesignRecord } from "@/lib/library/designs";
import type { LibraryViewMode } from "@/app/dev/library-thumbnail-preview/viewMode";

const GRID_WIDTH = 104;
const GRID_HEIGHT = 208;

function createTallSnapshotCells() {
  const cells = Array<string | null>(GRID_WIDTH * GRID_HEIGHT).fill(null);
  const stroke = "#a34b4b";
  const fill = "#f0d270";

  for (let y = 24; y < 184; y += 1) {
    for (let x = 30; x < 74; x += 1) {
      const isBorder = x < 36 || x >= 68 || y < 36 || y >= 172;

      if (isBorder) {
        cells[y * GRID_WIDTH + x] = stroke;
        continue;
      }

      if ((x + y) % 2 === 0) {
        cells[y * GRID_WIDTH + x] = fill;
      }
    }
  }

  return cells;
}

const TEST_DESIGN: LibraryDesignRecord = {
  id: "grid-preview-test",
  state: "active",
  title: "Tall Preview Test",
  gridWidth: GRID_WIDTH,
  gridHeight: GRID_HEIGHT,
  createdAt: "2026-04-30T12:00:00.000Z",
  updatedAt: "2026-04-30T12:00:00.000Z",
  updatedLabel: "Edited just now",
  deletedAt: null,
  purgeAfterAt: null,
  colorCount: 2,
  previewUrl: null,
  thumbnailUrl: null,
  tracePlacement: null,
  stitchSnapshot: {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    cells: createTallSnapshotCells(),
  },
};

export default async function LibraryThumbnailPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const mode =
    resolvedSearchParams?.mode === "list" ? ("list" as LibraryViewMode) : "grid";

  return (
    <main style={{ minHeight: "100vh", padding: "32px", background: "#f4f0ea" }}>
      <LibraryPageClient
        initialDesigns={[TEST_DESIGN]}
        initialTotalCount={1}
        initialHasMore={false}
        initialNextOffset={null}
        deferInitialLoad={false}
        initialViewMode="active"
        initialLayoutMode={mode}
      />
    </main>
  );
}
