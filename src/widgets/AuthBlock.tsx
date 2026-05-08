import { useMemo, useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { useToolbarClickSound } from "@shared/hooks/useToolbarClickSound";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { useSkinStore } from "@shared/stores/skinStore";
import { getSupabaseClient } from "../../utils/supabase";
import { useUIStore } from "../shared/stores/uiStore";

const GOOGLE_RECOVERY_HINT = "If you signed up with Google, continue with Google.";

function getAuthErrorMessage(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as AuthError).message === "string"
    ? (error as AuthError).message
    : "An error occurred";
}

const GoogleMark = () => (
  <svg className="auth-block__google-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285f4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34a853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
    />
    <path
      fill="#fbbc05"
      d="M5.84 14.1A6.61 6.61 0 0 1 5.5 12c0-.73.12-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z"
    />
    <path
      fill="#ea4335"
      d="M12 5.37c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.37 12 5.37z"
    />
  </svg>
);

export const AuthBlock = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const playToolbarClick = useToolbarClickSound();
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );
  const authActionPending = manualLoading || googleLoading;

  const closeModal = () => {
    playToolbarClick();
    setAuthModalOpen(false);
  };

  const startGoogleAuth = async () => {
    if (authActionPending) {
      return;
    }

    playToolbarClick();
    setGoogleLoading(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      setError(getAuthErrorMessage(error));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authActionPending) {
      return;
    }

    playToolbarClick();
    setManualLoading(true);
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
      setError(getAuthErrorMessage(error));
    } finally {
      setManualLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    playToolbarClick();
    setShowPassword((value) => !value);
  };

  const toggleAuthMode = () => {
    playToolbarClick();
    setIsLogin(!isLogin);
    setShowPassword(false);
  };

  return (
    <div
      className={`auth-block auth-block--${activeSkin.id}`}
      style={skinCssVariables}
    >
      <div className="auth-block__panel">
        <button
          type="button"
          className="auth-block__close"
          onClick={closeModal}
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
              onClick={closeModal}
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

            <button
              type="button"
              className="auth-block__button auth-block__button--primary auth-block__button--google"
              onClick={startGoogleAuth}
              disabled={authActionPending}
            >
              <GoogleMark />
              <span>{googleLoading ? "Redirecting..." : "Continue with Google"}</span>
            </button>

            <div className="auth-block__divider" aria-hidden="true">
              <span>or enter manually</span>
            </div>

            {error && (
              <div className="auth-block__error" role="alert">
                <p>{error}</p>
                <p className="auth-block__recovery-hint" aria-label={GOOGLE_RECOVERY_HINT}>
                  If you signed up with{" "}
                  <button
                    type="button"
                    className="auth-block__recovery-action"
                    onClick={startGoogleAuth}
                    disabled={authActionPending}
                  >
                    Google
                  </button>
                  , continue with Google.
                </p>
              </div>
            )}

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
                  onClick={togglePasswordVisibility}
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
                disabled={authActionPending}
                className="auth-block__button auth-block__button--primary"
              >
                {manualLoading
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
                onClick={toggleAuthMode}
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
