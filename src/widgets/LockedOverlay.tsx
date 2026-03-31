import { useUIStore } from "../shared/stores/uiStore";

export function LockedOverlay() {
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(128, 122, 122, 0.1)",
        backdropFilter: "blur(0px)",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        color: "white"
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "1rem", textShadow: "0 0 10px rgba(0,0,0,0.5)" }}>🔒</div>
      <button
        onClick={() => setAuthModalOpen(true)}
        style={{
          background: "linear-gradient(135deg, #6e8efb, #a777e3)",
          border: "none",
          padding: "0.75rem 1.5rem",
          color: "white",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(167, 119, 227, 0.3)",
          transition: "transform 0.2s"
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        Sign in to track your progress
      </button>
    </div>
  );
}
