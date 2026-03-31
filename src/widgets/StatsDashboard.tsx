import { ActivityCalendar } from "react-activity-calendar";
import { useAuth } from "../app/providers/AuthProvider";
import { useAnalytics, type AnalyticsData } from "../shared/hooks/useAnalytics";
import styles from "./StatsDashboard.module.css";

type DashboardDataState = {
  displayData: AnalyticsData;
  loading: boolean;
};

const emptyAnalytics: AnalyticsData = {
  today_focus_time: 0,
  today_break_time: 0,
  focus_cycles_count: 0,
  current_streak: 0,
  heatmap_data: [],
};

const calendarTheme = {
  light: [
    "rgba(11, 18, 32, 0.4)",
    "rgba(52, 245, 255, 0.22)",
    "rgba(52, 245, 255, 0.42)",
    "rgba(255, 71, 209, 0.52)",
    "rgba(255, 71, 209, 0.88)",
  ],
  dark: [
    "rgba(11, 18, 32, 0.4)",
    "rgba(52, 245, 255, 0.22)",
    "rgba(52, 245, 255, 0.42)",
    "rgba(255, 71, 209, 0.52)",
    "rgba(255, 71, 209, 0.88)",
  ],
};

export function useDashboardData(): DashboardDataState {
  const { data, loading } = useAnalytics();
  const { user } = useAuth();

  if (!user || (!data && !loading)) {
    return {
      displayData: emptyAnalytics,
      loading,
    };
  }

  return {
    displayData: data ?? emptyAnalytics,
    loading,
  };
}

function getCalendarData(displayData: AnalyticsData) {
  const calendarData = displayData.heatmap_data.map((day) => {
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
      level: 0,
    });
  }

  return calendarData;
}

const formatHours = (seconds: number) => (seconds / 3600).toFixed(1);

export function ActivityHeatmapCard({ displayData, loading }: DashboardDataState) {
  const calendarData = getCalendarData(displayData);

  return (
    <section className={`${styles.panel} ${styles.heatmapPanel}`}>
      <div className={styles.headingRow}>
        <h4 className={styles.title}>Activity Heatmap</h4>
        {loading && <span className={styles.status}>Syncing</span>}
      </div>

      <div className={styles.heatmapFrame}>
        <div className={styles.calendarWrap}>
          <ActivityCalendar
            data={calendarData}
            theme={calendarTheme}
            maxLevel={4}
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
              totalCount: "{{count}} focused seconds last year",
            }}
            showWeekdayLabels
          />
        </div>
      </div>
    </section>
  );
}

export function StatsCard({ displayData, loading }: DashboardDataState) {
  return (
    <section className={`${styles.panel} ${styles.statsPanel}`}>
      <div className={styles.headingRow}>
        <h4 className={styles.title}>Statistics</h4>
        {loading && <span className={styles.status}>Syncing</span>}
      </div>

      <div className={styles.statsList}>
        <article className={styles.statCard}>
          <p className={styles.metricLabel}>Focus Today</p>
          <div className={styles.metricValue}>
            {formatHours(displayData.today_focus_time)}
            <span className={styles.metricUnit}>h</span>
          </div>
        </article>

        <article className={styles.statCard}>
          <p className={styles.metricLabel}>Rest Today</p>
          <div className={styles.metricValue}>
            {formatHours(displayData.today_break_time)}
            <span className={styles.metricUnit}>h</span>
          </div>
        </article>

        <article className={styles.statCard}>
          <p className={styles.metricLabel}>Cycles</p>
          <div className={styles.metricValue}>{displayData.focus_cycles_count}</div>
        </article>

        <article className={styles.statCard}>
          <p className={styles.metricLabel}>Streak</p>
          <div className={styles.metricValue}>{displayData.current_streak}</div>
        </article>
      </div>
    </section>
  );
}
