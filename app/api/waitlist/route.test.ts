import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueMock,
  createMock,
  updateMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    waitlistApplication: {
      findUnique: findUniqueMock,
      create: createMock,
      update: updateMock,
    },
  },
}));

import { POST } from "./route";

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid submissions", async () => {
    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          experienceLevel: "",
          currentTools: "",
          freeformResponse: "",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects submissions with a filled honeypot field", async () => {
    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@example.com",
          experienceLevel: "Yes, regularly",
          currentTools: "Illustrator and graph paper",
          freeformResponse: "I want to design original canvases more quickly.",
          website: "https://spam.example",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("creates a new waitlist application", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: "wait_1",
      email: "maker@example.com",
      status: "PENDING",
      createdAt: new Date("2026-05-13T12:00:00.000Z"),
      updatedAt: new Date("2026-05-13T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: " Maker@Example.com ",
          experienceLevel: "Yes, regularly",
          currentTools: "Illustrator and graph paper",
          freeformResponse: "I want to design original canvases more quickly.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "maker@example.com" },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(createMock).toHaveBeenCalledWith({
      data: {
        email: "maker@example.com",
        experienceLevel: "Yes, regularly",
        currentTools: "Illustrator and graph paper",
        freeformResponse: "I want to design original canvases more quickly.",
      },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(body).toEqual({
      ok: true,
      created: true,
      application: {
        id: "wait_1",
        email: "maker@example.com",
        status: "PENDING",
      },
    });
  });

  it("updates an existing waitlist application for repeat submissions", async () => {
    findUniqueMock.mockResolvedValue({
      id: "wait_1",
      email: "maker@example.com",
      status: "PENDING",
      createdAt: new Date("2026-05-13T12:00:00.000Z"),
      updatedAt: new Date("2026-05-13T12:00:00.000Z"),
    });
    updateMock.mockResolvedValue({
      id: "wait_1",
      email: "maker@example.com",
      status: "PENDING",
      createdAt: new Date("2026-05-13T12:00:00.000Z"),
      updatedAt: new Date("2026-05-14T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@example.com",
          experienceLevel: "Sometimes",
          currentTools: "Photoshop",
          freeformResponse: "I want a cleaner pattern design workflow.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "wait_1" },
      data: {
        experienceLevel: "Sometimes",
        currentTools: "Photoshop",
        freeformResponse: "I want a cleaner pattern design workflow.",
      },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(body).toEqual({
      ok: true,
      created: false,
      application: {
        id: "wait_1",
        email: "maker@example.com",
        status: "PENDING",
      },
    });
  });
});
