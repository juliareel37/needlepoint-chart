import { normalizeProjectTitle, parsePersistedEditorV2Design } from "@/lib/editor-v2/persistence/designs";
import { prisma } from "@/lib/db";
import { buildLibraryStitchSnapshot, type LibraryStitchSnapshot } from "./stitchSnapshot";

export const LIBRARY_PAGE_SIZE = 12;
const MAX_LIBRARY_PAGE_SIZE = 24;

export interface LibraryDesignRecord {
  id: string;
  title: string;
  gridWidth: number;
  gridHeight: number;
  createdAt: string;
  updatedAt: string;
  updatedLabel: string;
  colorCount: number | null;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  tracePlacement: LibraryTracePlacement | null;
  stitchSnapshot: LibraryStitchSnapshot | null;
}

export interface LibraryTracePlacement {
  imageWidth: number | null;
  imageHeight: number | null;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

export interface LibraryDesignPage {
  designs: LibraryDesignRecord[];
  totalCount: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export async function loadLibraryDesignPage({
  userId,
  limit = LIBRARY_PAGE_SIZE,
  offset = 0,
}: {
  userId: string;
  limit?: number;
  offset?: number;
}): Promise<LibraryDesignPage> {
  const normalizedLimit = Math.max(1, Math.min(MAX_LIBRARY_PAGE_SIZE, Math.floor(limit)));
  const normalizedOffset = Math.max(0, Math.floor(offset));

  const [totalCount, designs] = await Promise.all([
    prisma.editorDesign.count({
      where: { userId },
    }),
    prisma.editorDesign.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      skip: normalizedOffset,
      take: normalizedLimit + 1,
      select: {
        id: true,
        title: true,
        gridWidth: true,
        gridHeight: true,
        createdAt: true,
        updatedAt: true,
        data: true,
      },
    }),
  ]);

  const hasMore = designs.length > normalizedLimit;
  const visibleDesigns = hasMore ? designs.slice(0, normalizedLimit) : designs;

  return {
    designs: visibleDesigns.map((design) => {
      const parsed = parsePersistedEditorV2Design(design.data);

      return {
        id: design.id,
        title: parsed
          ? normalizeProjectTitle(parsed.project.title)
          : normalizeProjectTitle(design.title),
        gridWidth: design.gridWidth,
        gridHeight: design.gridHeight,
        createdAt: design.createdAt.toISOString(),
        updatedAt: design.updatedAt.toISOString(),
        updatedLabel: formatUpdatedLabel(design.updatedAt),
        colorCount: parsed ? countUsedColors(parsed.grid.cells) : null,
        previewUrl: parsed?.trace?.previewUrl ?? null,
        thumbnailUrl: parsed?.trace?.thumbnailUrl ?? null,
        tracePlacement: parsed?.trace
          ? {
              imageWidth: parsed.trace.imageWidth,
              imageHeight: parsed.trace.imageHeight,
              offsetX: parsed.trace.offsetX,
              offsetY: parsed.trace.offsetY,
              scale: parsed.trace.scale,
              rotation: parsed.trace.rotation,
            }
          : null,
        stitchSnapshot: parsed
          ? buildLibraryStitchSnapshot({
              gridWidth: parsed.grid.width,
              gridHeight: parsed.grid.height,
              cells: parsed.grid.cells,
              colorsById: parsed.palette.colorsById,
            })
          : null,
      };
    }),
    totalCount,
    hasMore,
    nextOffset: hasMore ? normalizedOffset + visibleDesigns.length : null,
  };
}

function countUsedColors(cells: Array<string | null>) {
  return new Set(cells.filter((cellId): cellId is string => Boolean(cellId))).size;
}

function formatUpdatedLabel(updatedAt: Date) {
  const elapsedMs = Date.now() - updatedAt.getTime();
  const elapsedHours = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60)));

  if (elapsedHours < 1) {
    return "Edited just now";
  }

  if (elapsedHours < 24) {
    return `Edited ${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays === 1) {
    return "Edited yesterday";
  }

  if (elapsedDays < 7) {
    return `Edited ${elapsedDays} days ago`;
  }

  const elapsedWeeks = Math.floor(elapsedDays / 7);
  if (elapsedWeeks === 1) {
    return "Edited last week";
  }

  if (elapsedWeeks < 5) {
    return `Edited ${elapsedWeeks} weeks ago`;
  }

  return `Edited ${updatedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: updatedAt.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  })}`;
}
