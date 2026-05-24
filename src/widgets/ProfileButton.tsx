import { memo, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { useProfile } from "@shared/hooks/useProfile";
import { useToolbarClickSound } from "@shared/hooks/useToolbarClickSound";
import { getLevelProgress } from "@shared/lib/levelProgress";
import { useUIStore } from "@shared/stores/uiStore";
import { ThemedButton } from "./ThemedButton";

type ProfileButtonProps = {
  user: User | null;
};

function joinClassNames(...classNames: Array<string | false | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const ProfileButton = memo(function ProfileButton({
  user,
}: ProfileButtonProps) {
  const { profile } = useProfile();
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const setInfographicsModalOpen = useUIStore(
    (state) => state.setInfographicsModalOpen,
  );
  const playToolbarClick = useToolbarClickSound();
  const progress = useMemo(
    () => (profile ? getLevelProgress(profile.total_xp, profile.level) : null),
    [profile],
  );

  const handleClick = () => {
    playToolbarClick();

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setInfographicsModalOpen(true);
  };

  const label = user ? "Open hero profile" : "Log in or register";
  const levelLabel = user && profile ? `LVL ${profile.level}` : "LVL 0";
  const progressPct = user && progress ? progress.progressPct : 0;

  return (
    <ThemedButton
      variant="toolbar"
      className={joinClassNames(
        "profile-entry",
        user ? "profile-entry--authenticated" : "profile-entry--guest",
      )}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      <span
        className="profile-entry__avatar"
        aria-hidden="true"
      >
        <span className="profile-entry__avatar-image" />
      </span>
      <span className="profile-entry__meta">
        <span className="profile-entry__level">{levelLabel}</span>
        <span className="profile-entry__xp" aria-hidden="true">
          <span
            className="profile-entry__xp-fill"
            style={{ width: `${progressPct}%` }}
          />
        </span>
      </span>
    </ThemedButton>
  );
});
