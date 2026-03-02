import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants";
import {
  fetchExpenses,
  fetchExpenseChecks,
  createExpense,
  updateExpense,
  deleteExpense,
  toggleExpenseCheck,
} from "@/api/expense.api";
import type { ExpenseForm, ExpenseCheckRow } from "@/schemas/expense.schema";
import { CACHE_TIER_1 } from "@/lib/queryClient";
import { createOptimisticMutation } from "./useOptimisticMutation";

// ── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all active expenses for the current user. (Tier 2 — default) */
export function useExpenses() {
  return useQuery({
    queryKey: QUERY_KEYS.expenses.all,
    queryFn: fetchExpenses,
    // Tier 2 defaults applied via QueryClient
  });
}

/** Fetch expense checks for a given month. (Tier 1 — near real-time) */
export function useExpenseChecks(monthYear: string) {
  return useQuery({
    queryKey: QUERY_KEYS.expenses.checks(monthYear),
    queryFn: () => fetchExpenseChecks(monthYear),
    enabled: !!monthYear,
    ...CACHE_TIER_1,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** Create a new expense. */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (form: ExpenseForm) => createExpense(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses.all });
      toast.success("Expense created!");
    },
  });
}

/** Update an existing expense. */
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, form }: { id: string; form: Partial<ExpenseForm> }) =>
      updateExpense(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses.all });
    },
  });
}

/** Soft-delete an expense. */
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses.all });
    },
  });
}

// ── Optimistic Mutations ─────────────────────────────────────────────────────

/**
 * Toggle the paid status of an expense check with optimistic cache update.
 *
 * Immediately flips `is_paid` in the cache and rolls back on error.
 */
export const useToggleExpenseCheck = createOptimisticMutation<
  ExpenseCheckRow,
  { expenseId: string; monthYear: string; isPaid: boolean }
>({
  mutationFn: ({ expenseId, monthYear, isPaid }) =>
    toggleExpenseCheck(expenseId, monthYear, isPaid),

  queryKeys: ({ monthYear }) => [QUERY_KEYS.expenses.checks(monthYear)],

  onOptimisticUpdate: ({ expenseId, monthYear, isPaid }, qc) => {
    const checks = qc.getQueryData<ExpenseCheckRow[]>(
      QUERY_KEYS.expenses.checks(monthYear),
    );

    if (checks) {
      qc.setQueryData<ExpenseCheckRow[]>(
        QUERY_KEYS.expenses.checks(monthYear),
        checks.map((check) =>
          check.expense_id === expenseId
            ? {
                ...check,
                is_paid: isPaid,
                paid_at: isPaid ? new Date() : null,
              }
            : check,
        ),
      );
    }
  },

  successMessage: "Saved!",
  errorMessage: "Something went wrong. Your change was not saved.",
});
