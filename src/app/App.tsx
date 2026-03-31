import { Toaster } from "sonner";
import { AuthBlock } from "../widgets/AuthBlock";
import { ActivityHeatmapCard, StatsCard, useDashboardData } from "../widgets/StatsDashboard";
import { LockedOverlay } from "../widgets/LockedOverlay";
import { QuickNotes } from "../widgets/QuickNotes";
import { TimerBlock } from "../widgets/TimerBlock";
import { TopBar } from "../widgets/TopBar";
import { useUIStore } from "../shared/stores/uiStore";
import { useAuth } from "./providers/AuthProvider";
import styles from "./App.module.css";

function App() {
  const { user, loading } = useAuth();
  const isAuthModalOpen = useUIStore((state) => state.isAuthModalOpen);
  const dashboardData = useDashboardData();

  if (loading) {
    return <div className={styles.loadingState}>Loading Realm...</div>;
  }

  return (
    <>
      <Toaster position="bottom-right" theme="dark" />
      <TopBar />

      {isAuthModalOpen && <AuthBlock />}

      <main className={styles.appShell}>
        <section className={styles.grid}>
          <div className={`${styles.panel} ${styles.timer}`}>
            <TimerBlock />
          </div>

          <div className={`${styles.panel} ${styles.notes}`}>
            <QuickNotes />
            {!user && <LockedOverlay />}
          </div>

          <div className={`${styles.panel} ${styles.heatmap}`}>
            <ActivityHeatmapCard {...dashboardData} />
            {!user && <LockedOverlay />}
          </div>

          <div className={`${styles.panel} ${styles.stats}`}>
            <StatsCard {...dashboardData} />
            {!user && <LockedOverlay />}
          </div>
        </section>
      </main>
    </>
  );
}

export default App;
