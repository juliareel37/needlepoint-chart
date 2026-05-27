import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

export interface RateLimitRule {
  namespace: string;
  identifier: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

function createRateLimitKey(namespace: string, identifier: string) {
  const salt = process.env.RATE_LIMIT_SALT ?? "wippa-rate-limit";
  const digest = createHash("sha256").update(`${salt}:${identifier}`).digest("hex");
  return `${namespace}:${digest}`;
}

export async function checkRateLimit(
  rule: RateLimitRule,
  now = new Date(),
): Promise<RateLimitResult> {
  const key = createRateLimitKey(rule.namespace, rule.identifier);
  const resetAt = new Date(now.getTime() + rule.windowMs);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({
      where: { key },
      select: {
        count: true,
        resetAt: true,
      },
    });

    if (!existing || existing.resetAt <= now) {
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          resetAt,
        },
        update: {
          count: 1,
          resetAt,
        },
      });

      return {
        limited: false,
        limit: rule.limit,
        remaining: Math.max(rule.limit - 1, 0),
        resetAt,
      };
    }

    if (existing.count >= rule.limit) {
      return {
        limited: true,
        limit: rule.limit,
        remaining: 0,
        resetAt: existing.resetAt,
      };
    }

    const updated = await tx.rateLimitBucket.update({
      where: { key },
      data: {
        count: {
          increment: 1,
        },
      },
      select: {
        count: true,
        resetAt: true,
      },
    });

    return {
      limited: false,
      limit: rule.limit,
      remaining: Math.max(rule.limit - updated.count, 0),
      resetAt: updated.resetAt,
    };
  });
}

export function getClientIpFromRequest(req: Request) {
  const forwardedFor =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip");

  const ip = forwardedFor?.split(",")[0]?.trim();
  return ip && ip.length > 0 ? ip : "unknown";
}
