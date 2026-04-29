import { memo, Suspense, lazy, useEffect, useMemo, type ComponentType } from "react";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import type { User } from "@supabase/supabase-js";
import "./dashboard.css";
import styles from "./DashboardLayout.module.css";
import { BackgroundParticles } from "./BackgroundEmbers";
import { PanelShell } from "./PanelShell";
import { LogoutButton } from "./LogoutButton";
import { SettingsButton } from "./SettingsButton";
import { InfographicsButton } from "./InfographicsButton";
import { ThemePickerButton } from "./ThemePickerButton";
import { TimerBlock } from "./TimerBlock";

const LazyAuthenticatedAnalyticsPanels = lazy(() =>
  import("./StatsDashboard").then((module) => ({
    default: module.AuthenticatedAnalyticsPanels,
  })),
);

const LazyNotesPanel = lazy(() =>
  import("./NotesPanel").then((module) => ({
    default: module.NotesPanel,
  })),
);

const LazyDragonCard = lazy(() =>
  import("./DragonCard").then((module) => ({
    default: module.DragonCard,
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

function PlaceholderNotesPanel({ message }: PanelFallbackProps) {
  return (
    <PanelShell
      className="notes-panel"
      bodyClassName="notes-panel__body notes-panel__body--notepad"
    >
      <p className="notes-panel__status">{message}</p>
    </PanelShell>
  );
}

function PlaceholderDragonCard({ message }: PanelFallbackProps) {
  return (
    <PanelShell className="dragon-card">
      <div className="dragon-card__display">Lvl --</div>
      <div className="dragon-card__level-row">
        <span className="dragon-card__level-value">{message}</span>
      </div>
      <div className="dragon-card__progress">
        <div className="dragon-card__progress-fill" style={{ width: "0%" }} />
      </div>
    </PanelShell>
  );
}

function GuestAnalyticsPanels({
  LockedOverlayComponent,
}: {
  LockedOverlayComponent: ComponentType;
}) {
  return (
    <>
      <div className="dashboard-lock-wrap dashboard-lock-wrap--heatmap">
        <PlaceholderHeatmapCard message="Sign in to view focus history." />
        <LockedOverlayComponent />
      </div>

      <div className="dashboard-lock-wrap dashboard-lock-wrap--stats">
        <PlaceholderStatsCard message="--" />
        <LockedOverlayComponent />
      </div>
    </>
  );
}

function GuestNotesPanel({
  LockedOverlayComponent,
}: {
  LockedOverlayComponent: ComponentType;
}) {
  return (
    <div
      className={joinClassNames(
        styles["dashboard-notes-wrap"],
        "dashboard-lock-wrap dashboard-lock-wrap--notes",
      )}
    >
      <PlaceholderNotesPanel message="Sign in to save notes." />
      <LockedOverlayComponent />
    </div>
  );
}

function GuestDragonPanel({
  LockedOverlayComponent,
}: {
  LockedOverlayComponent: ComponentType;
}) {
  return (
    <div className="dashboard-lock-wrap dashboard-lock-wrap--dragon">
      <PlaceholderDragonCard message="Sign in to track your level." />
      <LockedOverlayComponent />
    </div>
  );
}

function AuthenticatedNotesPanel() {
  return (
    <div
      className={joinClassNames(
        styles["dashboard-notes-wrap"],
        "dashboard-lock-wrap dashboard-lock-wrap--notes",
      )}
    >
      <Suspense fallback={<PlaceholderNotesPanel message="Loading notes..." />}>
        <LazyNotesPanel />
      </Suspense>
    </div>
  );
}

function AuthenticatedDragonPanel() {
  return (
    <div className="dashboard-lock-wrap dashboard-lock-wrap--dragon">
      <Suspense fallback={<PlaceholderDragonCard message="Loading progress..." />}>
        <LazyDragonCard />
      </Suspense>
    </div>
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
          <InfographicsButton />
          <ThemePickerButton />
          <SettingsButton />
          <LogoutButton />
        </div>

        <section className="visually-hidden" aria-labelledby="dashboard-seo-title">
          <div>
            <h1 id="dashboard-seo-title">Forge Timer</h1>
            <p>
              A free gamified Pomodoro timer for focused work, study sessions,
              breaks, notes, streaks, and progress tracking.
            </p>
          </div>
          <div aria-label="What you can do">
            <h2>What you can do</h2>
            <ul>
              <li>Run focus and break timers.</li>
              <li>Edit focus and break durations.</li>
              <li>Save quick notes while you work.</li>
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
              styles["dashboard-section--secondary"],
            )}
          >
            {user ? (
              <AuthenticatedNotesPanel />
            ) : (
              <GuestNotesPanel LockedOverlayComponent={LockedOverlayComponent} />
            )}
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
                  <AuthenticatedDragonPanel />
                </>
              ) : (
                <>
                  <GuestAnalyticsPanels
                    LockedOverlayComponent={LockedOverlayComponent}
                  />
                  <GuestDragonPanel
                    LockedOverlayComponent={LockedOverlayComponent}
                  />
                </>
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
