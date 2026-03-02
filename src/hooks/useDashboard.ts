import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants";
import { fetchDashboardSummary } from "@/api/dashboard.api";
import { CACHE_TIER_1 } from "@/lib/queryClient";

/** Fetch the aggregated dashboard summary for the current user. (Tier 1) */
export function useDashboardSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.summary,
    queryFn: fetchDashboardSummary,
    ...CACHE_TIER_1,
  });
}
