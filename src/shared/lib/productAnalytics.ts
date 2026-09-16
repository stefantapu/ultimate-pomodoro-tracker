export type ProductAnalyticsEvent =
  | { name: "seo_cta_click"; source: "homepage_cta" }
  | { name: "timer_start"; source: "primary_timer_control" }
  | {
      name: "signup_start";
      source: "profile_control" | "locked_feature";
    };

export function trackProductEvent(event: ProductAnalyticsEvent) {
  void import("@vercel/analytics")
    .then(({ track }) => {
      track(event.name, { source: event.source });
    })
    .catch(() => {
      // Analytics must never interrupt the product action that produced the event.
    });
}
