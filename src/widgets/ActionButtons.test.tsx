import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionButtons } from "./ActionButtons";

describe("ActionButtons", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders controls and preserves legacy class contracts", () => {
    const onPrimaryAction = vi.fn();
    const onReset = vi.fn();

    render(
      <ActionButtons
        status="paused"
        onPrimaryAction={onPrimaryAction}
        onReset={onReset}
      />,
    );

    const startButton = screen.getByRole("button", { name: "Start" });
    const resetButton = screen.getByRole("button", { name: "Reset" });
    const root = startButton.closest("div");

    expect(root).toHaveClass("action-buttons");
    expect(startButton).toHaveClass("themed-button");
    expect(startButton).toHaveClass("themed-button--action");
    expect(startButton).toHaveClass("action-buttons__button--start");
    expect(resetButton).toHaveClass("themed-button");
    expect(resetButton).toHaveClass("themed-button--action");
    expect(resetButton).toHaveClass("action-buttons__button--reset");

    fireEvent.click(startButton);
    fireEvent.click(resetButton);

    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("applies and clears stone-impact class on left pointer down", () => {
    vi.useFakeTimers();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    render(
      <ActionButtons
        status="paused"
        onPrimaryAction={() => {}}
        onReset={() => {}}
      />,
    );

    const startButton = screen.getByRole("button", { name: "Start" });

    fireEvent.pointerDown(startButton, { button: 0 });
    expect(startButton).toHaveClass("is-stone-impacting");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(startButton).not.toHaveClass("is-stone-impacting");
  });
});
