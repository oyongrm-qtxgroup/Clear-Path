import { z } from "zod";
import { format, addMonths, startOfMonth } from "date-fns";

import { supabase } from "@/lib/supabase";
import { parseApiResponse } from "@/lib/parse-api-response";
import { debtSchema } from "@/schemas/debt.schema";
import { expenseSchema, expenseCheckRowSchema } from "@/schemas/expense.schema";
import {
  savingsGoalSchema,
  savingsLogRowSchema,
} from "@/schemas/savings.schema";
import type { Debt } from "@/schemas/debt.schema";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SavingsSummaryItem {
  name: string;
  total_saved: number;
  target_amount: number;
}

export interface DebtSnapshotItem {
  id: string;
  name: string;
  type: string;
  current_balance: number;
  due_day: number;
  priority: number;
}

export interface DashboardSummary {
  /** Sum of current_balance from debts where is_paid_off = false. */
  total_debt: number;
  /** Sum of monthly_payment (active debts) + sum of amount (active expenses). */
  total_monthly_obligations: number;
  /** Latest projected payoff date across all active debts, or null if none. */
  debt_free_date: Date | null;
  /** Count of active debts + active expenses. */
  current_month_items_total: number;
  /** Count of debt payments + paid expense checks for the current month. */
  current_month_items_paid: number;
  /** Per-goal summary: name, total_saved, target_amount. */
  savings_summary: SavingsSummaryItem[];
  /** Top 3 unpaid debts ordered by priority. */
  top_debts: DebtSnapshotItem[];
  /** Count of unpaid expenses this month. */
  unpaid_expenses_count: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Throw a descriptive error when Supabase returns an error object. */
function throwOnError<T>(
  result: { data: T; error: null } | { data: null; error: { message: string } },
): T {
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data as T;
}

/**
 * Calculate the projected payoff date for a single debt.
 *
 * Simulates month-by-month amortisation with compounding interest.
 * Returns `null` if the monthly payment doesn't cover interest (infinite).
 * Caps simulation at 600 months (50 years).
 */
function calculatePayoffDate(debt: Debt): Date | null {
  if (debt.is_paid_off || debt.current_balance <= 0) return null;

  const monthlyRate = debt.interest_rate / 12 / 100;
  let balance = debt.current_balance;
  const MAX_MONTHS = 600;

  for (let m = 1; m <= MAX_MONTHS; m++) {
    const interest = balance * monthlyRate;
    balance = balance + interest - debt.monthly_payment;

    if (balance <= 0) {
      return addMonths(startOfMonth(new Date()), m);
    }
  }

  // Payment doesn't cover interest or takes > 50 years
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all data needed for the dashboard in a single call.
 *
 * Uses `Promise.all()` to run Supabase queries in parallel, then
 * derives every summary metric client-side.
 */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const currentMonthYear = format(new Date(), "yyyy-MM");

  // Run all queries in parallel
  const [
    debtsResult,
    expensesResult,
    debtPaymentsResult,
    expenseChecksResult,
    savingsGoalsResult,
    savingsLogsResult,
  ] = await Promise.all([
    supabase.from("debts").select("*").order("priority", { ascending: true }),
    supabase.from("expenses").select("*").eq("is_active", true),
    supabase
      .from("debt_payments")
      .select("debt_id, month_year")
      .eq("month_year", currentMonthYear),
    supabase
      .from("expense_checks")
      .select("*")
      .eq("month_year", currentMonthYear)
      .eq("is_paid", true),
    supabase
      .from("savings_goals")
      .select("*")
      .order("target_date", { ascending: true }),
    supabase.from("savings_logs").select("*"),
  ]);

  // Validate & parse
  const debts = parseApiResponse(
    z.array(debtSchema),
    throwOnError(debtsResult),
    "dashboard.debts",
  );
  const expenses = parseApiResponse(
    z.array(expenseSchema),
    throwOnError(expensesResult),
    "dashboard.expenses",
  );
  const debtPayments = throwOnError(debtPaymentsResult) as {
    debt_id: string;
    month_year: string;
  }[];
  const expenseChecks = parseApiResponse(
    z.array(expenseCheckRowSchema),
    throwOnError(expenseChecksResult),
    "dashboard.expenseChecks",
  );
  const savingsGoals = parseApiResponse(
    z.array(savingsGoalSchema),
    throwOnError(savingsGoalsResult),
    "dashboard.savingsGoals",
  );
  const savingsLogs = parseApiResponse(
    z.array(savingsLogRowSchema),
    throwOnError(savingsLogsResult),
    "dashboard.savingsLogs",
  );

  // ── Derived metrics ──────────────────────────────────────────────────────

  const activeDebts = debts.filter((d) => !d.is_paid_off);

  // 1. Total debt
  const total_debt = activeDebts.reduce((sum, d) => sum + d.current_balance, 0);

  // 2. Total monthly obligations
  const debtObligations = activeDebts.reduce(
    (sum, d) => sum + d.monthly_payment,
    0,
  );
  const expenseObligations = expenses.reduce((sum, e) => sum + e.amount, 0);
  const total_monthly_obligations = debtObligations + expenseObligations;

  // 3. Debt-free date (latest payoff across all active debts)
  let debt_free_date: Date | null = null;
  for (const debt of activeDebts) {
    const payoff = calculatePayoffDate(debt);
    if (payoff === null) {
      // At least one debt can never be paid off — return null
      debt_free_date = null;
      break;
    }
    if (!debt_free_date || payoff > debt_free_date) {
      debt_free_date = payoff;
    }
  }

  // 4. Current month items total
  const current_month_items_total = activeDebts.length + expenses.length;

  // 5. Current month items paid
  //    Count unique debt IDs with a payment this month + paid expense checks
  const paidDebtIds = new Set(debtPayments.map((p) => p.debt_id));
  const current_month_items_paid = paidDebtIds.size + expenseChecks.length;

  // 6. Savings summary
  //    Group logs by goal_id, then map to summary items
  const logsByGoal = new Map<string, number>();
  for (const log of savingsLogs) {
    logsByGoal.set(
      log.goal_id,
      (logsByGoal.get(log.goal_id) ?? 0) + log.amount_saved,
    );
  }

  const savings_summary: SavingsSummaryItem[] = savingsGoals.map((goal) => ({
    name: goal.name,
    total_saved: goal.starting_amount + (logsByGoal.get(goal.id) ?? 0),
    target_amount: goal.target_amount,
  }));

  // 7. Top 3 debts by priority (already sorted by priority from query)
  const top_debts: DebtSnapshotItem[] = activeDebts.slice(0, 3).map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    current_balance: d.current_balance,
    due_day: d.due_day,
    priority: d.priority,
  }));

  // 8. Unpaid expenses this month
  const unpaid_expenses_count = expenses.length - expenseChecks.length;

  return {
    total_debt,
    total_monthly_obligations,
    debt_free_date,
    current_month_items_total,
    current_month_items_paid,
    savings_summary,
    top_debts,
    unpaid_expenses_count,
  };
}
