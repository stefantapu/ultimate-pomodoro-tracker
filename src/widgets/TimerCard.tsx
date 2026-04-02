import type { Mode, TimerStatus } from "@shared/lib/timerTypes";
import { memo, useEffect, useState } from "react";
import { PanelShell } from "./PanelShell";

type TimerCardProps = {
  mode: Mode;
  status: TimerStatus;
  timeLeft: number;
  targetTimestamp: number | null;
};

function formatTime(seconds: number) {
  const normalized = Math.max(0, seconds);
  const minutes = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const secondsDisplay = (normalized % 60).toString().padStart(2, "0");
  return `${minutes}:${secondsDisplay}`;
}

const TimerCardTime = memo(function TimerCardTime({
  status,
  timeLeft,
  targetTimestamp,
}: {
  status: TimerStatus;
  timeLeft: number;
  targetTimestamp: number | null;
}) {
  const [timeLabel, setTimeLabel] = useState(() => formatTime(timeLeft));

  useEffect(() => {
    const computeRemaining = () => {
      if (status !== "running" || !targetTimestamp) {
        return timeLeft;
      }

      return Math.max(0, Math.round((targetTimestamp - Date.now()) / 1000));
    };

    const applyNextLabel = () => {
      setTimeLabel(formatTime(computeRemaining()));
    };

    applyNextLabel();

    if (status !== "running" || !targetTimestamp) {
      return;
    }

    const intervalId = window.setInterval(applyNextLabel, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status, targetTimestamp, timeLeft]);

  return <div className="timer-card__time">{timeLabel}</div>;
});

export const TimerCard = memo(function TimerCard({
  status,
  timeLeft,
  targetTimestamp,
}: TimerCardProps) {
  return (
    <PanelShell className="timer-card">
      <TimerCardTime
        status={status}
        timeLeft={timeLeft}
        targetTimestamp={targetTimestamp}
      />
    </PanelShell>
  );
});
