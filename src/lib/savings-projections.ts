import { format, addMonths, startOfMonth } from "date-fns";

import type { SavingsGoal, SavingsLog } from "@/schemas/savings.schema";
import type { Debt } from "@/schemas/debt.schema";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SavingsProjectionEntry {
  monthYear: string;
  planned: number;
  actual: number | null;
}

export interface DebtFreeBoostEntry {
  monthYear: string;
  withBoost: number;
  withoutBoost: number;
}

export interface DebtPayoffMilestone {
  debtName: string;
  payoffMonth: string;
  monthlyAmountFreed: number;
  cumulativeMonthlyBoost: number;
  cumulativeMonthlySavingsRate: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a Date to "YYYY-MM" string. */
function toMonthYear(date: Date): string {
  return format(date, "yyyy-MM");
}

/**
 * Generate an inclusive array of "YYYY-MM" strings from `start` to `end`.
 * Both boundaries are included.
 */
function generateMonthRange(start: Date, end: Date): string[] {
  const months: string[] = [];
  let cursor = startOfMonth(start);
  const last = startOfMonth(end);

  while (cursor <= last) {
    months.push(toMonthYear(cursor));
    cursor = addMonths(cursor, 1);
  }

  return months;
}

/**
 * Build a lookup map from month_year → amount_saved for quick access.
 */
function buildLogMap(logs: SavingsLog[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const log of logs) {
    // If duplicate months exist, sum them (shouldn't happen with upsert, but be safe)
    map.set(log.month_year, (map.get(log.month_year) ?? 0) + log.amount_saved);
  }
  return map;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a month-by-month savings projection from the goal's creation month
 * through its target date.
 *
 * - `planned`  – cumulative amount if the user saves the required monthly
 *   amount each month (starting from `starting_amount`).
 * - `actual`   – cumulative amount actually logged (including `starting_amount`);
 *   `null` for months that haven't happened yet.
 */
export function buildSavingsProjection(
  goal: SavingsGoal,
  logs: SavingsLog[],
): SavingsProjectionEntry[] {
  const months = generateMonthRange(goal.created_at, goal.target_date);

  if (months.length === 0) return [];

  // Amount still needed beyond starting_amount
  const remaining = Math.max(goal.target_amount - goal.starting_amount, 0);
  const requiredMonthly = months.length > 0 ? remaining / months.length : 0;

  const logMap = buildLogMap(logs);
  const currentMonthYear = toMonthYear(new Date());

  const projection: SavingsProjectionEntry[] = [];
  let cumulativePlanned = goal.starting_amount;
  let cumulativeActual = goal.starting_amount;

  for (const monthYear of months) {
    cumulativePlanned += requiredMonthly;

    const isFuture = monthYear > currentMonthYear;
    const loggedAmount = logMap.get(monthYear) ?? 0;

    if (!isFuture) {
      cumulativeActual += loggedAmount;
    }

    projection.push({
      monthYear,
      planned: Math.round(cumulativePlanned * 100) / 100,
      actual: isFuture ? null : Math.round(cumulativeActual * 100) / 100,
    });
  }

  return projection;
}

/**
 * Sum of all `amount_saved` across the given logs.
 */
export function calculateTotalSaved(logs: SavingsLog[]): number {
  return logs.reduce((sum, log) => sum + log.amount_saved, 0);
}

/**
 * Project how savings accelerate as debts are cleared.
 *
 * For each future month (starting from the current month), the function
 * simulates debt amortisation. When a debt's balance reaches zero its
 * `monthly_payment` is redirected into savings (the "boost"). The returned
 * array shows **cumulative** savings over time with those boosts factored in.
 *
 * Assumptions / simplifications:
 * - Interest is compounded monthly: `monthlyRate = interest_rate / 12 / 100`.
 * - Already-paid-off debts (`is_paid_off === true`) are excluded.
 * - The projection horizon runs from the current month to the goal's
 *   `target_date`.
 * - The base monthly savings amount is derived from the goal/logs the same way
 *   `calculateRequiredMonthlySavings` would compute it.
 */
export function calculateDebtFreeBoostProjection(
  debts: Debt[],
  currentSavingsGoal: SavingsGoal,
  logs: SavingsLog[],
): DebtFreeBoostEntry[] {
  const now = new Date();
  const months = generateMonthRange(now, currentSavingsGoal.target_date);

  if (months.length === 0) return [];

  // Base monthly savings = required monthly amount to hit the goal from today
  const totalSaved = calculateTotalSaved(logs);
  const remainingToSave = Math.max(
    currentSavingsGoal.target_amount -
      currentSavingsGoal.starting_amount -
      totalSaved,
    0,
  );
  const baseMonthlySavings =
    months.length > 0 ? remainingToSave / months.length : 0;

  // Clone active debts so we can mutate balances during simulation
  const activeDebts = debts
    .filter((d) => !d.is_paid_off && d.current_balance > 0)
    .map((d) => ({
      balance: d.current_balance,
      monthlyPayment: d.monthly_payment,
      monthlyRate: d.interest_rate / 12 / 100,
      paidOff: false,
    }));

  const projection: DebtFreeBoostEntry[] = [];
  let cumulativeSavings = currentSavingsGoal.starting_amount + totalSaved;
  let cumulativeSavingsNoBoost =
    currentSavingsGoal.starting_amount + totalSaved;
  let monthlyBoost = 0;

  for (const monthYear of months) {
    // Simulate one month of debt payments
    for (const debt of activeDebts) {
      if (debt.paidOff) continue;

      const interest = debt.balance * debt.monthlyRate;
      debt.balance = debt.balance + interest - debt.monthlyPayment;

      if (debt.balance <= 0) {
        debt.balance = 0;
        debt.paidOff = true;
        // This debt's payment now boosts savings
        monthlyBoost += debt.monthlyPayment;
      }
    }

    // Monthly savings = base amount + freed-up debt payments
    const monthlySavings = baseMonthlySavings + monthlyBoost;
    cumulativeSavings += monthlySavings;
    cumulativeSavingsNoBoost += baseMonthlySavings;

    projection.push({
      monthYear,
      withBoost: Math.round(cumulativeSavings * 100) / 100,
      withoutBoost: Math.round(cumulativeSavingsNoBoost * 100) / 100,
    });
  }

  return projection;
}

/**
 * Compute a timeline of debt payoff milestones.
 *
 * Returns one entry per active debt, sorted by payoff date, showing when each
 * debt is projected to be paid off, the monthly payment it frees, and the
 * resulting cumulative boost and total monthly savings rate.
 */
export function calculateDebtPayoffMilestones(
  debts: Debt[],
  baseMonthlySavings: number,
): DebtPayoffMilestone[] {
  const activeDebts = debts
    .filter((d) => !d.is_paid_off && d.current_balance > 0)
    .map((d) => ({
      name: d.name,
      balance: d.current_balance,
      monthlyPayment: d.monthly_payment,
      monthlyRate: d.interest_rate / 12 / 100,
    }));

  if (activeDebts.length === 0) return [];

  // Simulate month-by-month to find payoff dates
  const milestones: DebtPayoffMilestone[] = [];
  const now = new Date();
  let cumulativeBoost = 0;
  const MAX_MONTHS = 600;

  const remaining = activeDebts.map((d) => ({ ...d, paidOff: false }));

  for (let m = 1; m <= MAX_MONTHS; m++) {
    const cursor = addMonths(startOfMonth(now), m);
    const monthYear = format(cursor, "yyyy-MM");

    for (const debt of remaining) {
      if (debt.paidOff) continue;

      const interest = debt.balance * debt.monthlyRate;
      debt.balance = debt.balance + interest - debt.monthlyPayment;

      if (debt.balance <= 0) {
        debt.balance = 0;
        debt.paidOff = true;
        cumulativeBoost += debt.monthlyPayment;

        milestones.push({
          debtName: debt.name,
          payoffMonth: monthYear,
          monthlyAmountFreed: debt.monthlyPayment,
          cumulativeMonthlyBoost: cumulativeBoost,
          cumulativeMonthlySavingsRate: baseMonthlySavings + cumulativeBoost,
        });
      }
    }

    // Stop early if all debts are paid off
    if (remaining.every((d) => d.paidOff)) break;
  }

  return milestones;
}
