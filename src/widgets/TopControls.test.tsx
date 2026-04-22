import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TopControls } from "./TopControls";

describe("TopControls", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders focus/break controls and preserves legacy class contracts", () => {
    const onSelectMode = vi.fn();

    render(<TopControls mode="focus" onSelectMode={onSelectMode} />);

    const root = screen.getByRole("button", { name: "Focus" }).closest("div");
    const focusButton = screen.getByRole("button", { name: "Focus" });
    const breakButton = screen.getByRole("button", { name: "Break" });

    expect(root).toHaveClass("top-controls");
    expect(focusButton).toHaveClass("themed-button");
    expect(focusButton).toHaveClass("themed-button--tab");
    expect(focusButton).toHaveClass("is-active");
    expect(breakButton).toHaveClass("themed-button");
    expect(breakButton).toHaveClass("themed-button--tab");

    fireEvent.click(breakButton);
    expect(onSelectMode).toHaveBeenCalledWith("break");
  });

  it("applies and clears stone-impact class on left pointer down", () => {
    vi.useFakeTimers();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    render(<TopControls mode="focus" onSelectMode={() => {}} />);

    const focusButton = screen.getByRole("button", { name: "Focus" });

    fireEvent.pointerDown(focusButton, { button: 0 });
    expect(focusButton).toHaveClass("is-stone-impacting");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(focusButton).not.toHaveClass("is-stone-impacting");
  });
});
