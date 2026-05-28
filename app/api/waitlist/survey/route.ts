import { NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/rate-limit/server";
import { isWaitlistRateLimitDisabled } from "@/lib/waitlist/rateLimit";
import {
  parseWaitlistSurveySubmissionWithReason,
  submitWaitlistSurveyResponse,
} from "@/lib/waitlist/server";

const WAITLIST_SURVEY_HOURLY_IP_LIMIT = 10;
const WAITLIST_SURVEY_DAILY_IP_LIMIT = 30;

export async function POST(req: Request) {
  const ip = getClientIpFromRequest(req);
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = parseWaitlistSurveySubmissionWithReason(body);

  if (!isWaitlistRateLimitDisabled()) {
    const [hourlyLimit, dailyLimit] = await Promise.all([
      checkRateLimit({
        namespace: "waitlist-survey:ip:hour",
        identifier: ip,
        limit: WAITLIST_SURVEY_HOURLY_IP_LIMIT,
        windowMs: 1000 * 60 * 60,
      }),
      checkRateLimit({
        namespace: "waitlist-survey:ip:day",
        identifier: ip,
        limit: WAITLIST_SURVEY_DAILY_IP_LIMIT,
        windowMs: 1000 * 60 * 60 * 24,
      }),
    ]);

    if (hourlyLimit.limited || dailyLimit.limited) {
      return NextResponse.json(
        { error: "Too many survey submissions. Please try again later." },
        { status: 429 },
      );
    }
  }

  if (!parsed.submission) {
    return NextResponse.json({ error: "Invalid survey submission" }, { status: 400 });
  }

  try {
    const result = await submitWaitlistSurveyResponse(parsed.submission);

    return NextResponse.json(
      {
        ok: true,
        surveyResponse: {
          id: result.surveyResponse.id,
          waitlistApplicationId: result.surveyResponse.waitlistApplicationId,
          email: result.surveyResponse.email,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Join the waitlist before submitting the survey." },
      { status: 404 },
    );
  }
}
