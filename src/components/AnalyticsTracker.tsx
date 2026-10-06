import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent, trackPageView } from "../lib/gtm";

/**
 * SPA pageview + route-based product events for public marketing routes.
 * Does not run for authenticated app routes with private data.
 */
export function AnalyticsTracker() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;
    trackPageView(path);

    if (path === "/plus") trackEvent("plus_viewed", { surface: "public" });
    if (path === "/pricing") trackEvent("pricing_viewed", { surface: "public" });
  }, [location.pathname]);

  return null;
}
