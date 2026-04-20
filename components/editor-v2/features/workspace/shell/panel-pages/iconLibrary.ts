import type { IconColorSlot } from "@/lib/editor-v2/editor/icons/iconColorSlots";

export interface ShapeIconLibraryItem {
  id: string;
  name: string;
  category: string;
  src: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  colorSlots: IconColorSlot[];
  searchKeywords: string[];
}
