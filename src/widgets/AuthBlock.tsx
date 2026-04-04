import { useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
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
        setAuthModalOpen(false);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setIsSuccess(true);
      }
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as AuthError).message === "string"
          ? (error as AuthError).message
          : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-block">
      <div className="auth-block__panel">
        <button
          type="button"
          className="auth-block__close"
          onClick={() => setAuthModalOpen(false)}
          aria-label="Close"
        >
          &times;
        </button>

        {isSuccess ? (
          <div className="auth-block__success">
            <div className="auth-block__crest" aria-hidden="true" />
            <h2 className="auth-block__title">Success</h2>
            <p className="auth-block__description">
              A confirmation email has been sent. Verify your account to unlock
              progress tracking.
            </p>
            <button
              type="button"
              className="auth-block__button auth-block__button--secondary"
              onClick={() => setAuthModalOpen(false)}
            >
              Back to Timer
            </button>
          </div>
        ) : (
          <>
            <div className="auth-block__crest" aria-hidden="true" />
            <h2 className="auth-block__title">
              {isLogin ? "Welcome Back" : "Join the Quest"}
            </h2>
            <p className="auth-block__description">
              Save your sessions, notes, and long-term progress in the realm.
            </p>

            {error && <div className="auth-block__error">{error}</div>}

            <form className="auth-block__form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Hero Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-block__input"
              />
              <input
                type="password"
                placeholder="Secret Passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-block__input"
              />
              <button
                type="submit"
                disabled={loading}
                className="auth-block__button auth-block__button--primary"
              >
                {loading
                  ? "Casting..."
                  : isLogin
                    ? "Enter Realm"
                    : "Forge Account"}
              </button>
            </form>

            <p className="auth-block__switch-text">
              {isLogin ? "New to the realm?" : "Already a hero?"}
              <button
                type="button"
                className="auth-block__switch-button"
                onClick={() => setIsLogin(!isLogin)}
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
