import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminTemplate } from "./admin-template";

vi.mock("@/components/organisms/admin-header", () => ({
  AdminHeader: () => <header>Admin header</header>,
}));

vi.mock("@/components/organisms/app-sidebar", () => ({
  AppSidebar: () => <aside>Admin sidebar</aside>,
}));

describe("AdminTemplate", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      })),
    );
  });

  it("lets wide reports scroll inside their own container", () => {
    const { container } = render(
      <AdminTemplate
        user={{
          id: "admin-1",
          fullName: "Admin",
          email: "admin@ticketoverlord.local",
          role: "ADMIN",
          organizationId: null,
        }}
      >
        <section>Wide report</section>
      </AdminTemplate>,
    );

    expect(container.querySelector('[data-slot="sidebar-inset"]')).toHaveClass(
      "min-w-0",
    );
    expect(screen.getByText("Wide report").parentElement).not.toHaveClass(
      "overflow-auto",
    );
  });
});
