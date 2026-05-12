import type { IconColorSlot } from "@/lib/editor-v2/editor/icons/iconColorSlots";
import type { PrimitiveIconKind } from "@/lib/editor-v2/editor/icons/primitiveIcon";

export interface ShapeIconLibraryItem {
  id: string;
  name: string;
  category: string;
  src: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  colorSlots: IconColorSlot[];
  primitiveKind: PrimitiveIconKind | null;
  lockAspectRatio: boolean;
  supportsStrokeWidth: boolean;
  searchKeywords: string[];
}

export interface ShapeIconLibraryOverviewGroup {
  category: string;
  count: number;
  previewItems: ShapeIconLibraryItem[];
}

export interface UploadedShapeIconLibraryItem
  extends Omit<ShapeIconLibraryItem, "category" | "searchKeywords"> {}
