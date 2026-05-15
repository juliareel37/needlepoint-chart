import { NextResponse } from "next/server";
import {
  parseWaitlistSubmission,
  submitWaitlistApplication,
} from "@/lib/waitlist/server";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  const submission = parseWaitlistSubmission(body);

  if (!submission) {
    return NextResponse.json({ error: "Invalid waitlist submission" }, { status: 400 });
  }

  const result = await submitWaitlistApplication(submission);

  return NextResponse.json(
    {
      ok: true,
      created: result.created,
      application: {
        id: result.application.id,
        email: result.application.email,
        status: result.application.status,
      },
    },
    { status: result.created ? 201 : 200 },
  );
}
