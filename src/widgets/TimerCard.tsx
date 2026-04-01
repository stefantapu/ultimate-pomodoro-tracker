import type { Mode, TimerStatus } from "@shared/lib/timerTypes";
import { memo } from "react";
import { PanelShell } from "./PanelShell";

type TimerCardProps = {
  mode: Mode;
  status: TimerStatus;
  timeLabel: string;
};

export const TimerCard = memo(function TimerCard({
  mode,
  status,
  timeLabel,
}: TimerCardProps) {
  return (
    <PanelShell className="timer-card">
      <div className="timer-card__meta">
        <span>{mode}</span>
        <span>{status}</span>
      </div>
      <div className="timer-card__label">TIMER</div>
      <div className="timer-card__time">{timeLabel}</div>
    </PanelShell>
  );
});
