import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrganizerBanner } from "@/components/organisms/organizer-banner";

describe("OrganizerBanner", () => {
  it("uses the orange producer surface as the organizer entry", () => {
    render(<OrganizerBanner />);

    expect(screen.getByRole("link", { name: "Postar eventos" })).toHaveAttribute(
      "href",
      "/admin/login",
    );
  });
});
