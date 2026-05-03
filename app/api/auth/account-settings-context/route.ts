import { NextResponse } from "next/server";
import { getAccountSettingsContext } from "@/lib/auth/server";

export async function GET() {
  const context = await getAccountSettingsContext();
  return NextResponse.json({ context });
}
