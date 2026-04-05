import { memo, useMemo, type ComponentType } from "react";
import {
  useAnalytics,
  type HeatmapData,
} from "@shared/hooks/useAnalytics";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { useSkinStore } from "@shared/stores/skinStore";
import type { User } from "@supabase/supabase-js";
import "./dashboard.css";
import { BackgroundEmbers } from "./BackgroundEmbers";
import { DragonCard } from "./DragonCard";
import { HeatmapCard } from "./HeatmapCard";
import { LogoutButton } from "./LogoutButton";
import { NotesPanel } from "./NotesPanel";
import { SettingsButton } from "./SettingsButton";
import { StatsCard } from "./StatsCard";
import { TimerBlock } from "./TimerBlock";

const EMPTY_HEATMAP_DATA: Array<{ date: string; value: number }> = [];
const HEATMAP_MOCK_WINDOW_DAYS = 183;

function buildMockHeatmapData(): HeatmapData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: HEATMAP_MOCK_WINDOW_DAYS }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (HEATMAP_MOCK_WINDOW_DAYS - 1 - index));

    const weekday = date.getDay();
    const weekIndex = Math.floor(index / 7);
    let value = 0;

    if (weekday === 1) value = 1500;
    if (weekday === 2) value = 2700;
    if (weekday === 3) value = weekIndex % 2 === 0 ? 0 : 1800;
    if (weekday === 4) value = 4200;
    if (weekday === 5) value = weekIndex % 3 === 0 ? 5400 : 3000;
    if (weekday === 6) value = weekIndex % 2 === 0 ? 2400 : 900;

    return {
      date: date.toISOString().split("T")[0],
      value,
    };
  });
}

const MOCK_HEATMAP_DATA = buildMockHeatmapData();

type DashboardLayoutProps = {
  user: User | null;
  LockedOverlayComponent: ComponentType;
};

export const DashboardLayout = memo(function DashboardLayout({
  user,
  LockedOverlayComponent,
}: DashboardLayoutProps) {
  const analytics = useAnalytics();
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );
  const heatmapData = user
    ? analytics.data?.heatmap_data ?? EMPTY_HEATMAP_DATA
    : MOCK_HEATMAP_DATA;

  return (
    <div
      className={`dashboard-shell dashboard-shell--${activeSkin.id}`}
      style={skinCssVariables}
    >
      {activeSkin.id === "warm" ? <BackgroundEmbers /> : null}
      <div className="dashboard-content">
        <div className="dashboard-toolbar">
          <SettingsButton />
          <LogoutButton />
        </div>

        <main className="dashboard-main">
          <section className="dashboard-column dashboard-column--left">
            <TimerBlock />

            <div className="dashboard-bottom-row">
              <div className="dashboard-lock-wrap">
                <HeatmapCard
                  heatmapData={heatmapData}
                  loading={analytics.loading}
                />
                {!user && <LockedOverlayComponent />}
              </div>

              <div className="dashboard-lock-wrap dashboard-lock-wrap--stats">
                <StatsCard data={analytics.data} loading={analytics.loading} />
                {!user && <LockedOverlayComponent />}
              </div>
            </div>
          </section>

          <section className="dashboard-column dashboard-column--right">
            <div className="dashboard-lock-wrap dashboard-lock-wrap--notes dashboard-notes-wrap">
              <NotesPanel />
              {!user && <LockedOverlayComponent />}
            </div>

            <div className="dashboard-lock-wrap dashboard-lock-wrap--dragon">
              <DragonCard />
              {!user && <LockedOverlayComponent />}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
});
