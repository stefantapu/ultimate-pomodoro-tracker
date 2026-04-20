import {
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  getLocalISODate,
  shiftISODate,
  useInfographics,
  type HourlyDistribution,
  type InfographicsPeriodBucket,
  type InfographicsPeriodMode,
} from "@shared/hooks/useInfographics";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import { useAuth } from "@app/providers/useAuth";

function formatHours(seconds: number) {
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  }

  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatBucketDate(isoDate: string) {
  const [, month, day] = isoDate.split("-");
  return `${Number(day)}/${Number(month)}`;
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="history-dashboard__summary-card">
      <span className="history-dashboard__summary-label">{label}</span>
      <span className="history-dashboard__summary-value">{value}</span>
    </div>
  );
}

function getPeriodShiftDate(
  isoDate: string,
  periodMode: InfographicsPeriodMode,
  direction: -1 | 1,
) {
  if (periodMode === "year") {
    const [year, month, day] = isoDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setFullYear(date.getFullYear() + direction);

    return getLocalISODate(date);
  }

  if (periodMode === "month") {
    const [year, month] = isoDate.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + direction);

    return getLocalISODate(date);
  }

  return shiftISODate(isoDate, direction * 7);
}

function getPeriodTitle(periodMode: InfographicsPeriodMode) {
  if (periodMode === "year") return "Year in focus";
  if (periodMode === "month") return "Month in focus";

  return "Week in focus";
}

function getThisPeriodLabel(periodMode: InfographicsPeriodMode) {
  if (periodMode === "year") return "This year";
  if (periodMode === "month") return "This month";

  return "This week";
}

function PeriodBarChart({
  buckets,
}: {
  buckets: InfographicsPeriodBucket[];
}) {
  const maxFocus = Math.max(...buckets.map((bucket) => bucket.focus_seconds), 1);

  return (
    <div className="history-dashboard__week-chart" aria-label="Focus period chart">
      {buckets.map((bucket) => {
        const height = Math.max(6, (bucket.focus_seconds / maxFocus) * 100);

        return (
          <div className="history-dashboard__week-day" key={bucket.date}>
            <div className="history-dashboard__week-bar-frame">
              <div
                className="history-dashboard__week-bar"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="history-dashboard__week-value">
              {formatHours(bucket.focus_seconds)}
            </span>
            <span className="history-dashboard__week-label">
              {bucket.label}
            </span>
            <span className="history-dashboard__week-date">
              {formatBucketDate(bucket.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HourlyHistogram({ items }: { items: HourlyDistribution[] }) {
  const actualMaxFocus = Math.max(...items.map((item) => item.focus_seconds), 0);
  const scaledMaxFocus = Math.max(actualMaxFocus, 1);
  const yAxisLabels = [
    actualMaxFocus > 0 ? formatHours(actualMaxFocus) : "0m",
    actualMaxFocus > 0 ? formatHours(actualMaxFocus / 2) : "0m",
    "0",
  ];

  return (
    <div className="history-dashboard__hourly-scroll">
      <div
        className="history-dashboard__hourly-chart"
        aria-label="Daily rhythm histogram by start hour"
      >
        <div className="history-dashboard__hourly-axis" aria-hidden="true">
          {yAxisLabels.map((label, index) => (
            <span
              className="history-dashboard__hourly-axis-label"
              key={`${label}-${index}`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="history-dashboard__hourly-plot">
          <div className="history-dashboard__hourly-guides" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="history-dashboard__hourly-bars">
            {items.map((item) => {
              const height =
                item.focus_seconds === 0
                  ? 0
                  : Math.max(8, (item.focus_seconds / scaledMaxFocus) * 100);

              return (
                <div className="history-dashboard__hourly-column" key={item.hour}>
                  <div
                    className="history-dashboard__hourly-bar-frame"
                    title={`${String(item.hour).padStart(2, "0")}:00 - ${formatHours(item.focus_seconds)}`}
                    aria-label={`${String(item.hour).padStart(2, "0")}:00, ${formatHours(item.focus_seconds)} of focus`}
                  >
                    <div
                      className="history-dashboard__hourly-bar"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="history-dashboard__hourly-label">{item.hour}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getRhythmDescription(periodMode: InfographicsPeriodMode) {
  if (periodMode === "year") return "Selected year by start hour";
  if (periodMode === "month") return "Selected month by start hour";

  return "Selected week by start hour";
}

function SummaryGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <section
      className="history-dashboard__summary-grid"
      aria-label="Focus summary"
    >
      {items.map((item) => (
        <SummaryCard
          key={item.label}
          label={item.label}
          value={item.value}
        />
      ))}
    </section>
  );
}

export function InfographicsModal() {
  const { user } = useAuth();
  const todayISO = useMemo(() => getLocalISODate(new Date()), []);
  const [anchorDate, setAnchorDate] = useState(todayISO);
  const [periodMode, setPeriodMode] = useState<InfographicsPeriodMode>("week");
  const { data, loading, error } = useInfographics(anchorDate, periodMode);
  const isOpen = useUIStore((state) => state.isInfographicsModalOpen);
  const setInfographicsModalOpen = useUIStore(
    (state) => state.setInfographicsModalOpen,
  );
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );

  if (!isOpen) {
    return null;
  }

  const closeModal = () => setInfographicsModalOpen(false);
  const canGoForward = data ? data.focus_period.end_date < todayISO : false;
  const summaryItems = data
    ? [
        {
          label: "Today focus",
          value: formatHours(data.summary.today_focus_time),
        },
        {
          label: "This week",
          value: formatHours(data.summary.current_week_focus_time),
        },
        {
          label: "Cycles",
          value: formatCount(data.summary.completed_cycles_count),
        },
        {
          label: "Interrupted",
          value: formatHours(data.summary.interrupted_focus_time),
        },
        {
          label: "Streak",
          value: `${data.summary.current_streak}d`,
        },
        {
          label: "Active days",
          value: `${data.summary.active_days}`,
        },
        {
          label: "Total focus",
          value: formatHours(data.summary.total_focus_time),
        },
      ]
    : [];

  const modal = (
    <div
      className={`history-dashboard__overlay history-dashboard__overlay--${activeSkin.id}`}
      style={skinCssVariables}
      onClick={closeModal}
    >
      <div
        className="history-dashboard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-dashboard-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="history-dashboard__header">
          <div>
            <p className="history-dashboard__eyebrow">Archive</p>
            <h2 id="history-dashboard-title">History Dashboard</h2>
          </div>
          <button
            type="button"
            className="history-dashboard__close"
            onClick={closeModal}
            aria-label="Close history dashboard"
          >
            X
          </button>
        </header>

        {!user ? (
          <div className="history-dashboard__auth-state">
            Sign in to view your focus history.
          </div>
        ) : loading && !data ? (
          <div className="history-dashboard__auth-state">
            Loading focus history...
          </div>
        ) : error ? (
          <div className="history-dashboard__auth-state" role="alert">
            History dashboard could not be loaded.
          </div>
        ) : data ? (
          <div className="history-dashboard__body">
            <SummaryGrid items={summaryItems} />

            <section className="history-dashboard__panel history-dashboard__panel--wide">
              <div className="history-dashboard__panel-header">
                <div>
                  <h3>{getPeriodTitle(periodMode)}</h3>
                  <p>
                    {data.focus_period.start_date} - {data.focus_period.end_date}
                  </p>
                </div>
                <div className="history-dashboard__week-actions">
                  <div className="history-dashboard__period-tabs" role="group" aria-label="Focus period view">
                    {(["week", "month", "year"] as const).map((mode) => (
                      <button
                        type="button"
                        className={mode === periodMode ? "is-active" : ""}
                        key={mode}
                        onClick={() => {
                          setPeriodMode(mode);
                          setAnchorDate(todayISO);
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnchorDate((date) =>
                      getPeriodShiftDate(date, periodMode, -1),
                    )}
                  >
                    Prev
                  </button>
                  <button type="button" onClick={() => setAnchorDate(todayISO)}>
                    {getThisPeriodLabel(periodMode)}
                  </button>
                  <button
                    type="button"
                    disabled={!canGoForward}
                    onClick={() => setAnchorDate((date) =>
                      getPeriodShiftDate(date, periodMode, 1),
                    )}
                  >
                    Next
                  </button>
                </div>
              </div>
              <PeriodBarChart buckets={data.focus_period.buckets} />
            </section>

            <section className="history-dashboard__panel history-dashboard__panel--wide">
              <div className="history-dashboard__panel-header">
                <div>
                  <h3>Daily rhythm</h3>
                  <p>
                    {getRhythmDescription(periodMode)}{" "}
                    {data.focus_period.start_date} - {data.focus_period.end_date}
                  </p>
                </div>
              </div>
              <HourlyHistogram items={data.hourly_distribution} />
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
}
