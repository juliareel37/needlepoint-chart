import { NextResponse } from "next/server";
import {
  buildUploadedShapeIconLibraryItem,
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file upload" },
        { status: 400 },
      );
    }

    const fileName = file.name?.trim() || "uploaded-graphic";
    const extension = fileName.includes(".")
      ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
      : "";

    if (![".svg", ".png", ".jpg", ".jpeg", ".webp"].includes(extension)) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload SVG, PNG, JPG, JPEG, or WEBP." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const item = await buildUploadedShapeIconLibraryItem({
      fileContents: Buffer.from(arrayBuffer),
      fileName,
    });

    return NextResponse.json({
      item: {
        id: item.id,
        name: item.name,
        src: item.src,
        mimeType: item.mimeType,
        intrinsicWidth: item.intrinsicWidth,
        intrinsicHeight: item.intrinsicHeight,
        colorSlots: item.colorSlots,
        primitiveKind: item.primitiveKind,
        isUserUploaded: item.isUserUploaded,
        lockAspectRatio: item.lockAspectRatio,
        supportsStrokeWidth: item.supportsStrokeWidth,
      },
    });
  } catch (error) {
    console.error("Failed to analyze uploaded graphic", error);
    return NextResponse.json(
      { error: "Failed to process uploaded graphic" },
      { status: 500 },
    );
  }
}
