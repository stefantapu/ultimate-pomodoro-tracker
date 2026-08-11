import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  useDailyFocusSessions,
  type DailyFocusSession,
} from "@shared/hooks/useDailyFocusSessions";
import type { Mode, TimerStatus } from "@shared/lib/timerTypes";
import type { SkinId } from "@shared/skins/types";

const HOUR_LABELS = [0, 6, 9, 12, 15, 18, 24];
const SECONDARY_HOUR_LABELS = new Set([9, 15]);

function getLocalDayBounds(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  return { start, end };
}

function formatLocalTime(now: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

function getHourPosition(hour: number, dayStart: Date, dayEnd: Date) {
  const hourTimestamp = new Date(
    dayStart.getFullYear(),
    dayStart.getMonth(),
    dayStart.getDate(),
    hour,
  ).getTime();

  return (
    ((hourTimestamp - dayStart.getTime()) /
      (dayEnd.getTime() - dayStart.getTime())) *
    100
  );
}

type DailySessionTimelineProps = {
  mode: Mode;
  recentSessions: Array<DailyFocusSession & { userId: string }>;
  sessionStartedAt: string | null;
  skinId: SkinId;
  status: TimerStatus;
};

type TimelineSession = Pick<
  DailyFocusSession,
  "id" | "mode" | "started_at" | "finished_at"
>;

type SessionSegmentProps = {
  dayEnd: number;
  dayStart: number;
  isActive?: boolean;
  session: TimelineSession;
};

function SessionSegment({
  dayEnd,
  dayStart,
  isActive = false,
  session,
}: SessionSegmentProps) {
  if (session.mode !== "focus") {
    return null;
  }

  const sessionStart = new Date(session.started_at).getTime();
  const sessionEnd = new Date(session.finished_at).getTime();

  if (!Number.isFinite(sessionStart) || !Number.isFinite(sessionEnd)) {
    return null;
  }

  const clippedStart = Math.max(dayStart, sessionStart);
  const clippedEnd = Math.min(dayEnd, sessionEnd);

  if (
    clippedStart > dayEnd ||
    clippedEnd < dayStart ||
    clippedEnd < clippedStart ||
    (!isActive && clippedEnd === clippedStart)
  ) {
    return null;
  }

  const dayDuration = dayEnd - dayStart;

  return (
    <span
      aria-label={`Focus session${isActive ? ", active" : ""}`}
      className={`daily-session-timeline__segment${
        isActive ? " daily-session-timeline__segment--active" : ""
      }`}
      data-active={String(isActive)}
      data-mode="focus"
      data-session-id={session.id}
      data-testid="timeline-session-segment"
      role="img"
      style={{
        left: `${((clippedStart - dayStart) / dayDuration) * 100}%`,
        minWidth: isActive ? "4px" : undefined,
        width: `${((clippedEnd - clippedStart) / dayDuration) * 100}%`,
      }}
    />
  );
}

export function DailySessionTimeline({
  mode,
  recentSessions,
  sessionStartedAt,
  skinId,
  status,
}: DailySessionTimelineProps) {
  const [now, setNow] = useState(() => new Date());
  const { start, end } = useMemo(() => getLocalDayBounds(now), [now]);
  const currentPosition =
    ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) *
    100;
  const currentTimeEdge =
    currentPosition < 3 ? "start" : currentPosition > 97 ? "end" : "middle";
  const { sessions, userId } = useDailyFocusSessions(start, end);
  const activeStartedAt =
    userId && mode === "focus" && status === "running"
      ? sessionStartedAt
      : null;

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const persistedStarts = new Set(
    sessions
      .filter((session) => session.mode === "focus")
      .map((session) => session.started_at),
  );
  const visibleSessions = [
    ...sessions.filter((session) => session.mode === "focus"),
    ...recentSessions.filter(
      (session) =>
        session.mode === "focus" &&
        session.userId === userId &&
        !persistedStarts.has(session.started_at),
    ),
  ];
  const activeSession = activeStartedAt
    ? {
        id: `active-${activeStartedAt}`,
        mode: "focus" as const,
        started_at: activeStartedAt,
        finished_at: now.toISOString(),
      }
    : null;

  return (
    <div
      aria-label="Today's focus session timeline"
      className="daily-session-timeline"
      data-running={String(status === "running")}
      data-skin={skinId}
      role="group"
      style={{ "--timeline-now": `${currentPosition}%` } as CSSProperties}
    >
      <div className="daily-session-timeline__current-time-row">
        <time
          className="daily-session-timeline__current-time"
          data-edge={currentTimeEdge}
          dateTime={now.toISOString()}
          style={
            currentTimeEdge === "start"
              ? { left: 0 }
              : currentTimeEdge === "end"
                ? { right: 0 }
                : { left: `${currentPosition}%` }
          }
        >
          {formatLocalTime(now)}
        </time>
      </div>
      <div className="daily-session-timeline__track">
        {visibleSessions.map((session) => (
          <SessionSegment
            dayEnd={end.getTime()}
            dayStart={start.getTime()}
            key={session.id}
            session={session}
          />
        ))}
        {activeSession ? (
          <SessionSegment
            dayEnd={end.getTime()}
            dayStart={start.getTime()}
            isActive
            key={activeSession.id}
            session={activeSession}
          />
        ) : null}
        <span
          aria-hidden="true"
          className="daily-session-timeline__now-marker"
          data-testid="timeline-now-marker"
          style={{ left: `${currentPosition}%` }}
        />
      </div>
      <div className="daily-session-timeline__labels" aria-hidden="true">
        {HOUR_LABELS.map((hour) => (
          <span
            className={
              SECONDARY_HOUR_LABELS.has(hour)
                ? "daily-session-timeline__label--secondary"
                : undefined
            }
            data-testid="timeline-hour-label"
            key={hour}
            style={{ left: `${getHourPosition(hour, start, end)}%` }}
          >
            {String(hour).padStart(2, "0")}
          </span>
        ))}
      </div>
    </div>
  );
}
