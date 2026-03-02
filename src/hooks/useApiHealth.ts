import { useEffect, useRef, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { apiHealthTracker, type ApiHealthStatus } from "@/lib/api-wrapper";

/**
 * Subscribe to the API health tracker and surface a "Slow connection" toast
 * when requests are consistently delayed.
 *
 * Returns the current {@link ApiHealthStatus} so components can also render
 * inline indicators if desired (e.g. a badge or progress bar).
 *
 * @example
 * ```tsx
 * function AppShell() {
 *   const { isSlowConnection, avgLatencyMs } = useApiHealth();
 *   return isSlowConnection ? <SlowBanner latency={avgLatencyMs} /> : null;
 * }
 * ```
 */
export function useApiHealth(): ApiHealthStatus {
  const status = useSyncExternalStore(
    apiHealthTracker.subscribe,
    apiHealthTracker.getSnapshot,
    apiHealthTracker.getSnapshot, // SSR snapshot (same for SPA)
  );

  // Show a warning toast once when the connection transitions to "slow".
  // When it recovers, show a success toast and reset so future slowdowns
  // trigger the warning again.
  const wasSlowRef = useRef(false);

  useEffect(() => {
    if (status.isSlowConnection && !wasSlowRef.current) {
      toast.warning(
        "Slow connection detected — requests may take longer than usual.",
        { id: "api-health-slow", duration: 6_000 },
      );
    }

    if (!status.isSlowConnection && wasSlowRef.current) {
      toast.success("Connection recovered.", {
        id: "api-health-recovered",
        duration: 3_000,
      });
    }

    wasSlowRef.current = status.isSlowConnection;
  }, [status.isSlowConnection]);

  return status;
}
