import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrganizerRegistrationCard } from "@/components/organisms/organizer-registration-card";

describe("OrganizerRegistrationCard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fills address fields through the application CEP endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
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
      ),
    );
    render(<OrganizerRegistrationCard />);

    expect(screen.getByRole("meter", { name: "Força da senha" })).toBeInTheDocument();
    const postalCode = screen.getByLabelText("CEP");
    fireEvent.change(postalCode, { target: { value: "01001-000" } });
    fireEvent.blur(postalCode);

    await waitFor(() =>
      expect(screen.getByText("Endereço preenchido pelo CEP.")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Logradouro")).toHaveValue("Praça da Sé");
    expect(screen.getByLabelText("Bairro")).toHaveValue("Sé");
    expect(screen.getByLabelText("Cidade")).toHaveValue("São Paulo");
    expect(screen.getByRole("combobox", { name: "UF" })).toHaveTextContent(
      "SP - São Paulo",
    );
  });

  it("shows every Brazilian federative unit in the UF selector", async () => {
    render(<OrganizerRegistrationCard />);

    fireEvent.click(screen.getByRole("combobox", { name: "UF" }));

    expect(await screen.findAllByRole("option")).toHaveLength(27);
    expect(screen.getByRole("option", { name: "DF - Distrito Federal" })).toBeVisible();
  });

  it("shows CNPJ errors inline on blur", () => {
    render(<OrganizerRegistrationCard />);

    const cnpj = screen.getByLabelText("CNPJ");
    fireEvent.change(cnpj, { target: { value: "11.222.333/0001-82" } });
    fireEvent.blur(cnpj);

    expect(screen.getByText("Informe um CNPJ válido.")).toBeInTheDocument();
    expect(cnpj).toHaveAttribute("aria-invalid", "true");
  });
});
