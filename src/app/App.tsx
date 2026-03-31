import { TimerBlock } from "../widgets/TimerBlock";
import { AuthBlock } from "../widgets/AuthBlock";
import { TopBar } from "../widgets/TopBar";
import { QuickNotes } from "../widgets/QuickNotes";
import { StatsDashboard } from "../widgets/StatsDashboard";
import { LockedOverlay } from "../widgets/LockedOverlay";
import { useAuth } from "./providers/AuthProvider";
import { useUIStore } from "../shared/stores/uiStore";
import { Toaster } from "sonner";

function App() {
  const { user, loading } = useAuth();
  const isAuthModalOpen = useUIStore((state) => state.isAuthModalOpen);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center", color: "white" }}>
        Loading Realm...
      </div>
    );
  }

  return (
    <>
      <Toaster position="bottom-right" theme="dark" />
      <TopBar />

      {isAuthModalOpen && <AuthBlock />}

      <div
        style={{
          height: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "4rem",
        }}
      >
        <div style={{ display: "flex", gap: "2rem", flexDirection: "row", alignItems: "stretch", flexWrap: "wrap", justifyContent: "center", width: "100%", padding: "0 2rem" }}>
          <div>
            <TimerBlock />
          </div>
          <div style={{ position: "relative", display: "flex" }}>
            <QuickNotes />
            {!user && <LockedOverlay />}
          </div>
        </div>

        <div style={{ width: "100%", padding: "0 2rem", position: "relative" }}>
          <StatsDashboard />
          {!user && <LockedOverlay />}
        </div>
      </div>
    </>
  );
}

export default App;
