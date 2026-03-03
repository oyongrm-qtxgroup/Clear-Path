import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, subMonths, addMonths, isBefore, startOfMonth } from "date-fns";

import { Button } from "@/components/ui/button";

interface MonthPickerProps {
  /** Current value in "YYYY-MM" format. Defaults to current month. */
  value?: string;
  /** Called when the user navigates to a different month. */
  onMonthChange: (monthYear: string) => void;
}

function toDate(monthYear: string): Date {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function toMonthYear(date: Date): string {
  return format(date, "yyyy-MM");
}

export function MonthPicker({ value, onMonthChange }: MonthPickerProps) {
  const now = useMemo(() => startOfMonth(new Date()), []);
  const current = value ? toDate(value) : now;

  const canGoForward = isBefore(startOfMonth(current), addMonths(now, 1));

  function handlePrev() {
    onMonthChange(toMonthYear(subMonths(current, 1)));
  }

  function handleNext() {
    if (!canGoForward) return;
    onMonthChange(toMonthYear(addMonths(current, 1)));
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handlePrev}
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[10rem] text-center text-sm font-medium">
        {format(current, "MMMM yyyy")}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleNext}
        disabled={!canGoForward}
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
