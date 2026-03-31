import { TimerBlock } from "@widgets/TimerBlock";
import { AuthBlock } from "../widgets/AuthBlock";
import { TopBar } from "../widgets/TopBar";
import { useAuth } from "./providers/AuthProvider";
import { useUIStore } from "../shared/stores/uiStore";
import { Toaster } from "sonner";

function App() {
  const { user, loading } = useAuth();
  const isAuthModalOpen = useUIStore((state) => state.isAuthModalOpen);
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);

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
        {!user && (
          <div style={{ marginBottom: "1.5rem", color: "#aaa", fontSize: "0.9rem", textAlign: "center" }}>
            Log in to save your sessions and level up your dragon!
            <br />
            <button
              onClick={() => setAuthModalOpen(true)}
              style={{ background: "none", border: "none", color: "#a777e3", textDecoration: "underline", cursor: "pointer", marginTop: "0.5rem", fontSize: "inherit" }}
            >
              Join the Realm
            </button>
          </div>
        )}
        <TimerBlock />
      </div>
    </>
  );
}

export default App;
