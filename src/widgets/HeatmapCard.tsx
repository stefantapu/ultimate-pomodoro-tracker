import { memo } from "react";
import type { HeatmapData } from "@shared/hooks/useAnalytics";
import { ActivityCalendar } from "react-activity-calendar";
import { PanelShell } from "./PanelShell";

type HeatmapCardProps = {
  heatmapData: HeatmapData[];
  loading: boolean;
};

const HEATMAP_WINDOW_DAYS = 183;

function getCalendarData(heatmapData: HeatmapData[]) {
  const recentHeatmapData = heatmapData.slice(-HEATMAP_WINDOW_DAYS);

  const calendarData = recentHeatmapData.map((day) => {
    let level = 0;
    if (day.value > 0) level = 1;
    if (day.value >= 1800) level = 2;
    if (day.value >= 3600) level = 3;
    if (day.value >= 7200) level = 4;

    return {
      date: day.date,
      count: day.value,
      level: level as 0 | 1 | 2 | 3 | 4,
    };
  });

  if (calendarData.length === 0) {
    calendarData.push({
      date: new Date().toISOString().split("T")[0],
      count: 0,
      level: 0 as const,
    });
  }

  return calendarData;
}

export const HeatmapCard = memo(function HeatmapCard({
  heatmapData,
  loading,
}: HeatmapCardProps) {
  const totalFocusedHours = (
    heatmapData.reduce((sum, day) => sum + day.value, 0) / 3600
  ).toFixed(1);
  const formatHours = (seconds: number) => `${(seconds / 3600).toFixed(1)}h`;
  const formatDayMonth = (isoDate: string) => {
    const [, month, day] = isoDate.split("-");
    return `${Number(day)}/${Number(month)}`;
  };

  const calendarTheme = {
    light: ["#3b1509", "#7a2f12", "#b64614", "#e66f1a", "#ffb85a"],
    dark: ["#3b1509", "#7a2f12", "#b64614", "#e66f1a", "#ffb85a"],
  };

  return (
    <PanelShell className="heatmap-card">
      <div className="heatmap-card__content">
        {loading && heatmapData.length === 0 ? (
          <div className="heatmap-card__status">Loading heat map...</div>
        ) : (
          <div className="heatmap-card__calendar">
            <ActivityCalendar
              data={getCalendarData(heatmapData)}
              theme={calendarTheme}
              colorScheme="dark"
              maxLevel={4}
              blockSize={12}
              blockMargin={4}
              fontSize={12}
              showWeekdayLabels
              tooltips={{
                activity: {
                  text: (activity) =>
                    `${formatHours(activity.count)} - ${formatDayMonth(activity.date)}`,
                },
              }}
              labels={{
                legend: {
                  less: "Less",
                  more: "More",
                },
                months: [
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
                totalCount: `${totalFocusedHours}h focused in last 6 months`,
              }}
            />
          </div>
        )}
      </div>
    </PanelShell>
  );
});
