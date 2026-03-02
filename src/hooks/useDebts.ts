import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants";
import {
  fetchDebts,
  fetchDebtById,
  fetchDebtPayments,
  createDebt,
  updateDebt,
  deleteDebt,
  recordPayment,
  undoPayment,
} from "@/api/debt.api";
import type { Debt, DebtForm, DebtPayment } from "@/schemas/debt.schema";
import { createOptimisticMutation } from "./useOptimisticMutation";

// ── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all debts for the current user. (Tier 2 — default) */
export function useDebts() {
  return useQuery({
    queryKey: QUERY_KEYS.debts.all,
    queryFn: fetchDebts,
    // Tier 2 defaults applied via QueryClient
  });
}

/** Fetch a single debt by ID. */
export function useDebt(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.debts.detail(id),
    queryFn: () => fetchDebtById(id),
    enabled: !!id,
  });
}

/** Fetch all payment records for a debt. */
export function useDebtPayments(debtId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.debts.payments(debtId),
    queryFn: () => fetchDebtPayments(debtId),
    enabled: !!debtId,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** Create a new debt. */
export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (form: DebtForm) => createDebt(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.debts.all });
      toast.success("Debt created!");
    },
  });
}

/** Update an existing debt. */
export function useUpdateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, form }: { id: string; form: Partial<DebtForm> }) =>
      updateDebt(id, form),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.debts.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.debts.detail(id),
      });
    },
  });
}

/** Delete a debt. */
export function useDeleteDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDebt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.debts.all });
    },
  });
}

// ── Optimistic Mutations ─────────────────────────────────────────────────────

/**
 * Record a payment with optimistic cache update.
 *
 * Deducts balance (marks paid off if balance reaches 0) and prepends
 * the payment to the payments list. Rolls back on error.
 */
export const useRecordPayment = createOptimisticMutation<void, DebtPayment>({
  mutationFn: (payment) => recordPayment(payment),

  queryKeys: (payment) => [
    QUERY_KEYS.debts.all,
    QUERY_KEYS.debts.payments(payment.debt_id),
  ],

  onOptimisticUpdate: (payment, qc) => {
    // Update debts list — deduct balance
    const debts = qc.getQueryData<Debt[]>(QUERY_KEYS.debts.all);
    if (debts) {
      qc.setQueryData<Debt[]>(
        QUERY_KEYS.debts.all,
        debts.map((debt) => {
          if (debt.id !== payment.debt_id) return debt;

          const newBalance = Math.max(
            0,
            debt.current_balance - payment.amount_paid,
          );

          return {
            ...debt,
            current_balance: newBalance,
            is_paid_off: newBalance <= 0,
            paid_off_at: newBalance <= 0 ? new Date() : debt.paid_off_at,
          };
        }),
      );
    }

    // Prepend payment to the payments list
    const payments = qc.getQueryData<DebtPayment[]>(
      QUERY_KEYS.debts.payments(payment.debt_id),
    );
    if (payments) {
      qc.setQueryData<DebtPayment[]>(
        QUERY_KEYS.debts.payments(payment.debt_id),
        [payment, ...payments],
      );
    }
  },

  successMessage: "Payment recorded!",
  errorMessage: "Something went wrong. Your change was not saved.",
});

/**
 * Undo a recorded payment with optimistic cache update (reverse of recordPayment).
 *
 * Adds amount back to balance, resets paid-off status, and removes the
 * payment from the payments list. Rolls back on error.
 */
export const useUndoPayment = createOptimisticMutation<
  void,
  { debtId: string; monthYear: string }
>({
  mutationFn: ({ debtId, monthYear }) => undoPayment(debtId, monthYear),

  queryKeys: ({ debtId }) => [
    QUERY_KEYS.debts.all,
    QUERY_KEYS.debts.payments(debtId),
  ],

  onOptimisticUpdate: ({ debtId, monthYear }, qc) => {
    const debts = qc.getQueryData<Debt[]>(QUERY_KEYS.debts.all);
    const payments = qc.getQueryData<DebtPayment[]>(
      QUERY_KEYS.debts.payments(debtId),
    );

    // Find the payment being undone to know how much to add back
    const paymentToUndo = payments?.find((p) => p.month_year === monthYear);

    // Restore balance on the debt
    if (debts && paymentToUndo) {
      qc.setQueryData<Debt[]>(
        QUERY_KEYS.debts.all,
        debts.map((debt) => {
          if (debt.id !== debtId) return debt;

          const restoredBalance =
            debt.current_balance + paymentToUndo.amount_paid;

          return {
            ...debt,
            current_balance: restoredBalance,
            is_paid_off: false,
            paid_off_at: null,
          };
        }),
      );
    }

    // Remove the payment from the list
    if (payments) {
      qc.setQueryData<DebtPayment[]>(
        QUERY_KEYS.debts.payments(debtId),
        payments.filter((p) => p.month_year !== monthYear),
      );
    }
  },

  successMessage: "Payment undone!",
  errorMessage: "Something went wrong. Your change was not saved.",
});
