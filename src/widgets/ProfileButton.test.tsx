import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "@shared/stores/uiStore";
import { renderWithProviders } from "../test/testUtils";
import { ProfileButton } from "./ProfileButton";

const { trackProductEventMock } = vi.hoisted(() => ({
  trackProductEventMock: vi.fn(),
}));

vi.mock("@shared/lib/productAnalytics", () => ({
  trackProductEvent: trackProductEventMock,
}));

vi.mock("@shared/hooks/useProfile", () => ({
  useProfile: () => ({ profile: null }),
}));

vi.mock("@shared/hooks/useToolbarClickSound", () => ({
  useToolbarClickSound: () => vi.fn(),
}));

describe("ProfileButton", () => {
  beforeEach(() => {
    trackProductEventMock.mockReset();
    useUIStore.setState((state) => ({
      ...state,
      isAuthModalOpen: false,
      isInfographicsModalOpen: false,
    }));
  });

  it("tracks signup intent when a guest opens auth", () => {
    renderWithProviders(<ProfileButton user={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Log in or register" }));

    expect(useUIStore.getState().isAuthModalOpen).toBe(true);
    expect(trackProductEventMock).toHaveBeenCalledTimes(1);
    expect(trackProductEventMock).toHaveBeenCalledWith({
      name: "signup_start",
      source: "profile_control",
    });
  });

  it("does not track an authenticated profile open", () => {
    renderWithProviders(
      <ProfileButton user={{ id: "user-1" } as never} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open hero profile" }));

    expect(useUIStore.getState().isInfographicsModalOpen).toBe(true);
    expect(trackProductEventMock).not.toHaveBeenCalled();
  });
});
