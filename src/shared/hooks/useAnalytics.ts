import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/useAuth";
import { useUIStore } from "../stores/uiStore";

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
  const { user } = useAuth();
  const analyticsCounter = useUIStore((state) => state.analyticsCounter);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dataUserId, setDataUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: rpcError } = await supabase.rpc(
        "get_user_analytics",
        { target_user_id: user.id },
      );

      if (rpcError) throw rpcError;
      setData(result as AnalyticsData);
      setDataUserId(user.id);
    } catch (error: unknown) {
      console.error("Failed to fetch analytics", error);
      setError(
        error instanceof Error
          ? error
          : new Error("Failed to fetch analytics"),
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    queueMicrotask(() => {
      void fetchAnalytics();
    });
  }, [analyticsCounter, fetchAnalytics, user]);

  return {
    data: user && dataUserId === user.id ? data : null,
    loading: user ? loading : false,
    error: user ? error : null,
    fetchAnalytics,
  };
}
