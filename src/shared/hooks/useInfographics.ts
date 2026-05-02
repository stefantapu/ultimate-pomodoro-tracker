import { useCallback } from "react";
import {
  useAuthenticatedResource,
  type AuthenticatedResourceLoader,
} from "./useAuthenticatedResource";

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
  const loadInfographics =
    useCallback<AuthenticatedResourceLoader<InfographicsData>>(
      async ({ supabase, user }) => {
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

      return result as InfographicsData;
    },
    [anchorDate, periodMode],
  );
  const infographics = useAuthenticatedResource<InfographicsData>({
    load: loadInfographics,
    errorMessage: "Failed to fetch infographics",
    logMessage: "Failed to fetch infographics",
    refreshOnAnalytics: true,
    refreshKey: `${anchorDate}:${periodMode}`,
  });

  return {
    data: infographics.data,
    loading: infographics.loading,
    error: infographics.error,
    fetchInfographics: infographics.refetch,
  };
}
