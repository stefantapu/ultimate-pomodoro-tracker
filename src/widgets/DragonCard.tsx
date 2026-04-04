import { useProfile } from "@shared/hooks/useProfile";
import { PanelShell } from "./PanelShell";

function getLevelProgress(totalXp: number, level: number) {
  const baseXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const xpInCurrentLevel = totalXp - baseXp;
  const xpRequiredForNext = nextLevelXp - baseXp;
  const progressPct =
    xpRequiredForNext === 0
      ? 0
      : Math.min(
          100,
          Math.max(0, (xpInCurrentLevel / xpRequiredForNext) * 100),
        );

  return {
    xpInCurrentLevel,
    xpRequiredForNext,
    progressPct,
  };
}

export function DragonCard() {
  const { profile } = useProfile();
  const level = profile?.level ?? 1;
  const totalXp = profile?.total_xp ?? 0;
  const { xpInCurrentLevel, xpRequiredForNext, progressPct } = getLevelProgress(
    totalXp,
    level,
  );

  return (
    <PanelShell className="dragon-card">
      <div className="dragon-card__display">Lvl {profile ? level : "--"}</div>
      <div className="dragon-card__level-row">
        <span className="dragon-card__level-value">
          {profile ? `${xpInCurrentLevel} / ${xpRequiredForNext} XP` : "--"}
        </span>
      </div>
      <div className="dragon-card__progress">
        <div
          className="dragon-card__progress-fill"
          style={{ width: `${profile ? progressPct : 0}%` }}
        />
      </div>
    </PanelShell>
  );
}
