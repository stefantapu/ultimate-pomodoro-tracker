import { memo } from "react";
import { useProfile } from "@shared/hooks/useProfile";
import { getLevelProgress } from "@shared/lib/levelProgress";
import { PanelShell } from "./PanelShell";

export const DragonCard = memo(function DragonCard() {
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
});
