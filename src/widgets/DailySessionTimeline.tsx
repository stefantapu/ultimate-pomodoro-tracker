import { useEffect, useMemo, useRef, useState } from "react";
import {
  useDailyFocusSessions,
  type DailyFocusSession,
} from "@shared/hooks/useDailyFocusSessions";
import type { Mode, TimerStatus } from "@shared/lib/timerTypes";
import type { SkinId } from "@shared/skins/types";

const HOUR_LABELS = [0, 6, 12, 18, 21];
const LABELED_HOURS = new Set(HOUR_LABELS);

function getLocalDayBounds(now: Date) {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
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
  prefersReducedMotion?: boolean;
  session: TimelineSession;
};

function SessionSegment({
  dayEnd,
  dayStart,
  isActive = false,
  prefersReducedMotion = false,
  session,
}: SessionSegmentProps) {
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
  const modeLabel = session.mode === "focus" ? "Focus" : "Break";

  return (
    <span
      aria-label={`${modeLabel} session${isActive ? ", active" : ""}`}
      className={`daily-session-timeline__segment daily-session-timeline__segment--${session.mode}${isActive ? " daily-session-timeline__segment--active" : ""}`}
      data-active={String(isActive)}
      data-mode={session.mode}
      data-motion={
        isActive ? (prefersReducedMotion ? "reduced" : "full") : undefined
      }
      data-session-id={session.id}
      data-testid="timeline-session-segment"
      role="img"
      style={{
        left: `${((clippedStart - dayStart) / dayDuration) * 100}%`,
        minWidth: isActive ? "3px" : undefined,
        width: `${((clippedEnd - clippedStart) / dayDuration) * 100}%`,
      }}
    >
      {isActive ? (
        <span aria-hidden="true" className="daily-session-timeline__wave" />
      ) : null}
    </span>
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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLegendPinned, setIsLegendPinned] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const { start, end } = useMemo(() => getLocalDayBounds(now), [now]);
  const currentPosition =
    ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) *
    100;
  const currentTimeEdge =
    currentPosition < 3 ? "start" : currentPosition > 97 ? "end" : "middle";
  const { sessions, userId } = useDailyFocusSessions(start, end);
  const activeStartedAt =
    userId && status === "running" ? sessionStartedAt : null;
  const isLegendVisible = isHovered || isFocused || isLegendPinned;

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    handleChange();

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const dismissLegend = (event: PointerEvent) => {
      if (timelineRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsLegendPinned(false);
    };

    document.addEventListener("pointerdown", dismissLegend);
    return () => document.removeEventListener("pointerdown", dismissLegend);
  }, []);

  const persistedStarts = new Set(
    sessions.map((session) => session.started_at),
  );
  const visibleSessions = [
    ...sessions,
    ...recentSessions.filter(
      (session) =>
        session.userId === userId &&
        !persistedStarts.has(session.started_at),
    ),
  ];
  const activeSession = activeStartedAt
    ? {
        id: `active-${activeStartedAt}`,
        mode,
        started_at: activeStartedAt,
        finished_at: now.toISOString(),
      }
    : null;

  return (
    <div
      aria-controls="daily-session-timeline-legend"
      aria-describedby={
        isLegendVisible ? "daily-session-timeline-legend" : undefined
      }
      aria-expanded={isLegendVisible}
      aria-label="Today's focus session timeline"
      className="daily-session-timeline"
      data-skin={skinId}
      onBlur={() => setIsFocused(false)}
      onClick={() => setIsLegendPinned((isPinned) => !isPinned)}
      onFocus={() => setIsFocused(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setIsLegendPinned((isPinned) => !isPinned);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={timelineRef}
      role="group"
      tabIndex={0}
    >
      {isLegendVisible ? (
        <div
          className="daily-session-timeline__legend"
          id="daily-session-timeline-legend"
          role="tooltip"
        >
          <span>
            <span
              aria-hidden="true"
              className="daily-session-timeline__legend-swatch daily-session-timeline__legend-swatch--focus"
            />
            Focus
          </span>
          <span>
            <span
              aria-hidden="true"
              className="daily-session-timeline__legend-swatch daily-session-timeline__legend-swatch--break"
            />
            Break
          </span>
        </div>
      ) : null}
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
            prefersReducedMotion={prefersReducedMotion}
            session={activeSession}
          />
        ) : null}
        {Array.from({ length: 24 }, (_, hour) => (
          <span
            className={
              LABELED_HOURS.has(hour)
                ? "daily-session-timeline__division daily-session-timeline__division--major"
                : "daily-session-timeline__division"
            }
            data-testid="timeline-hour-division"
            data-hour={hour}
            key={hour}
            style={{ left: `${getHourPosition(hour, start, end)}%` }}
          />
        ))}
        <span
          aria-hidden="true"
          className="daily-session-timeline__now-marker"
          style={{ left: `${currentPosition}%` }}
        />
      </div>
      <div className="daily-session-timeline__labels" aria-hidden="true">
        {HOUR_LABELS.map((hour) => (
          <span
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
