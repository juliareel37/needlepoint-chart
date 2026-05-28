import { NextResponse } from "next/server";
import { getAdminSessionAccess, setGraphicFeatured } from "@/lib/admin/server";

export async function POST(request: Request) {
  const { isAdmin, email } = await getAdminSessionAccess();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { iconId?: unknown; featured?: unknown }
    | null;
  const iconId = typeof body?.iconId === "string" ? body.iconId.trim() : "";
  const featured = typeof body?.featured === "boolean" ? body.featured : null;

  if (!iconId) {
    return NextResponse.json({ error: "Icon id is required." }, { status: 400 });
  }

  if (featured == null) {
    return NextResponse.json({ error: "Featured flag is required." }, { status: 400 });
  }

  await setGraphicFeatured({
    iconId,
    featured,
    updatedByEmail: email,
  });

  return NextResponse.json({
    ok: true,
    iconId,
    featured,
  });
}
