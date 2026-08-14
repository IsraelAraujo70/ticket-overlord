import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { backendRequest } from "@/server/backend-client";

describe("backendRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps API calls private by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await backendRequest("/health");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/health",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("preserves an explicit Next.js cache policy", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await backendRequest("/events/published", {
      next: { revalidate: 60, tags: ["published-events"] },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/events/published",
      expect.objectContaining({
        cache: undefined,
        next: { revalidate: 60, tags: ["published-events"] },
      }),
    );
  });
});
