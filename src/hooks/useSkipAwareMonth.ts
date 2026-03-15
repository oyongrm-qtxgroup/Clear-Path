import { useState, useRef, useEffect } from "react";
import { format, addMonths } from "date-fns";

import { getCurrentMonthYear } from "@/lib/utils";
import { useSkippedMonth } from "./useBudget";

/**
 * Month state that auto-advances past skipped months on initial load.
 *
 * Replaces the raw `useState(getCurrentMonthYear)` pattern used by page
 * components so that Budget, Expenses, and Debts pages all respect the
 * skip-month setting consistently.
 */
export function useSkipAwareMonth() {
  const [monthYear, setMonthYear] = useState(getCurrentMonthYear);
  const { data: skippedMonth, isLoading: skippedLoading } =
    useSkippedMonth(monthYear);

  const isSkipped = !!skippedMonth;

  // Auto-advance to next month when current month is skipped on initial load
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (
      !skippedLoading &&
      isInitialMount.current &&
      monthYear === getCurrentMonthYear() &&
      isSkipped
    ) {
      const next = format(addMonths(new Date(), 1), "yyyy-MM");
      setMonthYear(next);
    }
    if (!skippedLoading) {
      isInitialMount.current = false;
    }
  }, [skippedLoading, isSkipped, monthYear]);

  return { monthYear, setMonthYear, isSkipped, skippedLoading };
}
