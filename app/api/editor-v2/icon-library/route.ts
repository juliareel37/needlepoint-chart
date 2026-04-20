import { NextResponse } from "next/server";
import { getShapeIconLibrary } from "@/lib/editor-v2/editor/icons/getShapeIconLibrary";

export async function GET() {
  try {
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
