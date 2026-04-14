import { memo } from "react";
import { useAuth } from "@app/providers/useAuth";
import { useToolbarClickSound } from "@shared/hooks/useToolbarClickSound";
import { useUIStore } from "@shared/stores/uiStore";
import { getSupabaseClient } from "../../utils/supabase";
import { ThemedButton } from "./ThemedButton";

export const LogoutButton = memo(function LogoutButton() {
  const { user, loading } = useAuth();
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const triggerTimerReset = useUIStore((state) => state.triggerTimerReset);
  const playToolbarClick = useToolbarClickSound();

  const handleLogout = async () => {
    playToolbarClick();
    triggerTimerReset();
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
  };

  const handleLogin = () => {
    playToolbarClick();
    setAuthModalOpen(true);
  };

  if (loading) {
    return null;
  }

  return user ? (
    <ThemedButton
      variant="auth"
      className="toolbar-icon-button toolbar-icon-button--exit"
      onClick={handleLogout}
      aria-label="Log out"
      title="Log out"
    >
      <>
        <span className="toolbar-icon-button__label">Log out</span>
        <span className="toolbar-icon-button__icon" aria-hidden="true" />
      </>
    </ThemedButton>
  ) : (
    <ThemedButton
      variant="auth"
      className="toolbar-icon-button toolbar-icon-button--exit"
      onClick={handleLogin}
      aria-label="Log in"
      title="Log in"
    >
      <>
        <span className="toolbar-icon-button__label">Log in</span>
        <span className="toolbar-icon-button__icon" aria-hidden="true" />
      </>
    </ThemedButton>
  );
});
