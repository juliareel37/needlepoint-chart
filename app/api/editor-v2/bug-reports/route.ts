import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/server";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit/server";
import {
  isEditorBugReportRateLimitDisabled,
  parseEditorBugReportSubmission,
  submitEditorBugReport,
} from "@/lib/editor-v2/server/bugReports";

export const runtime = "nodejs";

const BUG_REPORT_HOURLY_IP_LIMIT = 12;
const BUG_REPORT_DAILY_IP_LIMIT = 40;
const EDITOR_BUG_REPORT_SOURCE = "editor_v2";

export async function POST(req: Request) {
  const ip = getClientIpFromRequest(req);
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = parseEditorBugReportSubmission(body, {
    defaultSource: EDITOR_BUG_REPORT_SOURCE,
  });

  if (!isEditorBugReportRateLimitDisabled()) {
    const [hourlyLimit, dailyLimit] = await Promise.all([
      checkRateLimit({
        namespace: "editor-bug-report:ip:hour",
        identifier: ip,
        limit: BUG_REPORT_HOURLY_IP_LIMIT,
        windowMs: 1000 * 60 * 60,
      }),
      checkRateLimit({
        namespace: "editor-bug-report:ip:day",
        identifier: ip,
        limit: BUG_REPORT_DAILY_IP_LIMIT,
        windowMs: 1000 * 60 * 60 * 24,
      }),
    ]);

    if (hourlyLimit.limited || dailyLimit.limited) {
      return NextResponse.json(
        { error: "Too many bug reports. Please try again later." },
        { status: 429 },
      );
    }
  }

  if (!parsed.submission) {
    return NextResponse.json({ error: "Invalid bug report submission" }, { status: 400 });
  }

  const appUserId = await getCurrentUserId();

  try {
    const result = await submitEditorBugReport({
      submission: parsed.submission,
      appUserId,
    });

    return NextResponse.json(
      {
        ok: true,
        report: {
          id: result.report.id,
          createdAt: result.report.createdAt.toISOString(),
          editorDesignId: result.report.editorDesignId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "EDITOR_DESIGN_AUTH_REQUIRED" ||
        error.message === "EDITOR_DESIGN_NOT_FOUND")
    ) {
      return NextResponse.json(
        { error: "Invalid editor design context for this bug report." },
        { status: 400 },
      );
    }

    throw error;
  }
}
