import { AuthBlock } from "../widgets/AuthBlock";
import { DashboardLayout } from "../widgets/DashboardLayout";
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

      {isAuthModalOpen && <AuthBlock />}

      <DashboardLayout user={user} LockedOverlayComponent={LockedOverlay} />
    </>
  );
}

export default App;

