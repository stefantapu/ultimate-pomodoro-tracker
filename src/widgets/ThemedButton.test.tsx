import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemedButton } from "./ThemedButton";

describe("ThemedButton", () => {
  it("preserves variant, active, and custom class contracts", () => {
    render(
      <ThemedButton variant="toolbar" active className="custom-button">
        Open
      </ThemedButton>,
    );

    const button = screen.getByRole("button", { name: "Open" });

    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("themed-button");
    expect(button).toHaveClass("themed-button--toolbar");
    expect(button).toHaveClass("is-active");
    expect(button).toHaveClass("custom-button");
  });
});
