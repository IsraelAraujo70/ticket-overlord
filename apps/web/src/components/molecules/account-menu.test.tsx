import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/auth-actions", () => ({ logoutAction: vi.fn() }));

import { AccountMenu } from "@/components/molecules/account-menu";
import type { AuthUser, UserRole } from "@/server/auth/auth.types";

const labels: Array<[UserRole, string]> = [
  ["CUSTOMER", "Perfil cliente"],
  ["ORGANIZER", "Perfil organizador"],
  ["ADMIN", "Perfil administrador"],
  ["ORGANIZER_STAFF", "Perfil portaria"],
];

function user(role: UserRole): AuthUser {
  return {
    id: "user-id",
    fullName: "Maria da Silva",
    email: "maria@example.com",
    role,
    organizationId: role === "CUSTOMER" ? null : "organization-id",
  };
}

describe("AccountMenu", () => {
  it.each(labels)("maps %s to its product label", (role, label) => {
    render(<AccountMenu user={user(role)} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("opens the account details and logout action", async () => {
    render(<AccountMenu user={user("CUSTOMER")} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir menu de Maria da Silva" }),
    );

    expect(await screen.findByText("maria@example.com")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sair" })).toHaveClass(
      "hover:text-accent-foreground",
      "hover:**:text-accent-foreground",
    );
  });

  it("keeps the role readable while the inverted trigger is expanded", () => {
    render(<AccountMenu appearance="inverted" user={user("CUSTOMER")} />);

    const trigger = screen.getByRole("button", {
      name: "Abrir menu de Maria da Silva",
    });
    fireEvent.click(trigger);

    expect(within(trigger).getByText("Perfil cliente")).toHaveClass(
      "group-aria-expanded/button:text-muted-foreground",
    );
  });

  it("links customers to their tickets", async () => {
    render(<AccountMenu user={user("CUSTOMER")} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir menu de Maria da Silva" }),
    );

    expect(await screen.findByRole("menuitem", { name: "Meus ingressos" })).toHaveAttribute(
      "href",
      "/meus-ingressos",
    );
  });

  it("links gate staff to the gate operation", async () => {
    render(<AccountMenu user={user("ORGANIZER_STAFF")} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir menu de Maria da Silva" }),
    );

    expect(await screen.findByRole("menuitem", { name: "Portaria" })).toHaveAttribute(
      "href",
      "/admin/portaria",
    );
  });
});
