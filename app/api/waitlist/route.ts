import { NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit/server";
import { validateEmailMxRecords } from "@/lib/waitlist/emailDns";
import {
  parseWaitlistSubmission,
  submitWaitlistApplication,
} from "@/lib/waitlist/server";

const WAITLIST_HOURLY_IP_LIMIT = 5;
const WAITLIST_DAILY_IP_LIMIT = 20;

export async function POST(req: Request) {
  const ip = getClientIpFromRequest(req);
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
    return NextResponse.json(
      { error: "Too many waitlist submissions. Please try again later." },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => null)) as unknown;
  const submission = parseWaitlistSubmission(body);

  if (!submission) {
    return NextResponse.json({ error: "Invalid waitlist submission" }, { status: 400 });
  }

  const hasValidMailDomain = await validateEmailMxRecords(submission.email);
  if (!hasValidMailDomain) {
    return NextResponse.json(
      { error: "Please use an email address with a valid mail domain." },
      { status: 400 },
    );
  }

  const result = await submitWaitlistApplication(submission);

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
