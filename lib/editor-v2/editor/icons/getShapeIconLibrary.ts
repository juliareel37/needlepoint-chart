import { promises as fs } from "fs";
import path from "path";
import type {
  ShapeIconLibraryItem,
  ShapeIconLibraryOverviewGroup,
} from "@/components/editor-v2/features/workspace/shell/panel-pages/iconLibrary";
import iconSearchKeywords from "@/components/editor-v2/features/workspace/shell/panel-pages/iconSearchKeywords.json";
import {
  extractIconColorSlotsFromSvg,
} from "./iconColorSlots";
import { extractIconColorSlotsFromRaster } from "./iconRasterColorSlots.server";
import { getPrimitiveDefaultColorSlots, getPrimitiveIconKind } from "./primitiveIcon";

const SHAPES_ROOT = path.join(process.cwd(), "public", "icons", "shapes");
const SUPPORTED_EXTENSIONS = new Set([".svg", ".png"]);
const iconSearchKeywordMap = iconSearchKeywords as Record<string, string[]>;
const SHAPES_CATEGORY = "Shapes";
const SHAPES_PRIORITY_BY_NAME: Record<string, number> = {
  Square: 0,
  Rectangle: 0,
  Circle: 1,
  Triangle: 2,
};

type ShapeIconLibraryDescriptor = {
  absolutePath: string;
  extension: string;
  normalizedRelativePath: string;
  id: string;
  name: string;
  category: string;
  searchKeywords: string[];
};

export async function getShapeIconLibrary(): Promise<ShapeIconLibraryItem[]> {
  const descriptors = await getSortedShapeIconDescriptors();
  return Promise.all(descriptors.map((descriptor) => buildShapeIconLibraryItem(descriptor)));
}

export async function getShapeIconLibraryOverview(
  previewLimit: number,
): Promise<ShapeIconLibraryOverviewGroup[]> {
  const descriptors = await getSortedShapeIconDescriptors();
  const descriptorsByCategory = groupDescriptorsByCategory(descriptors);
  const groups = await Promise.all(
    Array.from(descriptorsByCategory.entries()).map(async ([category, categoryDescriptors]) => ({
      category,
      count: categoryDescriptors.length,
      previewItems: await Promise.all(
        categoryDescriptors
          .slice(0, Math.max(previewLimit, 0))
          .map((descriptor) => buildShapeIconLibraryItem(descriptor)),
      ),
    })),
  );

  return groups.sort((left, right) => compareCategories(left.category, right.category));
}

export async function getShapeIconLibraryByCategory(
  category: string,
): Promise<ShapeIconLibraryItem[]> {
  const descriptors = await getSortedShapeIconDescriptors();
  const matchingDescriptors = descriptors.filter((descriptor) => descriptor.category === category);
  return Promise.all(matchingDescriptors.map((descriptor) => buildShapeIconLibraryItem(descriptor)));
}

async function getSortedShapeIconDescriptors(): Promise<ShapeIconLibraryDescriptor[]> {
  const files = await collectIconFiles(SHAPES_ROOT);
  return files
    .map((absolutePath) => buildShapeIconDescriptor(absolutePath))
    .sort(compareShapeIconDescriptors);
}

function buildShapeIconDescriptor(absolutePath: string): ShapeIconLibraryDescriptor {
  const relativePath = path.relative(SHAPES_ROOT, absolutePath);
  const extension = path.extname(relativePath).toLowerCase();
  const normalizedRelativePath = relativePath.split(path.sep).join("/");
  const fileName = path.basename(relativePath, extension);
  const categoryPath = path.dirname(relativePath);

  return {
    absolutePath,
    extension,
    normalizedRelativePath,
    id: normalizedRelativePath.replace(/\.[^.]+$/i, "").replace(/[\\/]+/g, "-"),
    name: humanizeIconName(fileName),
    category: humanizeCategory(categoryPath),
    searchKeywords: normalizeSearchKeywords(iconSearchKeywordMap[path.basename(relativePath)]),
  };
}

function compareShapeIconDescriptors(
  left: ShapeIconLibraryDescriptor,
  right: ShapeIconLibraryDescriptor,
): number {
  const categorySort = compareCategories(left.category, right.category);
  if (categorySort !== 0) {
    return categorySort;
  }

  if (left.category === SHAPES_CATEGORY && right.category === SHAPES_CATEGORY) {
    const leftPriority = SHAPES_PRIORITY_BY_NAME[left.name] ?? Number.POSITIVE_INFINITY;
    const rightPriority = SHAPES_PRIORITY_BY_NAME[right.name] ?? Number.POSITIVE_INFINITY;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }
  }

  return left.name.localeCompare(right.name);
}

function groupDescriptorsByCategory(
  descriptors: ShapeIconLibraryDescriptor[],
): Map<string, ShapeIconLibraryDescriptor[]> {
  const descriptorsByCategory = new Map<string, ShapeIconLibraryDescriptor[]>();

  for (const descriptor of descriptors) {
    const existing = descriptorsByCategory.get(descriptor.category);
    if (existing) {
      existing.push(descriptor);
      continue;
    }

    descriptorsByCategory.set(descriptor.category, [descriptor]);
  }

  return descriptorsByCategory;
}

async function buildShapeIconLibraryItem(
  descriptor: ShapeIconLibraryDescriptor,
): Promise<ShapeIconLibraryItem> {
  const fileContents = await fs.readFile(descriptor.absolutePath);
  const { src, width, height, colorSlots, primitiveKind, lockAspectRatio, supportsStrokeWidth } =
    await buildIconAsset(
      fileContents,
      descriptor.absolutePath,
      descriptor.extension,
      descriptor.normalizedRelativePath,
    );

  return {
    id: descriptor.id,
    name: descriptor.name,
    category: descriptor.category,
    src,
    intrinsicWidth: width,
    intrinsicHeight: height,
    colorSlots,
    primitiveKind,
    lockAspectRatio,
    supportsStrokeWidth,
    searchKeywords: descriptor.searchKeywords,
  };
}

async function collectIconFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith("."))
      .map(async (entry) => {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          return collectIconFiles(absolutePath);
        }

        return entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
          ? [absolutePath]
          : [];
      }),
  );

  return files.flat();
}

async function buildIconAsset(
  fileContents: Buffer,
  absolutePath: string,
  extension: string,
  normalizedRelativePath: string,
): Promise<{
  src: string;
  width: number;
  height: number;
  colorSlots: ShapeIconLibraryItem["colorSlots"];
  primitiveKind: ShapeIconLibraryItem["primitiveKind"];
  lockAspectRatio: boolean;
  supportsStrokeWidth: boolean;
}> {
  const primitiveKind = getPrimitiveIconKind(normalizedRelativePath);
  const lockAspectRatio = primitiveKind === "star";
  const primitiveColorSlots = primitiveKind
    ? getPrimitiveDefaultColorSlots(primitiveKind)
    : [];
  if (extension === ".svg") {
    const svg = extractSvgMarkup(fileContents, absolutePath);
    const { width, height } = getSvgDimensions(svg);
    return {
      src: buildSvgDataUrl(svg),
      width,
      height,
      colorSlots:
        primitiveColorSlots.length > 0
          ? primitiveColorSlots
          : extractIconColorSlotsFromSvg(svg),
      primitiveKind,
      lockAspectRatio,
      supportsStrokeWidth: primitiveKind
        ? true
        : supportsStrokeWidthControl(normalizedRelativePath, svg),
    };
  }

  if (extension === ".png") {
    const { width, height } = getPngDimensions(fileContents, absolutePath);
    return {
      src: buildBinaryDataUrl(fileContents, "image/png"),
      width,
      height,
      colorSlots: await extractIconColorSlotsFromRaster(fileContents),
      primitiveKind,
      lockAspectRatio,
      supportsStrokeWidth: false,
    };
  }

  throw new Error(`Unsupported icon file extension: ${absolutePath}`);
}

function supportsStrokeWidthControl(relativePath: string, svg: string): boolean {
  if (!relativePath.startsWith("shapes/shapes/")) {
    return false;
  }

  return /\bstroke(?:-width)?=["'][^"']+["']/i.test(svg) || /\bstroke\s*:/i.test(svg);
}

function extractSvgMarkup(fileContents: Buffer, absolutePath: string): string {
  const utf8 = fileContents.toString("utf8");
  const startIndex = utf8.indexOf("<svg");
  const endIndex = utf8.lastIndexOf("</svg>");

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Unable to find SVG markup in ${absolutePath}`);
  }

  return utf8.slice(startIndex, endIndex + "</svg>".length).trim();
}

function buildSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

function buildBinaryDataUrl(fileContents: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${fileContents.toString("base64")}`;
}

function getSvgDimensions(svg: string): { width: number; height: number } {
  const viewBoxMatch = svg.match(/viewBox=["']\s*([^\s"']+)\s+([^\s"']+)\s+([^\s"']+)\s+([^\s"']+)\s*["']/i);
  if (viewBoxMatch) {
    const width = parseFloat(viewBoxMatch[3] ?? "");
    const height = parseFloat(viewBoxMatch[4] ?? "");
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      return { width, height };
    }
  }

  const widthMatch = svg.match(/width=["']([^"']+)["']/i);
  const heightMatch = svg.match(/height=["']([^"']+)["']/i);
  const width = parseSvgLength(widthMatch?.[1]);
  const height = parseSvgLength(heightMatch?.[1]);

  return {
    width: width > 0 ? width : 100,
    height: height > 0 ? height : 100,
  };
}

function getPngDimensions(
  fileContents: Buffer,
  absolutePath: string,
): { width: number; height: number } {
  const pngSignature = "89504e470d0a1a0a";
  if (fileContents.length < 24 || fileContents.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error(`Invalid PNG file: ${absolutePath}`);
  }

  return {
    width: fileContents.readUInt32BE(16),
    height: fileContents.readUInt32BE(20),
  };
}

function parseSvgLength(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = parseFloat(value.replace(/[^\d.\\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function humanizeIconName(fileName: string): string {
  return fileName
    .replace(/^noun-/i, "")
    .replace(/-\d+$/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function humanizeCategory(categoryPath: string): string {
  if (!categoryPath || categoryPath === ".") {
    return "Shapes";
  }

  return categoryPath
    .split(path.sep)
    .filter(Boolean)
    .map((segment) =>
      segment
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (character) => character.toUpperCase()),
    )
    .join(" / ");
}

function compareCategories(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  if (left === "Shapes") {
    return -1;
  }

  if (right === "Shapes") {
    return 1;
  }

  return left.localeCompare(right);
}

function normalizeSearchKeywords(keywords: unknown): string[] {
  if (!Array.isArray(keywords)) {
    return [];
  }

  const seen = new Set<string>();
  const normalizedKeywords: string[] = [];

  for (const keyword of keywords) {
    if (typeof keyword !== "string") {
      continue;
    }

    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword || seen.has(normalizedKeyword)) {
      continue;
    }

    seen.add(normalizedKeyword);
    normalizedKeywords.push(normalizedKeyword);
  }

  return normalizedKeywords;
}
