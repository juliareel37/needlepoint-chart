import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentUserIdMock,
  findFirstMock,
  createMock,
  checkRateLimitMock,
  getClientIpFromRequestMock,
} = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn(),
  findFirstMock: vi.fn(),
  createMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  getClientIpFromRequestMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    editorDesign: {
      findFirst: findFirstMock,
    },
    editorBugReport: {
      create: createMock,
    },
  },
}));

vi.mock("@/lib/rate-limit/server", () => ({
  checkRateLimit: checkRateLimitMock,
  getClientIpFromRequest: getClientIpFromRequestMock,
}));

import { POST } from "./route";

describe("POST /api/editor-v2/bug-reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.EDITOR_BUG_REPORT_RATE_LIMIT_DISABLED;
    getClientIpFromRequestMock.mockReturnValue("203.0.113.50");
    getCurrentUserIdMock.mockResolvedValue("user_1");
    checkRateLimitMock.mockResolvedValue({
      limited: false,
      limit: 12,
      remaining: 11,
      resetAt: new Date("2026-06-02T18:00:00.000Z"),
    });
    findFirstMock.mockResolvedValue({ id: "design_1" });
    createMock.mockResolvedValue({
      id: "bug_1",
      appUserId: "user_1",
      editorDesignId: "design_1",
      source: "editor_v2",
      formId: "quick-bug-report",
      formVersion: "2026-06-02",
      createdAt: new Date("2026-06-02T17:00:00.000Z"),
    });
  });

  it("creates a bug report for a signed-in editor user", async () => {
    const response = await POST(
      new Request("http://localhost/api/editor-v2/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: "quick-bug-report",
          formVersion: "2026-06-02",
          editorDesignId: "design_1",
          answers: {
            fields: [
              {
                id: "summary",
                value: "Undo leaves the brush inactive until I switch tools.",
              },
            ],
          },
          context: {
            activeTool: "paint",
          },
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        id: "design_1",
        appUserId: "user_1",
      },
      select: {
        id: true,
      },
    });
    expect(createMock).toHaveBeenCalledWith({
      data: {
        appUserId: "user_1",
        editorDesignId: "design_1",
        source: "editor_v2",
        formId: "quick-bug-report",
        formVersion: "2026-06-02",
        answers: {
          fields: [
            {
              id: "summary",
              value: "Undo leaves the brush inactive until I switch tools.",
            },
          ],
        },
        context: {
          activeTool: "paint",
        },
        clientMetadata: expect.anything(),
      },
      select: {
        id: true,
        appUserId: true,
        editorDesignId: true,
        source: true,
        formId: true,
        formVersion: true,
        createdAt: true,
      },
    });
    expect(body).toEqual({
      ok: true,
      report: {
        id: "bug_1",
        createdAt: "2026-06-02T17:00:00.000Z",
        editorDesignId: "design_1",
      },
    });
  });

  it("allows anonymous reports without a linked design", async () => {
    getCurrentUserIdMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: "bug_anon_1",
      appUserId: null,
      editorDesignId: null,
      source: "editor_v2",
      formId: "quick-bug-report",
      formVersion: null,
      createdAt: new Date("2026-06-02T17:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/editor-v2/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: "quick-bug-report",
          answers: [
            {
              id: "summary",
              value: "The trace panel spinner never stops.",
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(findFirstMock).not.toHaveBeenCalled();
    expect(createMock).toHaveBeenCalledWith({
      data: {
        appUserId: null,
        editorDesignId: null,
        source: "editor_v2",
        formId: "quick-bug-report",
        formVersion: null,
        answers: [
          {
            id: "summary",
            value: "The trace panel spinner never stops.",
          },
        ],
        context: expect.anything(),
        clientMetadata: expect.anything(),
      },
      select: {
        id: true,
        appUserId: true,
        editorDesignId: true,
        source: true,
        formId: true,
        formVersion: true,
        createdAt: true,
      },
    });
  });

  it("rejects malformed submissions", async () => {
    const response = await POST(
      new Request("http://localhost/api/editor-v2/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: "",
          answers: "broken",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects linked design ids that do not belong to the current user", async () => {
    findFirstMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/editor-v2/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: "quick-bug-report",
          editorDesignId: "design_other",
          answers: {
            fields: [],
          },
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Invalid editor design context for this bug report.",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rate limits repeated submissions from the same IP", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      limited: true,
      limit: 12,
      remaining: 0,
      resetAt: new Date("2026-06-02T18:00:00.000Z"),
    });
    checkRateLimitMock.mockResolvedValueOnce({
      limited: false,
      limit: 40,
      remaining: 39,
      resetAt: new Date("2026-06-03T17:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/editor-v2/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: "quick-bug-report",
          answers: {
            fields: [],
          },
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({
      error: "Too many bug reports. Please try again later.",
    });
    expect(createMock).not.toHaveBeenCalled();
  });
});
