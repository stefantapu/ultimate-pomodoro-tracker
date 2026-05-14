import {
  memo,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  type ComponentType,
} from "react";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import type { User } from "@supabase/supabase-js";
import "./dashboard.css";
import styles from "./DashboardLayout.module.css";
import { BackgroundParticles } from "./BackgroundEmbers";
import { PanelShell } from "./PanelShell";
import { SettingsButton } from "./SettingsButton";
import { KoFiButton } from "./KoFiButton";
import { ThemePickerButton } from "./ThemePickerButton";
import { TimerBlock } from "./TimerBlock";
import { HeatmapCard } from "./HeatmapCard";
import { createPreviewHeatmapData } from "./previewHeatmapData";
import { ProfileButton } from "./ProfileButton";

const LazyAuthenticatedAnalyticsPanels = lazy(() =>
  import("./StatsDashboard").then((module) => ({
    default: module.AuthenticatedAnalyticsPanels,
  })),
);

type DashboardLayoutProps = {
  user: User | null;
  LockedOverlayComponent: ComponentType;
};

type PanelFallbackProps = {
  message: string;
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function PlaceholderHeatmapCard({ message }: PanelFallbackProps) {
  return (
    <PanelShell className="heatmap-card" bodyClassName="heatmap-card__content">
      <div className="heatmap-card__status">{message}</div>
    </PanelShell>
  );
}

function PlaceholderStatsCard({ message }: PanelFallbackProps) {
  const items = [
    { label: "Focus", value: message },
    { label: "Break", value: message },
    { label: "Today", value: message },
    { label: "Streak", value: message },
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
}

function GuestAnalyticsPanels({
  LockedOverlayComponent,
}: {
  LockedOverlayComponent: ComponentType;
}) {
  const previewHeatmapData = useMemo(() => createPreviewHeatmapData(), []);

  return (
    <>
      <div className="dashboard-lock-wrap dashboard-lock-wrap--heatmap">
        <HeatmapCard
          heatmapData={previewHeatmapData}
          loading={false}
          previewLabel="Preview data"
        />
      </div>

      <div className="dashboard-lock-wrap dashboard-lock-wrap--stats">
        <PlaceholderStatsCard message="--" />
        <LockedOverlayComponent />
      </div>
    </>
  );
}

export const DashboardLayout = memo(function DashboardLayout({
  user,
  LockedOverlayComponent,
}: DashboardLayoutProps) {
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const isOverlayOpen = useUIStore(
    (state) =>
      state.isSettingsModalOpen ||
      state.isInfographicsModalOpen ||
      state.isThemePickerModalOpen,
  );
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );

  useEffect(() => {
    document.body.dataset.dashboardSkin = activeSkin.id;

    return () => {
      if (document.body.dataset.dashboardSkin === activeSkin.id) {
        delete document.body.dataset.dashboardSkin;
      }
    };
  }, [activeSkin.id]);

  return (
    <div
      className={`dashboard-shell dashboard-shell--${activeSkin.id}`}
      style={skinCssVariables}
    >
      {activeSkin.capabilities.effects.ambient && !isOverlayOpen ? (
        <BackgroundParticles effect={activeSkin.capabilities.effects.ambient} />
      ) : null}
      <div className={styles["dashboard-content"]}>
        <div className={joinClassNames(styles["dashboard-toolbar"], "dashboard-toolbar")}>
          <KoFiButton />
          <ProfileButton user={user} />
          <SettingsButton />
          <ThemePickerButton />
        </div>

        <section className="visually-hidden" aria-labelledby="dashboard-seo-title">
          <div>
            <h1 id="dashboard-seo-title">Forge Timer</h1>
            <p>
              A free gamified Pomodoro timer for focused work, study sessions,
              breaks, streaks, and progress tracking.
            </p>
          </div>
          <div aria-label="What you can do">
            <h2>What you can do</h2>
            <ul>
              <li>Run focus and break timers.</li>
              <li>Edit focus and break durations.</li>
              <li>Track analytics, streaks, and progress when signed in.</li>
              <li>Sync timer settings through your account.</li>
            </ul>
          </div>
        </section>

        <main className={styles["dashboard-main"]}>
          <section
            className={joinClassNames(
              styles["dashboard-section"],
              styles["dashboard-section--primary"],
            )}
          >
            <TimerBlock />
          </section>

          <section
            className={joinClassNames(
              styles["dashboard-section"],
              styles["dashboard-section--bottom"],
            )}
          >
            <div className={joinClassNames(styles["dashboard-bottom-row"], "dashboard-bottom-row")}>
              {user ? (
                <>
                  <Suspense
                    fallback={
                      <>
                        <div className="dashboard-lock-wrap dashboard-lock-wrap--heatmap">
                          <PlaceholderHeatmapCard message="Loading heat map..." />
                        </div>
                        <div className="dashboard-lock-wrap dashboard-lock-wrap--stats">
                          <PlaceholderStatsCard message="..." />
                        </div>
                      </>
                    }
                  >
                    <LazyAuthenticatedAnalyticsPanels />
                  </Suspense>
                </>
              ) : (
                <GuestAnalyticsPanels
                  LockedOverlayComponent={LockedOverlayComponent}
                />
              )}
            </div>
          </section>
        </main>
      </div>
      {activeSkin.capabilities.effects.foreground && !isOverlayOpen ? (
        <BackgroundParticles
          effect={activeSkin.capabilities.effects.foreground}
          layer="foreground"
        />
      ) : null}
    </div>
  );
});
