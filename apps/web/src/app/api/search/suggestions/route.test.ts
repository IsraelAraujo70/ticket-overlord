import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/search/suggestions/route";
import { getSearchSuggestions } from "@/server/search/search";

vi.mock("@/server/search/search", () => ({ getSearchSuggestions: vi.fn() }));

describe("GET /api/search/suggestions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not call the API before two characters", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/search/suggestions?q=a"),
    );

    expect(await response.json()).toEqual([]);
    expect(getSearchSuggestions).not.toHaveBeenCalled();
  });

  it("returns bounded catalog suggestions", async () => {
    vi.mocked(getSearchSuggestions).mockResolvedValue([
      { kind: "CITY", label: "São Paulo", value: "São Paulo", slug: null },
    ]);

    const response = await GET(
      new NextRequest("http://localhost/api/search/suggestions?q=sao"),
    );

    expect(getSearchSuggestions).toHaveBeenCalledWith("sao");
    expect(await response.json()).toEqual([
      { kind: "CITY", label: "São Paulo", value: "São Paulo", slug: null },
    ]);
  });
});
