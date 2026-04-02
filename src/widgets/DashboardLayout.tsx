import { useAnalytics } from "@shared/hooks/useAnalytics";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { useSkinStore } from "@shared/stores/skinStore";
import type { User } from "@supabase/supabase-js";
import type { ComponentType } from "react";
import "./dashboard.css";
import { DragonCard } from "./DragonCard";
import { HeatmapCard } from "./HeatmapCard";
import { LogoutButton } from "./LogoutButton";
import { NotesPanel } from "./NotesPanel";
import { SettingsButton } from "./SettingsButton";
import { SettingsModal } from "./SettingsModal";
import { StatsCard } from "./StatsCard";
import { TimerBlock } from "./TimerBlock";

type DashboardLayoutProps = {
  user: User | null;
  LockedOverlayComponent: ComponentType;
};

export function DashboardLayout({
  user,
  LockedOverlayComponent,
}: DashboardLayoutProps) {
  const analytics = useAnalytics();
  const activeSkin = useSkinStore((state) => state.activeSkin);

  return (
    <div
      className={`dashboard-shell dashboard-shell--${activeSkin.id}`}
      style={mapSkinToCssVariables(activeSkin)}
    >
      <SettingsModal />

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
                heatmapData={analytics.data?.heatmap_data ?? []}
                loading={analytics.loading}
              />
              {!user && <LockedOverlayComponent />}
            </div>

            <div className="dashboard-lock-wrap">
              <StatsCard data={analytics.data} loading={analytics.loading} />
              {!user && <LockedOverlayComponent />}
            </div>
          </div>
        </section>

        <section className="dashboard-column dashboard-column--right">
          <div className="dashboard-lock-wrap dashboard-notes-wrap">
            <NotesPanel />
            {!user && <LockedOverlayComponent />}
          </div>

          <div className="dashboard-lock-wrap">
            <DragonCard />
            {!user && <LockedOverlayComponent />}
          </div>
        </section>
      </main>
    </div>
  );
}
