import { NextResponse } from "next/server";
import {
  getAuthSession,
  updateCurrentUserThemePreference,
} from "@/lib/auth/server";
import { parseThemeMode } from "@/lib/theme/themePreference";

export async function GET() {
  const session = await getAuthSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ themeMode: session.themePreference });
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as { themeMode?: unknown } | null;
  const themeMode =
    typeof body?.themeMode === "string" ? parseThemeMode(body.themeMode) : null;

  if (!themeMode) {
    return NextResponse.json({ error: "Invalid theme mode" }, { status: 400 });
  }

  const updatedThemeMode = await updateCurrentUserThemePreference(themeMode);

  if (updatedThemeMode === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ themeMode: updatedThemeMode });
}
