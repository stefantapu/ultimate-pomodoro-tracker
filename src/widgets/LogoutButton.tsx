import { memo, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@app/providers/useAuth";
import { useToolbarClickSound } from "@shared/hooks/useToolbarClickSound";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import { getSupabaseClient } from "../../utils/supabase";
import { ThemedButton } from "./ThemedButton";
import toolbarStyles from "./ToolbarIconButton.module.css";

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const LogoutButton = memo(function LogoutButton() {
  const { user, loading } = useAuth();
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isLoggingOut, setLoggingOut] = useState(false);
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const triggerTimerReset = useUIStore((state) => state.triggerTimerReset);
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const playToolbarClick = useToolbarClickSound();
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );
  const buttonClassName = joinClassNames(
    toolbarStyles["toolbar-icon-button"],
    "toolbar-icon-button",
    "toolbar-icon-button--exit",
  );
  const labelClassName = joinClassNames(
    toolbarStyles["toolbar-icon-button__label"],
    "toolbar-icon-button__label",
  );
  const iconClassName = joinClassNames(
    toolbarStyles["toolbar-icon-button__icon"],
    "toolbar-icon-button__icon",
  );

  const openLogoutConfirmation = () => {
    playToolbarClick();
    setConfirmOpen(true);
  };

  const closeLogoutConfirmation = () => {
    if (isLoggingOut) {
      return;
    }

    playToolbarClick();
    setConfirmOpen(false);
  };

  const handleConfirmLogout = async () => {
    playToolbarClick();
    setLoggingOut(true);

    try {
      triggerTimerReset();
      const supabase = await getSupabaseClient();
      await supabase.auth.signOut();
      setConfirmOpen(false);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogin = () => {
    playToolbarClick();
    setAuthModalOpen(true);
  };

  if (loading) {
    return null;
  }

  const confirmationModal =
    isConfirmOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className={`logout-confirmation__overlay logout-confirmation__overlay--${activeSkin.id}`}
            style={skinCssVariables}
            onClick={closeLogoutConfirmation}
          >
            <div
              className="logout-confirmation"
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-confirmation-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="logout-confirmation__header">
                <h2 id="logout-confirmation-title">Log out?</h2>
                <button
                  type="button"
                  className="logout-confirmation__close"
                  onClick={closeLogoutConfirmation}
                  aria-label="Close logout confirmation"
                  disabled={isLoggingOut}
                >
                  X
                </button>
              </header>
              <div className="logout-confirmation__body">
                <p>
                  Your local timer view will reset and synced progress will be
                  available again after you sign back in.
                </p>
              </div>
              <footer className="logout-confirmation__actions">
                <button
                  type="button"
                  className="logout-confirmation__button logout-confirmation__button--secondary"
                  onClick={closeLogoutConfirmation}
                  disabled={isLoggingOut}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="logout-confirmation__button logout-confirmation__button--primary"
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </button>
              </footer>
            </div>
          </div>,
          document.body,
        )
      : null;

  return user ? (
    <>
      <ThemedButton
        variant="auth"
        className={buttonClassName}
        onClick={openLogoutConfirmation}
        aria-label="Log out"
        title="Log out"
      >
        <>
          <span className={labelClassName}>Log out</span>
          <span className={iconClassName} aria-hidden="true" />
        </>
      </ThemedButton>
      {confirmationModal}
    </>
  ) : (
    <ThemedButton
      variant="auth"
      className={buttonClassName}
      onClick={handleLogin}
      aria-label="Log in"
      title="Log in"
    >
      <>
        <span className={labelClassName}>Log in</span>
        <span className={iconClassName} aria-hidden="true" />
      </>
    </ThemedButton>
  );
});
