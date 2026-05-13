import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentUserIdMock,
  findFirstMock,
  updateMock,
} = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn(),
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    editorDesign: {
      findFirst: findFirstMock,
      update: updateMock,
    },
  },
}));

import { POST } from "./route";

describe("restore deleted design route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restores a deleted design in place", async () => {
    getCurrentUserIdMock.mockResolvedValue("user_1");
    findFirstMock.mockResolvedValue({
      id: "design_123",
      title: "Deleted Design",
      gridWidth: 8,
      gridHeight: 8,
      createdAt: new Date("2026-04-01T12:00:00.000Z"),
      updatedAt: new Date("2026-05-01T12:00:00.000Z"),
      deletedAt: new Date("2026-05-01T12:00:00.000Z"),
      purgeAfterAt: new Date("2026-05-31T12:00:00.000Z"),
    });
    updateMock.mockResolvedValue({
      id: "design_123",
      title: "Deleted Design",
      gridWidth: 8,
      gridHeight: 8,
      createdAt: new Date("2026-04-01T12:00:00.000Z"),
      updatedAt: new Date("2026-05-02T12:00:00.000Z"),
    });

    const response = await POST(new Request("http://localhost"), {
      params: { id: "design_123" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "design_123" },
      data: {
        deletedAt: null,
        purgeAfterAt: null,
      },
    });
    expect(body).toMatchObject({
      ok: true,
      id: "design_123",
      versionToken: "2026-05-02T12:00:00.000Z",
    });
  });
});
