import { NextRequest } from "next/server";

function isPrivateHostname(hostname: string) {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".local")) return true;
  if (lower.startsWith("127.")) return true;
  if (lower === "0.0.0.0") return true;
  if (lower === "::1") return true;
  if (lower.includes(":")) return true; // block IPv6 literals
  const parts = lower.split(".").map((part) => Number(part));
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return new Response("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new Response("Unsupported protocol", { status: 400 });
  }

  if (isPrivateHostname(target.hostname)) {
    return new Response("Blocked host", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), { redirect: "follow" });
  } catch {
    return new Response("Fetch failed", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response(`Upstream error: ${upstream.status}`, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return new Response("Unsupported content type", { status: 415 });
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=300, s-maxage=86400",
    },
  });
}
