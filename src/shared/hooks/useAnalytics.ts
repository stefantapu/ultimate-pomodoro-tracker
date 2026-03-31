import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/AuthProvider";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    // Only attempt if authenticated
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: rpcError } = await supabase.rpc(
        "get_user_analytics",
        { target_user_id: user.id }
      );
      if (rpcError) throw rpcError;
      setData(result as AnalyticsData);
    } catch (e: any) {
      console.error("Failed to fetch analytics", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, fetchAnalytics, analyticsCounter]);

  return { data, loading, error, fetchAnalytics };
}
