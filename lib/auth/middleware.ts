import { NextResponse } from "next/server";

export function authMiddleware() {
  return NextResponse.next();
}
