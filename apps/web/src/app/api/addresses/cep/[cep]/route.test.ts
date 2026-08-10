import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/addresses/cep/[cep]/route";

describe("GET /api/addresses/cep/:cep", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the stable API response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          postalCode: "01001000",
          street: "Praça da Sé",
          neighborhood: "Sé",
          city: "São Paulo",
          state: "SP",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new Request("http://localhost/api/addresses/cep/01001000"), {
      params: Promise.resolve({ cep: "01001000" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ city: "São Paulo" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/addresses/cep/01001000",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});
