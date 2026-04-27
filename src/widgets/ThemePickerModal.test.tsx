import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { getSkinById } from "@shared/skins/catalog";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import { ThemePickerModal } from "./ThemePickerModal";

describe("ThemePickerModal", () => {
  beforeEach(() => {
    localStorage.clear();
    useSkinStore.setState({
      activeSkinId: "warm",
      activeSkin: getSkinById("warm"),
      setActiveSkinId: useSkinStore.getState().setActiveSkinId,
    });
    useUIStore.setState((state) => ({
      ...state,
      isThemePickerModalOpen: true,
    }));
  });

  it("applies neumorphism and persists the selection", () => {
    render(<ThemePickerModal />);

    fireEvent.click(screen.getByRole("radio", { name: /neumorphism/i }));

    expect(useSkinStore.getState().activeSkinId).toBe("neumorphism");
    expect(localStorage.getItem("pomodoro-active-skin")).toBe("neumorphism");
  });

  it("marks the active theme in the picker", () => {
    render(<ThemePickerModal />);

    expect(
      screen.getByRole("heading", { name: "Theme Picker" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Appearance")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /warm/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: /neumorphism/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });
});
