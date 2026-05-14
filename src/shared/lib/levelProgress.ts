export type LevelProgress = {
  xpInCurrentLevel: number;
  xpRequiredForNext: number;
  progressPct: number;
};

export function getLevelProgress(totalXp: number, level: number): LevelProgress {
  const safeLevel = Math.max(1, level);
  const baseXp = Math.pow(safeLevel - 1, 2) * 100;
  const nextLevelXp = Math.pow(safeLevel, 2) * 100;
  const xpInCurrentLevel = Math.max(0, totalXp - baseXp);
  const xpRequiredForNext = Math.max(1, nextLevelXp - baseXp);
  const progressPct = Math.min(
    100,
    Math.max(0, (xpInCurrentLevel / xpRequiredForNext) * 100),
  );

  return {
    xpInCurrentLevel,
    xpRequiredForNext,
    progressPct,
  };
}
