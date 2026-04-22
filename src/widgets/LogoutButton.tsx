import { memo } from "react";
import { useAuth } from "@app/providers/useAuth";
import { useToolbarClickSound } from "@shared/hooks/useToolbarClickSound";
import { useUIStore } from "@shared/stores/uiStore";
import { getSupabaseClient } from "../../utils/supabase";
import { ThemedButton } from "./ThemedButton";
import toolbarStyles from "./ToolbarIconButton.module.css";

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const LogoutButton = memo(function LogoutButton() {
  const { user, loading } = useAuth();
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const triggerTimerReset = useUIStore((state) => state.triggerTimerReset);
  const playToolbarClick = useToolbarClickSound();
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
      className={buttonClassName}
      onClick={handleLogout}
      aria-label="Log out"
      title="Log out"
    >
      <>
        <span className={labelClassName}>Log out</span>
        <span className={iconClassName} aria-hidden="true" />
      </>
    </ThemedButton>
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
