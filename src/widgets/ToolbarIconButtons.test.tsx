import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "@shared/stores/uiStore";
import { InfographicsButton } from "./InfographicsButton";
import { SettingsButton } from "./SettingsButton";
import { ThemePickerButton } from "./ThemePickerButton";

const playToolbarClickMock = vi.fn();

vi.mock("@shared/hooks/useToolbarClickSound", () => ({
  useToolbarClickSound: () => playToolbarClickMock,
}));

describe("Toolbar icon buttons", () => {
  beforeEach(() => {
    playToolbarClickMock.mockReset();
    useUIStore.setState({
      isSettingsModalOpen: false,
      isThemePickerModalOpen: false,
      isInfographicsModalOpen: false,
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
});
