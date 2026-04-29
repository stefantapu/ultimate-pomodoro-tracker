import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "@shared/stores/uiStore";
import { renderWithProviders } from "../test/testUtils";
import { LockedOverlay } from "./LockedOverlay";

describe("LockedOverlay", () => {
  beforeEach(() => {
    useUIStore.getState().setAuthModalOpen(false);
  });

  it("keeps signed-out panels clickable without rendering a visible sign-in button", () => {
    renderWithProviders(<LockedOverlay />);

    const overlay = screen.getByRole("button", { name: "Sign in" });

    expect(screen.queryByText("SIGN IN")).toBeNull();

    fireEvent.click(overlay);

    expect(useUIStore.getState().isAuthModalOpen).toBe(true);
  });
});
