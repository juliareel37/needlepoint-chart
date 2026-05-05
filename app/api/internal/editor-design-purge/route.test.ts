import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findManyMock,
  transactionMock,
  deleteBlobIfExistsMock,
  permanentlyDeleteEditorDesignMock,
} = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  transactionMock: vi.fn(),
  deleteBlobIfExistsMock: vi.fn(),
  permanentlyDeleteEditorDesignMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    editorDesign: {
      findMany: findManyMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock("@/lib/blob", () => ({
  deleteBlobIfExists: deleteBlobIfExistsMock,
}));

vi.mock("@/lib/editor-v2/server/designDeletion", async () => {
  const actual = await vi.importActual<typeof import("@/lib/editor-v2/server/designDeletion")>(
    "@/lib/editor-v2/server/designDeletion",
  );

  return {
    ...actual,
    permanentlyDeleteEditorDesign: permanentlyDeleteEditorDesignMock,
  };
});

import { POST } from "./route";

describe("editor design purge route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EDITOR_DESIGN_PURGE_SECRET = "secret";
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({}),
    );
  });

  it("purges expired deleted designs", async () => {
    findManyMock.mockResolvedValue([{ id: "design_1" }, { id: "design_2" }]);
    permanentlyDeleteEditorDesignMock
      .mockResolvedValueOnce(["https://blob.example.com/a.webp"])
      .mockResolvedValueOnce(["https://blob.example.com/b.webp"]);

    const response = await POST(
      new Request("http://localhost/api/internal/editor-design-purge", {
        method: "POST",
        headers: { "x-cron-secret": "secret" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalled();
    expect(permanentlyDeleteEditorDesignMock).toHaveBeenCalledTimes(2);
    expect(deleteBlobIfExistsMock).toHaveBeenCalledWith("https://blob.example.com/a.webp");
    expect(deleteBlobIfExistsMock).toHaveBeenCalledWith("https://blob.example.com/b.webp");
    expect(body).toEqual({
      ok: true,
      purgedCount: 2,
      batchSize: 50,
      deletedBlobCount: 2,
    });
  });
});
