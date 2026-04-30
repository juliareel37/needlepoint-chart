import { LibraryPageClient } from "@/app/library/LibraryPageClient";
import type { LibraryDesignRecord } from "@/lib/library/designs";

const GRID_WIDTH = 104;
const GRID_HEIGHT = 208;

function createTallSnapshotCells() {
  const cells = Array<string | null>(GRID_WIDTH * GRID_HEIGHT).fill(null);
  const stroke = "#a34b4b";
  const fill = "#f0d270";

  for (let x = 24; x < 80; x += 1) {
    cells[x] = stroke;
    cells[(GRID_HEIGHT - 1) * GRID_WIDTH + x] = stroke;
  }

  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    cells[y * GRID_WIDTH + 24] = stroke;
    cells[y * GRID_WIDTH + 79] = stroke;
  }

  for (let y = 72; y < 136; y += 1) {
    for (let x = 36; x < 68; x += 1) {
      if ((x + y) % 3 === 0) {
        cells[y * GRID_WIDTH + x] = fill;
      }
    }
  }

  return cells;
}

const TEST_DESIGN: LibraryDesignRecord = {
  id: "grid-preview-test",
  title: "Tall Preview Test",
  gridWidth: GRID_WIDTH,
  gridHeight: GRID_HEIGHT,
  createdAt: "2026-04-30T12:00:00.000Z",
  updatedAt: "2026-04-30T12:00:00.000Z",
  updatedLabel: "Edited just now",
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

export default function LibraryThumbnailPreviewPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "32px", background: "#f4f0ea" }}>
      <LibraryPageClient
        initialDesigns={[TEST_DESIGN]}
        initialTotalCount={1}
        initialHasMore={false}
        initialNextOffset={null}
        deferInitialLoad={false}
      />
    </main>
  );
}
