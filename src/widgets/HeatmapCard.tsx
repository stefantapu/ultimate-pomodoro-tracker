import type { HeatmapData } from "@shared/hooks/useAnalytics";
import { useSkinStore } from "@shared/stores/skinStore";
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

export function HeatmapCard({ heatmapData, loading }: HeatmapCardProps) {
  const activeSkinId = useSkinStore((state) => state.activeSkinId);
  const isWarmSkin = activeSkinId === "warm";

  const calendarTheme = isWarmSkin
    ? {
        light: ["#3b1509", "#7a2f12", "#b64614", "#e66f1a", "#ffb85a"],
        dark: ["#3b1509", "#7a2f12", "#b64614", "#e66f1a", "#ffb85a"],
      }
    : {
        light: ["#d7d7d7", "#a9a9a9", "#7f7f7f", "#555555", "#2b2b2b"],
        dark: ["#d7d7d7", "#a9a9a9", "#7f7f7f", "#555555", "#2b2b2b"],
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
              maxLevel={4}
              blockSize={isWarmSkin ? 12 : 14}
              blockMargin={4}
              fontSize={isWarmSkin ? 12 : 13}
              showWeekdayLabels
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
                totalCount: "{{count}} focused seconds in last 6 months",
              }}
            />
          </div>
        )}
      </div>
    </PanelShell>
  );
}
