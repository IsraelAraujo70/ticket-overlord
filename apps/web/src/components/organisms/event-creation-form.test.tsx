import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventCreationForm } from "@/components/organisms/event-creation-form";
import type { ExternalMovie } from "@/features/events/event.types";

const mocks = vi.hoisted(() => ({
  compress: vi.fn(),
  createEvent: vi.fn(),
  replace: vi.fn(),
  searchMovies: vi.fn(),
}));

vi.mock("browser-image-compression", () => ({ default: mocks.compress }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/server/events/event-actions", () => ({
  createEventAction: mocks.createEvent,
  searchExternalMoviesAction: mocks.searchMovies,
}));

const draftStorageKey = "ticket-overlord:event-creation-draft:v1";

describe("EventCreationForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    mocks.createEvent.mockResolvedValue({ status: "success" });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:event-cover"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("shows compact movie choices and advances only after a selection", async () => {
    mocks.searchMovies.mockResolvedValue({ movies: [movie] });
    render(<EventCreationForm />);

    fireEvent.change(screen.getByLabelText("Título do filme"), {
      target: { value: "Mario" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar no TMDb" }));

    expect(await screen.findByText("Super Mario Bros.")).toBeInTheDocument();
    const movieCard = screen
      .getByText("Super Mario Bros.")
      .closest('[data-slot="card"]');
    expect(movieCard).toHaveClass("min-h-40");

    fireEvent.click(screen.getByRole("button", { name: "Selecionar filme" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      screen.getByRole("heading", { name: "Defina a sessão" }),
    ).toBeInTheDocument();
  });

  it("restores the text draft but returns a review reload to the cover step", async () => {
    saveDraft({ step: 4 });
    render(<EventCreationForm />);

    expect(
      await screen.findByRole("heading", { name: "Escolha a capa" }),
    ).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Cine Belas Artes")).not.toBeInTheDocument();
    expect(screen.getByText("Etapa 3 de 4")).toBeInTheDocument();
  });

  it("compresses the cover before sending it and clears the local draft on success", async () => {
    saveDraft({ step: 3 });
    const compressed = new File(
      [new Uint8Array(512 * 1024)],
      "compressed.webp",
      { type: "image/webp" },
    );
    mocks.compress.mockResolvedValue(compressed);
    render(<EventCreationForm />);

    const coverInput = await screen.findByLabelText("Arquivo");
    const original = new File(
      [new Uint8Array(2 * 1024 * 1024)],
      "large-cover.png",
      { type: "image/png" },
    );
    fireEvent.change(coverInput, { target: { files: [original] } });

    expect(
      await screen.findByText("Pronta para envio: 512 KiB · WebP"),
    ).toBeInTheDocument();
    expect(mocks.compress).toHaveBeenCalledWith(
      original,
      expect.objectContaining({
        fileType: "image/webp",
        maxSizeMB: 0.75,
        maxWidthOrHeight: 1920,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Revisar evento" }));
    fireEvent.click(screen.getByRole("button", { name: "Criar rascunho" }));

    await waitFor(() => expect(mocks.createEvent).toHaveBeenCalled());
    const submitted = mocks.createEvent.mock.calls[0]?.[1] as FormData;
    const submittedCover = submitted.get("cover");
    expect(submittedCover).toBeInstanceOf(File);
    expect((submittedCover as File).type).toBe("image/webp");
    expect((submittedCover as File).name).toBe("large-cover.webp");
    await waitFor(() => {
      expect(window.localStorage.getItem(draftStorageKey)).toBeNull();
      expect(mocks.replace).toHaveBeenCalledWith("/admin/eventos?created=1");
    });
  });
});

function saveDraft({ step }: { step: number }) {
  window.localStorage.setItem(
    draftStorageKey,
    JSON.stringify({
      step,
      query: "Mario",
      selected: movie,
      startsAtLocal: "2099-09-05T19:00",
      venue: "Cine Belas Artes",
      city: "São Paulo",
      capacity: "150",
      price: "45.50",
    }),
  );
}

const movie: ExternalMovie = {
  externalId: "539972",
  title: "Super Mario Bros.",
  summary: "Mario atravessa o Reino dos Cogumelos em uma nova aventura.",
  releaseDate: "2023-04-05",
  imageUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
};
