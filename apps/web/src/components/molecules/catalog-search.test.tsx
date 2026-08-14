import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CatalogSearch,
  suggestionHref,
} from "@/components/molecules/catalog-search";

describe("CatalogSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("debounces suggestions and supports keyboard selection", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            kind: "EVENT",
            label: "Festival de Jazz",
            value: "Festival de Jazz",
            slug: "festival-jazz",
          },
        ]),
        { status: 200 },
      ),
    );
    render(<CatalogSearch />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "fes" },
    });
    expect(fetch).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(400));

    expect(fetch).toHaveBeenCalledWith(
      "/api/search/suggestions?q=fes",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
    expect(screen.getByRole("option")).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not request suggestions with fewer than two characters", async () => {
    render(<CatalogSearch />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "a" },
    });
    await act(async () => vi.advanceTimersByTime(300));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("offers the submitted search when the API has no suggestions", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    render(<CatalogSearch />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "quero commid" },
    });
    await act(async () => vi.advanceTimersByTime(400));

    expect(
      screen.getByRole("option", { name: /Buscar por “quero commid”/ }),
    ).toHaveAttribute("href", "/search?q=quero%20commid");
  });

  it("maps event and facet suggestions to public destinations", () => {
    expect(
      suggestionHref({
        kind: "EVENT",
        label: "Festival",
        value: "Festival",
        slug: "festival-jazz",
      }),
    ).toBe("/eventos/festival-jazz");
    expect(
      suggestionHref({
        kind: "CITY",
        label: "São Paulo",
        value: "São Paulo",
        slug: null,
      }),
    ).toBe("/search?q=S%C3%A3o%20Paulo");
  });
});
