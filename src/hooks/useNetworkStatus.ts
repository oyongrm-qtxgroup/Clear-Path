import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { WifiOff } from "lucide-react";
import { createElement } from "react";
import { queryClient } from "@/lib/queryClient";

// ---------------------------------------------------------------------------
// External-store helpers for navigator.onLine
// ---------------------------------------------------------------------------
function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true; // assume online during SSR
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const OFFLINE_TOAST_ID = "network-offline";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Tracks browser online/offline status.
 *
 * - Shows a persistent sonner toast when the device goes offline.
 * - Dismisses the toast and triggers React Query `refetchOnReconnect`
 *   when connectivity is restored.
 */
export function useNetworkStatus() {
  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!isOnline) {
      toast.error("You are offline", {
        id: OFFLINE_TOAST_ID,
        duration: Infinity,
        icon: createElement(WifiOff, { className: "size-4" }),
        description: "Some features may be unavailable until you reconnect.",
      });
    } else {
      // Dismiss the offline toast when back online
      toast.dismiss(OFFLINE_TOAST_ID);

      // Tell React Query to refetch active queries (mirrors refetchOnReconnect)
      queryClient.resumePausedMutations().then(() => {
        void queryClient.invalidateQueries();
      });
    }
  }, [isOnline]);

  return { isOnline } as const;
}
