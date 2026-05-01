import { useCallback } from "react";
import {
  useAuthenticatedResource,
  type AuthenticatedResourceLoader,
} from "./useAuthenticatedResource";

export type HeatmapData = {
  date: string;
  value: number;
};

export type AnalyticsData = {
  today_focus_time: number;
  today_break_time: number;
  focus_cycles_count: number;
  current_streak: number;
  heatmap_data: HeatmapData[];
};

export function useAnalytics() {
  const loadAnalytics = useCallback<AuthenticatedResourceLoader<AnalyticsData>>(
  async ({ supabase, user }) => {
    const { data: result, error: rpcError } = await supabase.rpc(
      "get_user_analytics",
      { target_user_id: user.id },
    );

    if (rpcError) {
      throw rpcError;
    }

    return result as AnalyticsData;
  }, []);
  const analytics = useAuthenticatedResource<AnalyticsData>({
    load: loadAnalytics,
    errorMessage: "Failed to fetch analytics",
    logMessage: "Failed to fetch analytics",
    refreshOnAnalytics: true,
  });

  return {
    data: analytics.data,
    loading: analytics.loading,
    error: analytics.error,
    fetchAnalytics: analytics.refetch,
  };
}
