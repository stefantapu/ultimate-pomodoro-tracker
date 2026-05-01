import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "@shared/stores/uiStore";
import { InfographicsButton } from "./InfographicsButton";
import { LogoutButton } from "./LogoutButton";
import { SettingsButton } from "./SettingsButton";
import { ThemePickerButton } from "./ThemePickerButton";

const { authState, getSupabaseClientMock, playToolbarClickMock, signOutMock } =
  vi.hoisted(() => ({
    authState: {
      loading: false,
      user: null as { id: string } | null,
    },
    getSupabaseClientMock: vi.fn(),
    playToolbarClickMock: vi.fn(),
    signOutMock: vi.fn(),
  }));

vi.mock("@shared/hooks/useToolbarClickSound", () => ({
  useToolbarClickSound: () => playToolbarClickMock,
}));

vi.mock("@app/providers/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("../../utils/supabase", () => ({
  getSupabaseClient: getSupabaseClientMock,
}));

describe("Toolbar icon buttons", () => {
  beforeEach(() => {
    playToolbarClickMock.mockReset();
    signOutMock.mockReset();
    getSupabaseClientMock.mockReset();
    getSupabaseClientMock.mockResolvedValue({
      auth: {
        signOut: signOutMock,
      },
    });
    signOutMock.mockResolvedValue({ error: null });
    authState.loading = false;
    authState.user = null;
    useUIStore.setState({
      isSettingsModalOpen: false,
      isThemePickerModalOpen: false,
      isInfographicsModalOpen: false,
      isAuthModalOpen: false,
      resetTimerTrigger: 0,
    });
  });

  it("keeps settings toolbar legacy class family and click behavior", () => {
    render(<SettingsButton />);

    const button = screen.getByRole("button", { name: "Open settings" });
    const label = within(button).getByText("Open settings");
    const icon = button.querySelector(".toolbar-icon-button__icon");

    expect(button).toHaveClass("toolbar-icon-button");
    expect(button).toHaveClass("toolbar-icon-button--settings");
    expect(label).toHaveClass("toolbar-icon-button__label");
    expect(icon).not.toBeNull();

    button.click();

    expect(playToolbarClickMock).toHaveBeenCalledTimes(1);
    expect(useUIStore.getState().isSettingsModalOpen).toBe(true);
  });

  it("keeps theme picker toolbar legacy class family and click behavior", () => {
    render(<ThemePickerButton />);

    const button = screen.getByRole("button", { name: "Open theme picker" });
    const label = within(button).getByText("Open theme picker");
    const icon = button.querySelector(".toolbar-icon-button__icon");

    expect(button).toHaveClass("toolbar-icon-button");
    expect(button).toHaveClass("toolbar-icon-button--theme");
    expect(label).toHaveClass("toolbar-icon-button__label");
    expect(icon).not.toBeNull();

    button.click();

    expect(playToolbarClickMock).toHaveBeenCalledTimes(1);
    expect(useUIStore.getState().isThemePickerModalOpen).toBe(true);
  });

  it("keeps infographics toolbar legacy class family and click behavior", () => {
    render(<InfographicsButton />);

    const button = screen.getByRole("button", {
      name: "Open history dashboard",
    });
    const label = within(button).getByText("Open history dashboard");
    const icon = button.querySelector(".toolbar-icon-button__icon");

    expect(button).toHaveClass("toolbar-icon-button");
    expect(button).toHaveClass("toolbar-icon-button--history");
    expect(label).toHaveClass("toolbar-icon-button__label");
    expect(icon).not.toBeNull();

    button.click();

    expect(playToolbarClickMock).toHaveBeenCalledTimes(1);
    expect(useUIStore.getState().isInfographicsModalOpen).toBe(true);
  });

  it("opens a confirmation before logging out", async () => {
    authState.user = { id: "user-1" };
    render(<LogoutButton />);

    const toolbarButton = screen.getByRole("button", { name: "Log out" });

    fireEvent.click(toolbarButton);

    const dialog = screen.getByRole("dialog", { name: "Log out?" });
    expect(dialog).toBeInTheDocument();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(useUIStore.getState().resetTimerTrigger).toBe(0);

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Log out?" })).toBeNull();
    expect(playToolbarClickMock).toHaveBeenCalledTimes(2);

    fireEvent.click(toolbarButton);
    const reopenedDialog = screen.getByRole("dialog", { name: "Log out?" });

    fireEvent.click(
      within(reopenedDialog).getByRole("button", { name: "Log out" }),
    );

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
    });
    expect(useUIStore.getState().resetTimerTrigger).toBe(1);
    expect(screen.queryByRole("dialog", { name: "Log out?" })).toBeNull();
    expect(playToolbarClickMock).toHaveBeenCalledTimes(4);
  });
});
