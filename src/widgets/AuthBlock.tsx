import { useMemo, useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { useSkinStore } from "@shared/stores/skinStore";
import { getSupabaseClient } from "../../utils/supabase";
import { useUIStore } from "../shared/stores/uiStore";

export const AuthBlock = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();

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
    <div className="auth-block" style={skinCssVariables}>
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
              <div className="auth-block__password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Secret Passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-block__input auth-block__input--password"
                />
                <button
                  type="button"
                  className="auth-block__password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg
                      className="auth-block__password-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 3l18 18"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M10.58 10.58a2 2 0 002.84 2.84"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M9.88 5.09A9.77 9.77 0 0112 4.8c5.4 0 9.27 4.12 10.5 6.2-.55.93-1.66 2.42-3.27 3.73"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M6.61 6.62C4.55 7.87 3.2 9.68 2.5 11c1.23 2.08 5.1 6.2 10.5 6.2 1.43 0 2.74-.29 3.92-.78"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="auth-block__password-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 12S6.27 5.8 12 5.8 21.5 12 21.5 12 17.73 18.2 12 18.2 2.5 12 2.5 12z"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="2.8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </button>
              </div>
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
                onClick={() => {
                  setIsLogin(!isLogin);
                  setShowPassword(false);
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
