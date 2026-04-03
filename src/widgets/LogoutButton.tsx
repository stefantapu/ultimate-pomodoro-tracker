import { useAuth } from "@app/providers/AuthProvider";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import { supabase } from "../../utils/supabase";
import { ThemedButton } from "./ThemedButton";

export function LogoutButton() {
  const { user, loading } = useAuth();
  const activeSkinId = useSkinStore((state) => state.activeSkinId);
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const triggerTimerReset = useUIStore((state) => state.triggerTimerReset);
  const isWarmSkin = activeSkinId === "warm";

  const handleLogout = async () => {
    triggerTimerReset();
    await supabase.auth.signOut();
  };

  if (loading) {
    return null;
  }

  return user ? (
    <ThemedButton
      variant="auth"
      className={isWarmSkin ? "toolbar-icon-button toolbar-icon-button--exit" : undefined}
      onClick={handleLogout}
      aria-label="Log out"
      title="Log out"
    >
      {isWarmSkin ? (
        <>
          <span className="toolbar-icon-button__label">Log out</span>
          <span className="toolbar-icon-button__icon" aria-hidden="true" />
        </>
      ) : (
        "Out"
      )}
    </ThemedButton>
  ) : (
    <ThemedButton
      variant="auth"
      className={isWarmSkin ? "toolbar-icon-button toolbar-icon-button--exit" : undefined}
      onClick={() => setAuthModalOpen(true)}
      aria-label="Log in"
      title="Log in"
    >
      {isWarmSkin ? (
        <>
          <span className="toolbar-icon-button__label">Log in</span>
          <span className="toolbar-icon-button__icon" aria-hidden="true" />
        </>
      ) : (
        "In"
      )}
    </ThemedButton>
  );
}
