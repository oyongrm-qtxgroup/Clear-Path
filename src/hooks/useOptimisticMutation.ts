import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { logError } from "@/lib/sentry";

// ── Types ────────────────────────────────────────────────────────────────────

interface OptimisticMutationOptions<TData, TVariables> {
  /** The async function that performs the actual API call. */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Query keys to cancel, snapshot, rollback, and invalidate.
   * Accepts a static array or a function deriving keys from the variables.
   */
  queryKeys: QueryKey[] | ((variables: TVariables) => QueryKey[]);

  /**
   * Apply the optimistic cache update.
   * Called after in-flight queries are cancelled and snapshots are taken.
   */
  onOptimisticUpdate: (variables: TVariables, queryClient: QueryClient) => void;

  /** Toast message shown on success (default: `"Saved!"`). */
  successMessage?: string;

  /** Toast message shown on error (default: `"Something went wrong. Your change was not saved."`). */
  errorMessage?: string;
}

// ── Snapshot helpers ─────────────────────────────────────────────────────────

type Snapshot = Map<string, unknown>;

function serializeKey(key: QueryKey): string {
  return JSON.stringify(key);
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a mutation hook that follows a **complete optimistic-update lifecycle**:
 *
 * 1. **onMutate**  — cancel queries → snapshot → apply optimistic change
 * 2. **onError**   — rollback to snapshot → `logError` → error toast
 * 3. **onSuccess** — success toast
 * 4. **onSettled** — invalidate queries to re-sync with the server
 *
 * @example
 * ```ts
 * export const useRecordPayment = createOptimisticMutation({
 *   mutationFn: recordPayment,
 *   queryKeys: (payment) => [QUERY_KEYS.debts.all, QUERY_KEYS.debts.payments(payment.debt_id)],
 *   onOptimisticUpdate: (payment, qc) => { ... },
 *   successMessage: "Payment recorded!",
 * });
 * ```
 */
export function createOptimisticMutation<TData, TVariables>(
  options: OptimisticMutationOptions<TData, TVariables>,
) {
  const {
    mutationFn,
    queryKeys,
    onOptimisticUpdate,
    successMessage = "Saved!",
    errorMessage = "Something went wrong. Your change was not saved.",
  } = options;

  /** Resolve query keys — supports static arrays or variable-derived functions. */
  const resolveKeys = (variables: TVariables): QueryKey[] =>
    typeof queryKeys === "function" ? queryKeys(variables) : queryKeys;

  return function useOptimisticMutationHook() {
    const queryClient = useQueryClient();

    return useMutation<TData, Error, TVariables, { snapshot: Snapshot }>({
      mutationFn,

      // ── 1. Optimistic update ───────────────────────────────────────────
      onMutate: async (variables) => {
        const keys = resolveKeys(variables);

        // Cancel in-flight queries to prevent race conditions
        await Promise.all(
          keys.map((key) => queryClient.cancelQueries({ queryKey: key })),
        );

        // Snapshot current cache for rollback
        const snapshot: Snapshot = new Map();
        for (const key of keys) {
          snapshot.set(serializeKey(key), queryClient.getQueryData(key));
        }

        // Apply optimistic cache change
        onOptimisticUpdate(variables, queryClient);

        return { snapshot };
      },

      // ── 2. Rollback on error ───────────────────────────────────────────
      onError: (err, _variables, context) => {
        if (context?.snapshot) {
          for (const [serializedKey, data] of context.snapshot) {
            queryClient.setQueryData(
              JSON.parse(serializedKey) as QueryKey,
              data,
            );
          }
        }

        logError(err);
        toast.error(errorMessage);
      },

      // ── 3. Confirm success ─────────────────────────────────────────────
      onSuccess: () => {
        toast.success(successMessage);
      },

      // ── 4. Always re-sync ─────────────────────────────────────────────
      onSettled: (_data, _error, variables) => {
        const keys = resolveKeys(variables);
        for (const key of keys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      },
    });
  };
}
