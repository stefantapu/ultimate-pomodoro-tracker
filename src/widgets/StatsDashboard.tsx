import { ActivityCalendar } from "react-activity-calendar";
import { useAnalytics } from "../shared/hooks/useAnalytics";
import { useAuth } from "../app/providers/AuthProvider";

export function StatsDashboard() {
  const { data, loading } = useAnalytics();
  const { user } = useAuth();

  let displayData = data;
  if (!user || (!data && !loading)) {
    displayData = {
      today_focus_time: 0,
      today_break_time: 0,
      focus_cycles_count: 0,
      current_streak: 0,
      heatmap_data: []
    };
  }

  // if (!data && loading) {
  //   return (
  //     <div style={{ width: "100%", padding: "2rem", textAlign: "center", color: "#aaa", background: "rgba(255,255,255,0.02)", borderRadius: "12px", marginTop: "2rem" }}>
  //       Loading Realm Stats...
  //     </div>
  //   );
  // }

  if (!displayData) return null;

  // Format heatmap data for react-activity-calendar
  // react-activity-calendar requires: { date: "YYYY-MM-DD", count: number, level: 0-4 }
  const calendarData = displayData.heatmap_data.map((day) => {
    let level = 0;
    if (day.value > 0) level = 1;
    if (day.value >= 1800) level = 2; // 30 min
    if (day.value >= 3600) level = 3; // 1 hour
    if (day.value >= 7200) level = 4; // 2+ hours

    return {
      date: day.date,
      count: day.value,
      level: level as 0 | 1 | 2 | 3 | 4,
    };
  });

  // react-activity-calendar requires at least one date or it crashes if empty.
  if (calendarData.length === 0) {
    calendarData.push({
      date: new Date().toISOString().split("T")[0],
      count: 0,
      level: 0,
    });
  }

  const formatHours = (seconds: number) => (seconds / 3600).toFixed(1);

  return (
    <div style={{ width: "100%", marginTop: "2rem", display: "flex", flexDirection: "row", gap: "1.5rem", alignItems: "stretch", flexWrap: "wrap" }}>

      {/* Stats Panel */}
      <div style={{ flex: "1", minWidth: "250px", background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h4 style={{ color: "#fff", margin: "0", display: "flex", alignItems: "center", gap: "12px" }}>
          Statistics
          {loading && (
            <span style={{ fontSize: "0.8rem", color: "#a777e3", fontWeight: "normal", opacity: 0.8 }}>
              ↻ Syncing...
            </span>
          )}
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "8px" }}>
            <h4 style={{ color: "#aaa", margin: "0 0 5px 0", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>Focus Today</h4>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#a777e3", textShadow: "0 0 10px rgba(167, 119, 227, 0.3)" }}>{formatHours(displayData.today_focus_time)}<span style={{ fontSize: "0.9rem", color: "#666" }}>h</span></div>
          </div>
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "8px" }}>
            <h4 style={{ color: "#aaa", margin: "0 0 5px 0", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>Rest Today</h4>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#4CAF50", textShadow: "0 0 10px rgba(76, 175, 80, 0.3)" }}>{formatHours(displayData.today_break_time)}<span style={{ fontSize: "0.9rem", color: "#666" }}>h</span></div>
          </div>
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "8px" }}>
            <h4 style={{ color: "#aaa", margin: "0 0 5px 0", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>Cycles</h4>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#FFC107", textShadow: "0 0 10px rgba(255, 193, 7, 0.3)" }}>{displayData.focus_cycles_count}</div>
          </div>
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "8px" }}>
            <h4 style={{ color: "#aaa", margin: "0 0 5px 0", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>Streak</h4>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#FF5722", textShadow: "0 0 10px rgba(255, 87, 34, 0.3)" }}>{displayData.current_streak} <span style={{ fontSize: "1rem" }}>🔥</span></div>
          </div>
        </div>
      </div>

      {/* Heatmap Panel */}
      <div style={{ flex: "2.5", minWidth: "400px", background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h4 style={{ color: "#fff", margin: "0 0 1rem 0" }}>Activity Heatmap</h4>
        <div style={{ overflowX: "auto", padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
          <ActivityCalendar
            data={calendarData}
            theme={{
              light: ['#2a2a35', '#4c3b6b', '#6b4c9a', '#8a5dc9', '#a777e3'],
              dark: ['#2a2a35', '#4c3b6b', '#6b4c9a', '#8a5dc9', '#a777e3'],
            }}
            maxLevel={4}
            labels={{
              legend: {
                less: "Less",
                more: "More",
              },
              months: [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
              ],
              totalCount: '{{count}} focused seconds in last 6 months',
            }}
            showWeekdayLabels={true}
          />
        </div>
      </div>
    </div>
  );
}
