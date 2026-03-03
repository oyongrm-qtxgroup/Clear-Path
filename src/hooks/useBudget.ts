import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants";
import {
  fetchBudgetExtras,
  createBudgetExtra,
  deleteBudgetExtra,
  toggleBudgetExtraPaid,
  fetchIncomeOverride,
  upsertIncomeOverride,
  deleteIncomeOverride,
} from "@/api/budget.api";
import type { BudgetExtra, BudgetExtraForm } from "@/schemas/budget.schema";
import { CACHE_TIER_1 } from "@/lib/queryClient";
import { createOptimisticMutation } from "./useOptimisticMutation";

// ── Budget Extras — Queries ──────────────────────────────────────────────────

/** Fetch all budget extras for a given month. (Tier 1 — near real-time) */
export function useBudgetExtras(monthYear: string) {
  return useQuery({
    queryKey: QUERY_KEYS.budget.extras(monthYear),
    queryFn: () => fetchBudgetExtras(monthYear),
    enabled: !!monthYear,
    ...CACHE_TIER_1,
  });
}

// ── Budget Extras — Mutations ────────────────────────────────────────────────

/** Create a new budget extra for a given month. */
export function useCreateBudgetExtra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      form,
      monthYear,
    }: {
      form: BudgetExtraForm;
      monthYear: string;
    }) => createBudgetExtra(form, monthYear),
    onSuccess: (_data, { monthYear }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.budget.extras(monthYear),
      });
      toast.success("Extra item added!");
    },
  });
}

/** Delete a budget extra. */
export function useDeleteBudgetExtra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; monthYear: string }) =>
      deleteBudgetExtra(id),
    onSuccess: (_data, { monthYear }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.budget.extras(monthYear),
      });
    },
  });
}

/** Toggle paid status on a budget extra with optimistic update. */
export const useToggleBudgetExtraPaid = createOptimisticMutation<
  BudgetExtra,
  { id: string; monthYear: string; isPaid: boolean }
>({
  mutationFn: ({ id, isPaid }) => toggleBudgetExtraPaid(id, isPaid),

  queryKeys: ({ monthYear }) => [QUERY_KEYS.budget.extras(monthYear)],

  onOptimisticUpdate: ({ id, monthYear, isPaid }, qc) => {
    const extras = qc.getQueryData<BudgetExtra[]>(
      QUERY_KEYS.budget.extras(monthYear),
    );

    if (extras) {
      qc.setQueryData<BudgetExtra[]>(
        QUERY_KEYS.budget.extras(monthYear),
        extras.map((extra) =>
          extra.id === id
            ? {
                ...extra,
                is_paid: isPaid,
                paid_at: isPaid ? new Date() : null,
              }
            : extra,
        ),
      );
    }
  },

  successMessage: "Saved!",
  errorMessage: "Something went wrong. Your change was not saved.",
});

// ── Income Overrides — Queries ───────────────────────────────────────────────

/** Fetch the income override for a given month. */
export function useIncomeOverride(monthYear: string) {
  return useQuery({
    queryKey: QUERY_KEYS.budget.incomeOverride(monthYear),
    queryFn: () => fetchIncomeOverride(monthYear),
    enabled: !!monthYear,
    ...CACHE_TIER_1,
  });
}

// ── Income Overrides — Mutations ─────────────────────────────────────────────

/** Upsert the income override for a given month. */
export function useUpsertIncomeOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      monthYear,
      incomeAmount,
    }: {
      monthYear: string;
      incomeAmount: number;
    }) => upsertIncomeOverride(monthYear, incomeAmount),
    onSuccess: (_data, { monthYear }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.budget.incomeOverride(monthYear),
      });
      toast.success("Income updated for this month!");
    },
  });
}

/** Delete the income override for a month (revert to default). */
export function useDeleteIncomeOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (monthYear: string) => deleteIncomeOverride(monthYear),
    onSuccess: (_data, monthYear) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.budget.incomeOverride(monthYear),
      });
      toast.success("Reverted to default income");
    },
  });
}
