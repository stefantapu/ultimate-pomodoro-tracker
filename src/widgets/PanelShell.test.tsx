import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelShell } from "./PanelShell";

describe("PanelShell", () => {
  it("renders title/body and preserves legacy class contracts", () => {
    render(
      <PanelShell
        title="Panel title"
        className="custom-panel"
        bodyClassName="custom-panel-body"
      >
        <span>Body content</span>
      </PanelShell>,
    );

    const content = screen.getByText("Body content");
    const section = content.closest("section");
    const title = screen.getByText("Panel title");
    const body = content.parentElement;

    expect(section).not.toBeNull();
    expect(section).toHaveClass("panel-shell");
    expect(section).toHaveClass("custom-panel");
    expect(title).toHaveClass("panel-shell__title");
    expect(body).not.toBeNull();
    expect(body).toHaveClass("panel-shell__body");
    expect(body).toHaveClass("custom-panel-body");
  });
});
