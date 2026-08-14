import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/organisms/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const usePathname = vi.fn();

vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

describe("AppSidebar", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/admin/ingressos");
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      })),
    );
  });

  it.each([
    ["Visão geral", "/admin"],
    ["Eventos", "/admin/eventos"],
    ["Ingressos", "/admin/ingressos"],
    ["Portaria", "/admin/portaria"],
  ])("links %s to %s", (title, href) => {
    render(
      <SidebarProvider>
        <AppSidebar role="ORGANIZER" />
      </SidebarProvider>,
    );

    expect(screen.getByRole("link", { name: title })).toHaveAttribute("href", href);
  });

  it("marks the current section as active", () => {
    render(
      <SidebarProvider>
        <AppSidebar role="ORGANIZER" />
      </SidebarProvider>,
    );

    expect(screen.getByRole("link", { name: "Ingressos" })).toHaveAttribute(
      "data-active",
    );
  });

  it("shows only the gate operation to staff", () => {
    render(
      <SidebarProvider>
        <AppSidebar role="ORGANIZER_STAFF" />
      </SidebarProvider>,
    );

    expect(screen.getByRole("link", { name: "Portaria" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Eventos" })).not.toBeInTheDocument();
  });

  it("does not offer the organization gate to global admins", () => {
    render(
      <SidebarProvider>
        <AppSidebar role="ADMIN" />
      </SidebarProvider>,
    );

    expect(screen.queryByRole("link", { name: "Portaria" })).not.toBeInTheDocument();
  });

  it("does not expose the unused orders section", () => {
    render(
      <SidebarProvider>
        <AppSidebar role="ORGANIZER" />
      </SidebarProvider>,
    );

    expect(screen.queryByRole("link", { name: "Pedidos" })).not.toBeInTheDocument();
  });
});
