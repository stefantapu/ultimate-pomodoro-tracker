import { useAuth } from "@app/providers/AuthProvider";
import { useUIStore } from "@shared/stores/uiStore";
import { supabase } from "../../utils/supabase";
import { ThemedButton } from "./ThemedButton";

export function LogoutButton() {
  const { user, loading } = useAuth();
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const triggerTimerReset = useUIStore((state) => state.triggerTimerReset);

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
      onClick={handleLogout}
      aria-label="Log out"
      title="Log out"
    >
      Out
    </ThemedButton>
  ) : (
    <ThemedButton
      variant="auth"
      onClick={() => setAuthModalOpen(true)}
      aria-label="Log in"
      title="Log in"
    >
      In
    </ThemedButton>
  );
}

