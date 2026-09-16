import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "@shared/stores/uiStore";
import { renderWithProviders } from "../test/testUtils";
import { LockedOverlay } from "./LockedOverlay";

const { trackProductEventMock } = vi.hoisted(() => ({
  trackProductEventMock: vi.fn(),
}));

vi.mock("@shared/lib/productAnalytics", () => ({
  trackProductEvent: trackProductEventMock,
}));

describe("LockedOverlay", () => {
  beforeEach(() => {
    useUIStore.getState().setAuthModalOpen(false);
    trackProductEventMock.mockReset();
  });

  it("keeps signed-out panels clickable without rendering a visible sign-in button", () => {
    renderWithProviders(<LockedOverlay />);

    const overlay = screen.getByRole("button", { name: "Sign in" });

    expect(screen.queryByText("SIGN IN")).toBeNull();

    fireEvent.click(overlay);

    expect(useUIStore.getState().isAuthModalOpen).toBe(true);
    expect(trackProductEventMock).toHaveBeenCalledTimes(1);
    expect(trackProductEventMock).toHaveBeenCalledWith({
      name: "signup_start",
      source: "locked_feature",
    });
  });
});
