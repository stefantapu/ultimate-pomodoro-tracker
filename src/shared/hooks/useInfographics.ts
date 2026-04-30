import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/useAuth";
import { useUIStore } from "../stores/uiStore";

export type InfographicsSummary = {
  today_focus_time: number;
  current_week_focus_time: number;
  completed_cycles_count: number;
  total_focus_time: number;
  current_streak: number;
  active_days: number;
};

export type InfographicsPeriodMode = "week" | "month" | "year";

export type InfographicsPeriodBucket = {
  date: string;
  label: string;
  focus_seconds: number;
  break_seconds: number;
  completed_cycles: number;
};

export type InfographicsFocusPeriod = {
  mode: InfographicsPeriodMode;
  start_date: string;
  end_date: string;
  buckets: InfographicsPeriodBucket[];
};

export type HourlyDistribution = {
  hour: number;
  focus_seconds: number;
};

export type InfographicsData = {
  summary: InfographicsSummary;
  focus_period: InfographicsFocusPeriod;
  hourly_distribution: HourlyDistribution[];
};

function getLocalTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function getLocalISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function shiftISODate(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return getLocalISODate(date);
}

export function useInfographics(
  anchorDate: string,
  periodMode: InfographicsPeriodMode,
) {
  const { user } = useAuth();
  const analyticsCounter = useUIStore((state) => state.analyticsCounter);
  const [data, setData] = useState<InfographicsData | null>(null);
  const [dataUserId, setDataUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchInfographics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();
      const { data: result, error: rpcError } = await supabase.rpc(
        "get_user_infographics",
        {
          target_user_id: user.id,
          anchor_date: anchorDate,
          target_timezone: getLocalTimezone(),
          period_mode: periodMode,
        },
      );

      if (rpcError) throw rpcError;

      setData(result as InfographicsData);
      setDataUserId(user.id);
    } catch (error: unknown) {
      console.error("Failed to fetch infographics", error);
      setError(
        error instanceof Error
          ? error
          : new Error("Failed to fetch infographics"),
      );
    } finally {
      setLoading(false);
    }
  }, [anchorDate, periodMode, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    queueMicrotask(() => {
      void fetchInfographics();
    });
  }, [analyticsCounter, fetchInfographics, user]);

  return {
    data: user && dataUserId === user.id ? data : null,
    loading: user ? loading : false,
    error: user ? error : null,
    fetchInfographics,
  };
}
