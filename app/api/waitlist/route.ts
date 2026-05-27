import { NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit/server";
import { validateEmailMxRecords } from "@/lib/waitlist/emailDns";
import {
  parseWaitlistSubmissionWithReason,
  recordWaitlistSubmissionAttempt,
  submitWaitlistApplication,
} from "@/lib/waitlist/server";

const WAITLIST_HOURLY_IP_LIMIT = 5;
const WAITLIST_DAILY_IP_LIMIT = 20;

export async function POST(req: Request) {
  const ip = getClientIpFromRequest(req);
  const userAgent = req.headers.get("user-agent");
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = parseWaitlistSubmissionWithReason(body);
  const [hourlyLimit, dailyLimit] = await Promise.all([
    checkRateLimit({
      namespace: "waitlist:ip:hour",
      identifier: ip,
      limit: WAITLIST_HOURLY_IP_LIMIT,
      windowMs: 1000 * 60 * 60,
    }),
    checkRateLimit({
      namespace: "waitlist:ip:day",
      identifier: ip,
      limit: WAITLIST_DAILY_IP_LIMIT,
      windowMs: 1000 * 60 * 60 * 24,
    }),
  ]);

  if (hourlyLimit.limited || dailyLimit.limited) {
    await recordWaitlistSubmissionAttempt({
      snapshot: parsed.snapshot,
      status: "REJECTED",
      rejectionReason: hourlyLimit.limited
        ? "RATE_LIMITED_HOURLY_IP"
        : "RATE_LIMITED_DAILY_IP",
      ip,
      userAgent,
    });

    return NextResponse.json(
      { error: "Too many waitlist submissions. Please try again later." },
      { status: 429 },
    );
  }

  if (!parsed.submission) {
    await recordWaitlistSubmissionAttempt({
      snapshot: parsed.snapshot,
      status: "REJECTED",
      rejectionReason: parsed.rejectionReason,
      ip,
      userAgent,
    });

    return NextResponse.json({ error: "Invalid waitlist submission" }, { status: 400 });
  }

  const hasValidMailDomain = await validateEmailMxRecords(parsed.submission.email);
  if (!hasValidMailDomain) {
    await recordWaitlistSubmissionAttempt({
      snapshot: parsed.snapshot,
      status: "REJECTED",
      rejectionReason: "INVALID_EMAIL_MX",
      ip,
      userAgent,
    });

    return NextResponse.json(
      { error: "Please use an email address with a valid mail domain." },
      { status: 400 },
    );
  }

  const result = await submitWaitlistApplication(parsed.submission);
  await recordWaitlistSubmissionAttempt({
    snapshot: parsed.snapshot,
    status: result.alreadySubmitted ? "DUPLICATE" : "APPROVED",
    rejectionReason: result.alreadySubmitted ? "DUPLICATE_EMAIL" : null,
    ip,
    userAgent,
    waitlistApplicationId: result.application.id,
  });

  return NextResponse.json(
    {
      ok: true,
      created: result.created,
      alreadySubmitted: result.alreadySubmitted,
      application: {
        id: result.application.id,
        email: result.application.email,
        status: result.application.status,
      },
    },
    { status: result.created ? 201 : 200 },
  );
}
