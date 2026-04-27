import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatsCard } from "./StatsCard";

describe("StatsCard", () => {
  it("renders the third metric label as Today", () => {
    render(
      <StatsCard
        loading={false}
        data={{
          today_focus_time: 3600,
          today_break_time: 1200,
          focus_cycles_count: 3,
          current_streak: 5,
          heatmap_data: [],
        }}
      />,
    );

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.queryByText("Cycles")).not.toBeInTheDocument();
  });
});
