import { useState } from "react";
import { supabase } from "../../utils/supabase";
import { useUIStore } from "../shared/stores/uiStore";

export const AuthBlock = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setAuthModalOpen(false); // Close on successful login
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          background: "rgba(20, 20, 20, 0.8)",
          padding: "2rem",
          borderRadius: "1rem",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          width: "320px",
          color: "white",
          position: "relative",
        }}
      >
        <button
          onClick={() => setAuthModalOpen(false)}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "#aaa",
            cursor: "pointer",
            fontSize: "1.2rem",
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          &times;
        </button>

        {isSuccess ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <h2 style={{ marginBottom: "1rem", color: "#a777e3" }}>Success! ⚔️</h2>
            <p style={{ color: "#eee", fontSize: "0.95rem", lineHeight: 1.5 }}>
              A confirmation pigeon has been sent to your email. Please verify your account to join the quest.
            </p>
            <button
              onClick={() => setAuthModalOpen(false)}
              style={{
                marginTop: "1.5rem",
                padding: "0.5rem 1.5rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                cursor: "pointer",
              }}
            >
              Back to Timer
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              {isLogin ? "Welcome Back" : "Join the Quest"}
            </h2>

            {error && (
              <div
                style={{
                  background: "rgba(255, 0, 0, 0.2)",
                  color: "#ff6b6b",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                type="email"
                placeholder="Hero Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "rgba(0, 0, 0, 0.2)",
                  color: "white",
                  outline: "none",
                }}
              />
              <input
                type="password"
                placeholder="Secret Passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "rgba(0, 0, 0, 0.2)",
                  color: "white",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "0.75rem",
                  marginTop: "0.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "linear-gradient(135deg, #6e8efb, #a777e3)",
                  color: "white",
                  fontWeight: "bold",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "transform 0.2s",
                }}
              >
                {loading ? "Casting..." : isLogin ? "Enter Realm" : "Forge Account"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.875rem", color: "#aaa" }}>
              {isLogin ? "New to the realm?" : "Already a hero?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#a777e3",
                  cursor: "pointer",
                  marginLeft: "0.5rem",
                  textDecoration: "underline",
                }}
              >
                {isLogin ? "Sign Up" : "Log In"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
