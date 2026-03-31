import { useProfile } from "../shared/hooks/useProfile";
import { useUIStore } from "../shared/stores/uiStore";
import { supabase } from "../../utils/supabase";
import { useAuth } from "../app/providers/AuthProvider";
import { useTheme } from "../app/providers/ThemeProvider";
import styles from "./TopBar.module.css";

export const TopBar = () => {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const triggerTimerReset = useUIStore((state) => state.triggerTimerReset);
  const { profile } = useProfile();

  const handleLogout = async () => {
    triggerTimerReset();
    await supabase.auth.signOut();
  };

  let xpInCurrentLevel = 0;
  let xpRequiredForNext = 100;
  let progressPct = 0;

  if (profile) {
    const baseXP = Math.pow(profile.level - 1, 2) * 100;
    const nextLevelXP = Math.pow(profile.level, 2) * 100;
    xpInCurrentLevel = profile.total_xp - baseXP;
    xpRequiredForNext = nextLevelXP - baseXP;
    progressPct = Math.min(
      100,
      Math.max(0, (xpInCurrentLevel / xpRequiredForNext) * 100),
    );
  }

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <img src="images/favicon_1.png" alt="Logo" className={styles.logo} />
        <div className={styles.brandText}>
          <span className={styles.brandLabel}>Focus</span>
          <span className={styles.brandMeta}>Developer cockpit</span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.themeControl}>
          <select
            id="theme-switcher"
            className={styles.select}
            value={theme}
            onChange={(event) =>
              setTheme(event.target.value as "cyber-dark" | "classic")
            }
          >
            <option value="cyber-dark">Cyber-Dark</option>
            <option value="classic">Classic</option>
          </select>
        </div>

        {!loading &&
          (user ? (
            <div className={styles.userArea}>
              {profile && (
                <div className={styles.xpBlock}>
                  <div className={styles.xpHeader}>
                    <span className={styles.level}>Lvl {profile.level}</span>
                    <span className={styles.xpMeta}>
                      {xpInCurrentLevel} / {xpRequiredForNext} XP
                    </span>
                  </div>
                  <div className={styles.xpBar}>
                    <div
                      className={styles.xpFill}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              <div className={styles.avatar} title={user.email}>
                {user.email?.[0]?.toUpperCase() || "?"}
              </div>

              <button
                type="button"
                className={styles.button}
                onClick={() => void handleLogout()}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={() => setAuthModalOpen(true)}
            >
              Login
            </button>
          ))}
      </div>
    </header>
  );
};
