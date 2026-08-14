import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/backend-client", () => ({ backendRequest: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getSessionToken: vi.fn() }));

import { backendRequest } from "@/server/backend-client";
import { listPublishedEvents } from "@/server/events/events";

describe("public event catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("caches unfiltered pages for sixty seconds", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      pageSize: 48,
    });

    await listPublishedEvents(2);

    expect(backendRequest).toHaveBeenCalledWith(
      "/events/published?page=2&pageSize=48",
      {
        next: { revalidate: 60, tags: ["published-events"] },
      },
    );
  });

  it("does not share filtered searches through the catalog cache", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 48,
    });

    await listPublishedEvents(1, "festival");

    expect(backendRequest).toHaveBeenCalledWith(
      "/search?page=1&pageSize=48&q=festival",
      {},
    );
  });
});
