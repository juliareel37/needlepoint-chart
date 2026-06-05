"use client";

import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";

export default function AppAnalytics() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return <Analytics />;
}
