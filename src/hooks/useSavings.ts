import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants";
import {
  fetchSavingsGoals,
  fetchSavingsLogs,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  logMonthlySavings,
} from "@/api/savings.api";
import type { SavingsGoalForm, SavingsLogRow } from "@/schemas/savings.schema";
import { CACHE_TIER_3 } from "@/lib/queryClient";
import { createOptimisticMutation } from "./useOptimisticMutation";

// ── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all savings goals for the current user. (Tier 3 — long cache) */
export function useSavingsGoals() {
  return useQuery({
    queryKey: QUERY_KEYS.savings.goals,
    queryFn: fetchSavingsGoals,
    ...CACHE_TIER_3,
  });
}

/** Fetch all savings logs for a given goal. (Tier 3 — long cache) */
export function useSavingsLogs(goalId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.savings.logs(goalId),
    queryFn: () => fetchSavingsLogs(goalId),
    enabled: !!goalId,
    ...CACHE_TIER_3,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** Create a new savings goal. */
export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (form: SavingsGoalForm) => createSavingsGoal(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.savings.goals });
      toast.success("Savings goal created!");
    },
  });
}

/** Update an existing savings goal. */
export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      form,
    }: {
      id: string;
      form: Partial<SavingsGoalForm>;
    }) => updateSavingsGoal(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.savings.goals });
    },
  });
}

/** Delete a savings goal. */
export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSavingsGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.savings.goals });
      toast.success("Savings goal deleted.");
    },
  });
}

/** Log (upsert) a monthly savings entry with optimistic cache update. */
export const useLogMonthlySavings = createOptimisticMutation<
  SavingsLogRow,
  { goalId: string; amountSaved: number; monthYear: string }
>({
  mutationFn: (data) => logMonthlySavings(data),

  queryKeys: ({ goalId }) => [
    QUERY_KEYS.savings.goals,
    QUERY_KEYS.savings.logs(goalId),
  ],

  onOptimisticUpdate: ({ goalId, amountSaved, monthYear }, qc) => {
    const logs = qc.getQueryData<SavingsLogRow[]>(
      QUERY_KEYS.savings.logs(goalId),
    );

    if (logs) {
      const existingIndex = logs.findIndex((l) => l.month_year === monthYear);

      if (existingIndex >= 0) {
        // Update existing log entry (upsert)
        const updatedLogs = logs.map((log, i) =>
          i === existingIndex
            ? { ...log, amount_saved: amountSaved, logged_at: new Date() }
            : log,
        );
        qc.setQueryData<SavingsLogRow[]>(
          QUERY_KEYS.savings.logs(goalId),
          updatedLogs,
        );
      } else {
        // Prepend a new optimistic log entry
        const optimisticLog: SavingsLogRow = {
          id: crypto.randomUUID(),
          user_id: "",
          goal_id: goalId,
          amount_saved: amountSaved,
          month_year: monthYear,
          logged_at: new Date(),
        };
        qc.setQueryData<SavingsLogRow[]>(QUERY_KEYS.savings.logs(goalId), [
          optimisticLog,
          ...logs,
        ]);
      }
    }
  },

  successMessage: "Savings logged!",
  errorMessage: "Something went wrong. Your change was not saved.",
});
