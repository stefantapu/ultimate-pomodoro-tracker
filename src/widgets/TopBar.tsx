import { useAuth } from "../app/providers/AuthProvider";
import { useUIStore } from "../shared/stores/uiStore";
import { supabase } from "../../utils/supabase";

export const TopBar = () => {
  const { user, loading } = useAuth();
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const triggerTimerReset = useUIStore((state) => state.triggerTimerReset);

  const handleLogout = async () => {
    triggerTimerReset(); // Reset timer and sync final seconds
    await supabase.auth.signOut();
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 2rem",
        background: "rgba(20, 20, 20, 0.4)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        fontFamily: "inherit",
        color: "white",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <img src="images/favicon_1.png" alt="Logo" style={{ width: "2rem", height: "2rem" }} />
        <span style={{
        }}>
          Focus
        </span>
      </div>

      <div>
        {!loading && (
          user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div 
                style={{ 
                  width: "36px", 
                  height: "36px", 
                  borderRadius: "50%", 
                  background: "linear-gradient(135deg, #a777e3, #6e8efb)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "white", 
                  fontWeight: "bold", 
                  fontSize: "1.1rem",
                  boxShadow: "0 2px 8px rgba(167, 119, 227, 0.4)"
                }}
                title={user.email}
              >
                {user.email?.[0]?.toUpperCase() || "?"}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #6e8efb, #a777e3)",
                border: "none",
                color: "white",
                padding: "0.5rem 1.5rem",
                borderRadius: "0.5rem",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "0.875rem",
                transition: "transform 0.2s",
                boxShadow: "0 4px 12px rgba(167, 119, 227, 0.3)",
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              Login
            </button>
          )
        )}
      </div>
    </div>
  );
};
