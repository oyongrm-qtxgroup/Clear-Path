import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logError } from "./sentry";

// ---------------------------------------------------------------------------
// Network-error detection
// ---------------------------------------------------------------------------
function isNetworkError(error: unknown): boolean {
  if (
    error instanceof TypeError &&
    /failed to fetch|network/i.test(error.message)
  )
    return true;
  if (
    error instanceof Error &&
    /network|offline|ERR_INTERNET_DISCONNECTED/i.test(error.message)
  )
    return true;
  return !navigator.onLine;
}

// ---------------------------------------------------------------------------
// Persistent "connection issue" toast — auto-dismissed when back online
// ---------------------------------------------------------------------------
const NETWORK_TOAST_ID = "network-error";
let networkToastActive = false;

function showNetworkToast() {
  if (networkToastActive) return;
  networkToastActive = true;

  toast.error("Connection issue — retrying…", {
    id: NETWORK_TOAST_ID,
    duration: Infinity,
  });

  const handleOnline = () => {
    toast.dismiss(NETWORK_TOAST_ID);
    networkToastActive = false;
    window.removeEventListener("online", handleOnline);
  };

  window.addEventListener("online", handleOnline);
}

// ---------------------------------------------------------------------------
// Tiered caching presets
// ---------------------------------------------------------------------------

/** Tier 1 — Near real-time (dashboard summary, current-month payment checks). */
export const CACHE_TIER_1 = {
  staleTime: 0,
  gcTime: 1000 * 60 * 1, // 1 minute
  refetchOnWindowFocus: true,
} as const;

/** Tier 2 — Short cache (debt list, expense list). Default tier. */
export const CACHE_TIER_2 = {
  staleTime: 1000 * 60 * 2, // 2 minutes
  gcTime: 1000 * 60 * 10, // 10 minutes
} as const;

/** Tier 3 — Long cache (savings goals, user profile / settings). */
export const CACHE_TIER_3 = {
  staleTime: 1000 * 60 * 10, // 10 minutes
  gcTime: 1000 * 60 * 30, // 30 minutes
} as const;

// ---------------------------------------------------------------------------
// QueryClient singleton
// ---------------------------------------------------------------------------
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default = Tier 2 (short cache)
      ...CACHE_TIER_2,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000), // exponential backoff, max 30 s
    },
    mutations: {
      retry: 1,
    },
  },
});

// Attach global error handlers via the query cache / mutation cache
queryClient.getQueryCache().config.onError = (error, query) => {
  logError(error, { queryKey: query.queryKey });

  if (isNetworkError(error)) {
    showNetworkToast();
  }
};

queryClient.getMutationCache().config.onError = (
  error,
  variables,
  _context,
  mutation,
) => {
  logError(error, {
    mutationKey: mutation.options.mutationKey,
    variables,
  });

  if (isNetworkError(error)) {
    showNetworkToast();
  }
};
