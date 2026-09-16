import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomepageContent } from "./HomepageContent";

const { trackProductEventMock } = vi.hoisted(() => ({
  trackProductEventMock: vi.fn(),
}));

vi.mock("../shared/lib/productAnalytics", () => ({
  trackProductEvent: trackProductEventMock,
}));

describe("HomepageContent", () => {
  beforeEach(() => {
    trackProductEventMock.mockReset();
  });

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

  it("tracks the CTA and focuses the timer action without activating it", () => {
    const timerAction = document.createElement("button");
    const activateTimer = vi.fn();
    const scrollIntoView = vi.fn();
    timerAction.id = "forge-timer-primary-action";
    timerAction.addEventListener("click", activateTimer);
    timerAction.scrollIntoView = scrollIntoView;
    document.body.append(timerAction);
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)" ? false : false,
      })),
    );

    render(<HomepageContent />);
    fireEvent.click(screen.getByRole("link", { name: "Start focusing" }));

    expect(trackProductEventMock).toHaveBeenCalledTimes(1);
    expect(trackProductEventMock).toHaveBeenCalledWith({
      name: "seo_cta_click",
      source: "homepage_cta",
    });
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(timerAction).toHaveFocus();
    expect(activateTimer).not.toHaveBeenCalled();

    timerAction.remove();
  });

  it("avoids smooth scrolling when reduced motion is preferred", () => {
    const timerAction = document.createElement("button");
    const scrollIntoView = vi.fn();
    timerAction.id = "forge-timer-primary-action";
    timerAction.scrollIntoView = scrollIntoView;
    document.body.append(timerAction);
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
      })),
    );

    render(<HomepageContent />);
    fireEvent.click(screen.getByRole("link", { name: "Start focusing" }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "center",
    });

    timerAction.remove();
  });
});
