import { NextResponse } from "next/server";
import {
  getShapeIconLibrary,
  getShapeIconLibraryByCategory,
  getShapeIconLibraryOverview,
} from "@/lib/editor-v2/editor/icons/getShapeIconLibrary";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") ?? "full";

    if (mode === "overview") {
      const previewLimit = Number(searchParams.get("previewLimit") ?? "6");
      const groups = await getShapeIconLibraryOverview(
        Number.isFinite(previewLimit) && previewLimit > 0 ? Math.floor(previewLimit) : 6,
      );
      return NextResponse.json({ groups });
    }

    if (mode === "category") {
      const category = searchParams.get("category");
      if (!category) {
        return NextResponse.json(
          { error: "Missing category" },
          { status: 400 },
        );
      }

      const icons = await getShapeIconLibraryByCategory(category);
      return NextResponse.json({ icons });
    }

    const icons = await getShapeIconLibrary();
    return NextResponse.json({ icons });
  } catch (error) {
    console.error("Failed to load icon library", error);
    return NextResponse.json(
      { error: "Failed to load icon library" },
      { status: 500 },
    );
  }
}
