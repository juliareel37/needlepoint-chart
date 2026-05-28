import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueMock,
  surveyCreateMock,
  checkRateLimitMock,
  getClientIpFromRequestMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  surveyCreateMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  getClientIpFromRequestMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    waitlistApplication: {
      findUnique: findUniqueMock,
    },
    waitlistSurveyResponse: {
      create: surveyCreateMock,
    },
  },
}));

vi.mock("@/lib/rate-limit/server", () => ({
  checkRateLimit: checkRateLimitMock,
  getClientIpFromRequest: getClientIpFromRequestMock,
}));

import { POST } from "./route";

describe("POST /api/waitlist/survey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.WAITLIST_RATE_LIMIT_DISABLED;
    getClientIpFromRequestMock.mockReturnValue("203.0.113.10");
    checkRateLimitMock.mockResolvedValue({
      limited: false,
      limit: 10,
      remaining: 9,
      resetAt: new Date("2026-05-13T13:00:00.000Z"),
    });
  });

  it("creates a separate survey response for an existing waitlist application", async () => {
    findUniqueMock.mockResolvedValue({ id: "wait_1" });
    surveyCreateMock.mockResolvedValue({
      id: "survey_1",
      waitlistApplicationId: "wait_1",
      email: "maker@example.com",
      createdAt: new Date("2026-05-13T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/waitlist/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: " Maker@Example.com ",
          experienceLevel: "Yes, regularly",
          betaTestingInterest: true,
          currentTools: "Illustrator and graph paper",
          freeformResponse: "I want to design original canvases more quickly.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "maker@example.com" },
      select: { id: true },
    });
    expect(surveyCreateMock).toHaveBeenCalledWith({
      data: {
        waitlistApplicationId: "wait_1",
        email: "maker@example.com",
        experienceLevel: "Yes, regularly",
        betaTestingInterest: true,
        currentTools: "Illustrator and graph paper",
        freeformResponse: "I want to design original canvases more quickly.",
      },
      select: {
        id: true,
        waitlistApplicationId: true,
        email: true,
        createdAt: true,
      },
    });
    expect(body).toEqual({
      ok: true,
      surveyResponse: {
        id: "survey_1",
        waitlistApplicationId: "wait_1",
        email: "maker@example.com",
      },
    });
  });

  it("rejects survey responses without a waitlist application", async () => {
    findUniqueMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/waitlist/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@example.com",
          experienceLevel: "Sometimes",
          betaTestingInterest: false,
          currentTools: "Photoshop",
          freeformResponse: "I want a cleaner pattern design workflow.",
        }),
      }),
    );

    expect(response.status).toBe(404);
    expect(surveyCreateMock).not.toHaveBeenCalled();
  });

  it("allows optional free-form survey fields to be blank", async () => {
    findUniqueMock.mockResolvedValue({ id: "wait_1" });
    surveyCreateMock.mockResolvedValue({
      id: "survey_1",
      waitlistApplicationId: "wait_1",
      email: "maker@example.com",
      createdAt: new Date("2026-05-13T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/waitlist/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@example.com",
          experienceLevel: "Sometimes",
          betaTestingInterest: false,
          currentTools: "",
          freeformResponse: "",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(surveyCreateMock).toHaveBeenCalledWith({
      data: {
        waitlistApplicationId: "wait_1",
        email: "maker@example.com",
        experienceLevel: "Sometimes",
        betaTestingInterest: false,
        currentTools: "",
        freeformResponse: "",
      },
      select: {
        id: true,
        waitlistApplicationId: true,
        email: true,
        createdAt: true,
      },
    });
  });

  it("skips IP rate limits when WAITLIST_RATE_LIMIT_DISABLED is true", async () => {
    process.env.WAITLIST_RATE_LIMIT_DISABLED = "true";
    findUniqueMock.mockResolvedValue({ id: "wait_1" });
    surveyCreateMock.mockResolvedValue({
      id: "survey_1",
      waitlistApplicationId: "wait_1",
      email: "maker@example.com",
      createdAt: new Date("2026-05-13T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/waitlist/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@example.com",
          experienceLevel: "Sometimes",
          betaTestingInterest: false,
          currentTools: "Photoshop",
          freeformResponse: "I want a cleaner pattern design workflow.",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(checkRateLimitMock).not.toHaveBeenCalled();
  });
});
