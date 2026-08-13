import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getSessionToken: vi.fn() }));
vi.mock("@/server/backend-client", () => ({
  BackendRequestError: class BackendRequestError extends Error {
    code = "BACKEND_ERROR";
  },
  backendRequest: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { getSessionToken } from "@/server/auth/session";
import { backendRequest } from "@/server/backend-client";
import { initialEventActionState } from "@/features/events/event.types";
import {
  createEventAction,
  publishEventAction,
  searchExternalMoviesAction,
} from "@/server/events/event-actions";

describe("event actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionToken).mockResolvedValue("session-token");
  });

  it("rejects a short catalog query without calling the backend", async () => {
    await expect(searchExternalMoviesAction("a")).resolves.toEqual({
      movies: [],
      error: "Digite pelo menos dois caracteres.",
    });
    expect(backendRequest).not.toHaveBeenCalled();
  });

  it("searches the external catalog with the organizer session", async () => {
    vi.mocked(backendRequest).mockResolvedValue([
      {
        externalId: "157336",
        title: "Interestelar",
        summary: "Uma jornada para além das estrelas.",
        releaseDate: "2014-11-05",
        imageUrl: null,
      },
    ]);

    const result = await searchExternalMoviesAction(" Interestelar ");

    expect(result.movies[0]?.externalId).toBe("157336");
    expect(backendRequest).toHaveBeenCalledWith(
      "/external-catalog/movies?query=Interestelar",
      { headers: { Authorization: "Bearer session-token" } },
    );
  });

  it("validates the cover before creating an event", async () => {
    const formData = eventForm();
    formData.delete("cover");

    await expect(
      createEventAction(initialEventActionState, formData),
    ).resolves.toEqual({
      status: "error",
      message: "Envie uma imagem de capa.",
    });
    expect(backendRequest).not.toHaveBeenCalled();
  });

  it("converts the local form into the multipart API contract", async () => {
    vi.mocked(backendRequest).mockResolvedValue({});
    const formData = eventForm();

    await expect(
      createEventAction(initialEventActionState, formData),
    ).resolves.toEqual({ status: "success" });

    const request = vi.mocked(backendRequest).mock.calls[0]?.[1];
    expect(request).toMatchObject({
      method: "POST",
      headers: { Authorization: "Bearer session-token" },
    });
    expect(request?.body).toBeInstanceOf(FormData);
    const body = request?.body as FormData;
    expect(body.get("category")).toBe("Cinema");
    expect(body.get("externalId")).toBe("157336");
    expect(body.get("capacity")).toBe("150");
    expect(body.get("priceInCents")).toBe("4550");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/eventos");
  });

  it("creates a manual event without an external id", async () => {
    vi.mocked(backendRequest).mockResolvedValue({});
    const formData = eventForm();
    formData.set("category", "Teatro");
    formData.set("title", "Hamlet");
    formData.set(
      "summary",
      "Uma montagem contemporânea do clássico de Shakespeare.",
    );
    formData.delete("externalId");

    await expect(
      createEventAction(initialEventActionState, formData),
    ).resolves.toEqual({ status: "success" });

    const body = vi.mocked(backendRequest).mock.calls[0]?.[1]?.body as FormData;
    expect(body.get("category")).toBe("Teatro");
    expect(body.get("title")).toBe("Hamlet");
    expect(body.get("externalId")).toBeNull();
  });

  it("publishes an organizer event and refreshes public catalogs", async () => {
    vi.mocked(backendRequest).mockResolvedValue({});
    const formData = new FormData();
    formData.set("eventId", "11111111-1111-4111-8111-111111111111");

    await expect(
      publishEventAction(initialEventActionState, formData),
    ).resolves.toEqual({ status: "success" });

    expect(backendRequest).toHaveBeenCalledWith(
      "/events/11111111-1111-4111-8111-111111111111/publish",
      {
        method: "POST",
        headers: { Authorization: "Bearer session-token" },
      },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/eventos");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/search");
  });
});

function eventForm(): FormData {
  const formData = new FormData();
  formData.set("category", "Cinema");
  formData.set("externalId", "157336");
  formData.set("startsAt", "2099-09-05T22:00:00.000Z");
  formData.set("venue", "Cine Belas Artes");
  formData.set("city", "São Paulo");
  formData.set("capacity", "150");
  formData.set("price", "45,50");
  formData.set(
    "cover",
    new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "cover.png", {
      type: "image/png",
    }),
  );
  return formData;
}
