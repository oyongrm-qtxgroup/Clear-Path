import { clsx, type ClassValue } from "clsx";
import {
  format,
  differenceInMonths,
  setDate,
  differenceInCalendarDays,
} from "date-fns";
import { twMerge } from "tailwind-merge";

import { DEFAULT_CURRENCY } from "@/constants";

// ---------------------------------------------------------------------------
// 1. Tailwind class merger
// ---------------------------------------------------------------------------
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// 2. Currency formatting
// ---------------------------------------------------------------------------
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// 3. Current month in "YYYY-MM" format
// ---------------------------------------------------------------------------
export function getCurrentMonthYear(): string {
  return format(new Date(), "yyyy-MM");
}

// ---------------------------------------------------------------------------
// 4. Debt payoff date via amortization iteration
// ---------------------------------------------------------------------------
export function calculatePayoffDate(
  balance: number,
  monthlyPayment: number,
  annualInterestRate: number,
): Date | null {
  const monthlyRate = annualInterestRate / 12 / 100;
  let remaining = balance;
  const MAX_MONTHS = 600; // 50-year cap

  for (let month = 1; month <= MAX_MONTHS; month++) {
    const interest = remaining * monthlyRate;

    // Will never pay off
    if (monthlyPayment <= interest) return null;

    remaining = remaining + interest - monthlyPayment;

    if (remaining <= 0) {
      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + month);
      return payoffDate;
    }
  }

  return null; // exceeded 50-year cap
}

// ---------------------------------------------------------------------------
// 5. Required monthly savings to reach a goal
// ---------------------------------------------------------------------------
export function calculateRequiredMonthlySavings(
  targetAmount: number,
  currentAmount: number,
  targetDate: Date,
): number {
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return 0;

  const months = differenceInMonths(targetDate, new Date());
  if (months <= 0) return remaining; // due now or overdue — full amount needed

  return Math.ceil((remaining / months) * 100) / 100; // round up to nearest cent
}

// ---------------------------------------------------------------------------
// 6. Format "YYYY-MM" → "March 2026"
// ---------------------------------------------------------------------------
export function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split("-");
  // Construct a date on the 1st of that month (local timezone)
  const date = new Date(Number(year), Number(month) - 1, 1);
  return format(date, "MMMM yyyy");
}

// ---------------------------------------------------------------------------
// 7. Days until a recurring due date this month
// ---------------------------------------------------------------------------
export function daysUntilDueThisMonth(dueDay: number): number {
  const today = new Date();
  const dueDate = setDate(today, dueDay);
  return differenceInCalendarDays(dueDate, today);
}
