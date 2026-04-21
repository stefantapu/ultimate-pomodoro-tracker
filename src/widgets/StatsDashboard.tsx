import { memo } from "react";
import { useAnalytics } from "@shared/hooks/useAnalytics";
import { HeatmapCard } from "./HeatmapCard";
import { StatsCard } from "./StatsCard";

export const AuthenticatedAnalyticsPanels = memo(
  function AuthenticatedAnalyticsPanels() {
    const analytics = useAnalytics();

    return (
      <>
        <div className="dashboard-lock-wrap dashboard-lock-wrap--heatmap">
          <HeatmapCard
            heatmapData={analytics.data?.heatmap_data ?? []}
            loading={analytics.loading}
          />
        </div>

        <div className="dashboard-lock-wrap dashboard-lock-wrap--stats">
          <StatsCard data={analytics.data} loading={analytics.loading} />
        </div>
      </>
    );
  },
);
