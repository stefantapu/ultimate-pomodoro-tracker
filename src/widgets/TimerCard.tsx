import type { Mode, TimerStatus } from "@shared/lib/timerTypes";
import { useSkinStore } from "@shared/stores/skinStore";
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

function formatDuration(seconds: number) {
  const normalized = Math.max(0, seconds);
  const minutes = Math.floor(normalized / 60);
  const secondsDisplay = normalized % 60;
  return `PT${minutes}M${secondsDisplay}S`;
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
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, timeLeft),
  );
  const timeLabel = formatTime(remainingSeconds);

  useEffect(() => {
    const computeRemaining = () => {
      if (status !== "running" || !targetTimestamp) {
        return Math.max(0, timeLeft);
      }

      return Math.max(0, Math.round((targetTimestamp - Date.now()) / 1000));
    };

    const applyNextLabel = () => {
      setRemainingSeconds(computeRemaining());
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

  return (
    <time className="timer-card__time" dateTime={formatDuration(remainingSeconds)}>
      <span className="visually-hidden">{timeLabel}</span>
      {timeLabel.split("").map((character, index) => (
        <span
          key={`${character}-${index}`}
          aria-hidden="true"
          className={
            character === ":" ? "timer-card__separator" : "timer-card__digit"
          }
        >
          {character}
        </span>
      ))}
    </time>
  );
});

export const TimerCard = memo(function TimerCard({
  status,
  timeLeft,
  targetTimestamp,
}: TimerCardProps) {
  const timerPanel = useSkinStore((state) => state.activeSkin.assets.timerPanel);
  const timerPanelMobile = useSkinStore(
    (state) => state.activeSkin.assets.timerPanelMobile,
  );

  return (
    <PanelShell className={`timer-card${status === "running" ? " is-running" : ""}`}>
      {timerPanel ? (
        <picture className="timer-card__panel-art" aria-hidden="true">
          {timerPanelMobile ? (
            <source
              media="(max-width: 640px)"
              srcSet={timerPanelMobile.src}
              width={timerPanelMobile.width}
              height={timerPanelMobile.height}
            />
          ) : null}
          <img
            alt=""
            className="timer-card__panel-image"
            decoding="async"
            height={timerPanel.height}
            loading="eager"
            src={timerPanel.src}
            width={timerPanel.width}
          />
        </picture>
      ) : null}
      <TimerCardTime
        status={status}
        timeLeft={timeLeft}
        targetTimestamp={targetTimestamp}
      />
    </PanelShell>
  );
});
