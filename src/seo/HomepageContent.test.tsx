import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomepageContent } from "./HomepageContent";

describe("HomepageContent", () => {
  it("renders the confirmed homepage content and footer landmarks", () => {
    render(<HomepageContent />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Forge Timer: A Gamified Pomodoro Timer for Visible Progress",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What is Forge Timer?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frequently asked questions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "LinkedIn — Stefan Tapu" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/stefan-tapu/",
    );
    expect(
      screen.getByText("Forge Timer is an independent project built by Stefan Tapu."),
    ).toBeInTheDocument();
  });

  it("changes and persists only the content section color mode", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );

    const { container } = render(<HomepageContent />);
    const section = container.firstElementChild;

    await waitFor(() => expect(section).toHaveAttribute("data-color-mode", "light"));

    fireEvent.click(screen.getByRole("button", { name: "Switch content to dark mode" }));

    expect(section).toHaveAttribute("data-color-mode", "dark");
    expect(localStorage.getItem("forge-content-color-mode")).toBe("dark");
    expect(document.body.dataset.dashboardSkin).toBeUndefined();
  });
});
