import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSkinById } from "@shared/skins/catalog";
import { useSkinStore } from "@shared/stores/skinStore";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/testUtils";
import { HeatmapCard } from "./HeatmapCard";

let lastActivityCalendarProps: Record<string, unknown> | null = null;

vi.mock("react-activity-calendar", () => ({
  ActivityCalendar: (props: Record<string, unknown>) => {
    lastActivityCalendarProps = props;
    return <div data-testid="activity-calendar" />;
  },
}));

describe("HeatmapCard", () => {
  beforeEach(() => {
    lastActivityCalendarProps = null;
    useSkinStore.setState({
      activeSkinId: "warm",
      activeSkin: getSkinById("warm"),
      setActiveSkinId: useSkinStore.getState().setActiveSkinId,
    });
  });

  it("uses warm palette with dark tooltip scheme on the warm skin", () => {
    renderWithProviders(
      <HeatmapCard
        loading={false}
        heatmapData={[{ date: "2026-04-24", value: 3600 }]}
      />,
    );

    expect(lastActivityCalendarProps).not.toBeNull();
    expect(lastActivityCalendarProps?.colorScheme).toBe("dark");
    expect(lastActivityCalendarProps?.theme).toEqual({
      light: ["#3b1509", "#7a2f12", "#b64614", "#e66f1a", "#ffb85a"],
      dark: ["#3b1509", "#7a2f12", "#b64614", "#e66f1a", "#ffb85a"],
    });
  });

  it("uses neumorphism palette with light tooltip scheme on the neumorphism skin", () => {
    useSkinStore.getState().setActiveSkinId("neumorphism");

    renderWithProviders(
      <HeatmapCard
        loading={false}
        heatmapData={[{ date: "2026-04-24", value: 3600 }]}
      />,
    );

    expect(lastActivityCalendarProps).not.toBeNull();
    expect(lastActivityCalendarProps?.colorScheme).toBe("light");
    expect(lastActivityCalendarProps?.theme).toEqual({
      light: ["#d8dee6", "#c1cad4", "#a8b3bf", "#8f9cac", "#6f7d8d"],
      dark: ["#d8dee6", "#c1cad4", "#a8b3bf", "#8f9cac", "#6f7d8d"],
    });
  });

  it("uses viking palette with dark tooltip scheme and renders preview label", () => {
    useSkinStore.getState().setActiveSkinId("viking");

    renderWithProviders(
      <HeatmapCard
        loading={false}
        previewLabel="Preview data"
        heatmapData={[{ date: "2026-04-24", value: 3600 }]}
      />,
    );

    expect(lastActivityCalendarProps).not.toBeNull();
    expect(lastActivityCalendarProps?.colorScheme).toBe("dark");
    expect(lastActivityCalendarProps?.theme).toEqual({
      light: ["#201f21", "#434449", "#6f7d8d", "#a0aebe", "#e8f0f7"],
      dark: ["#201f21", "#434449", "#6f7d8d", "#a0aebe", "#e8f0f7"],
    });
    expect(screen.getByText("Preview data")).toBeInTheDocument();
  });
});
