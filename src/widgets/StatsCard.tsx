import { memo } from "react";
import type { AnalyticsData } from "@shared/hooks/useAnalytics";
import { PanelShell } from "./PanelShell";

type StatsCardProps = {
  data: AnalyticsData | null;
  loading: boolean;
};

function formatHours(seconds: number) {
  return `${(seconds / 3600).toFixed(1)}h`;
}

export const StatsCard = memo(function StatsCard({
  data,
  loading,
}: StatsCardProps) {
  const items = [
    {
      label: "Focus",
      value: data ? formatHours(data.today_focus_time) : loading ? "..." : "--",
    },
    {
      label: "Break",
      value: data ? formatHours(data.today_break_time) : loading ? "..." : "--",
    },
    {
      label: "Cycles",
      value: data ? `${data.focus_cycles_count}` : loading ? "..." : "--",
    },
    {
      label: "Streak",
      value: data ? `${data.current_streak}` : loading ? "..." : "--",
    },
  ];

  return (
    <PanelShell className="stats-card">
      <div className="stats-card__grid">
        {items.map((item) => (
          <div key={item.label} className="stats-card__item">
            <span className="stats-card__label">{item.label}</span>
            <span className="stats-card__value">{item.value}</span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
});
