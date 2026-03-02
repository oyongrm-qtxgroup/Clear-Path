import { useMemo, useState } from "react";
import { ChevronDown, Plus, Receipt } from "lucide-react";

import { EXPENSE_CATEGORIES } from "@/constants";
import type { Expense, ExpenseCheckRow } from "@/schemas/expense.schema";
import {
  useExpenses,
  useExpenseChecks,
  useToggleExpenseCheck,
} from "@/hooks/useExpenses";
import { formatCurrency, getCurrentMonthYear } from "@/lib/utils";

import {
  PageHeader,
  EmptyState,
  MonthPicker,
  withErrorBoundary,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ── Helpers ──────────────────────────────────────────────────────────────────

type GroupedExpenses = {
  category: string;
  label: string;
  total: number;
  expenses: Expense[];
};

function groupByCategory(expenses: Expense[]): GroupedExpenses[] {
  const map = new Map<string, Expense[]>();

  for (const exp of expenses) {
    const list = map.get(exp.category) ?? [];
    list.push(exp);
    map.set(exp.category, list);
  }

  // Preserve the order defined in EXPENSE_CATEGORIES
  return EXPENSE_CATEGORIES.filter((c) => map.has(c.value)).map((c) => ({
    category: c.value,
    label: c.label,
    total: map.get(c.value)!.reduce((sum, e) => sum + e.amount, 0),
    expenses: map.get(c.value)!,
  }));
}

// ── Skeleton loader ──────────────────────────────────────────────────────────

function ExpenseGroupSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between pl-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ExpensesPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-px w-full" />

      {/* Month picker skeleton */}
      <Skeleton className="h-9 w-56" />

      {/* Category groups skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <ExpenseGroupSkeleton key={i} />
        ))}
      </div>

      {/* Summary bar skeleton */}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

// ── Expense Item Row ─────────────────────────────────────────────────────────

function ExpenseItem({
  expense,
  isPaid,
  monthYear,
}: {
  expense: Expense;
  isPaid: boolean;
  monthYear: string;
}) {
  const { mutate: toggle, isPending } = useToggleExpenseCheck();

  function handleToggle(checked: boolean) {
    toggle({ expenseId: expense.id, monthYear, isPaid: checked });
  }

  return (
    <div className="flex items-center justify-between rounded-md px-4 py-2 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isPaid}
          onCheckedChange={handleToggle}
          disabled={isPending}
          aria-label={`Mark ${expense.name} as ${isPaid ? "unpaid" : "paid"}`}
        />
        <div>
          <p
            className={`text-sm font-medium ${isPaid ? "text-muted-foreground line-through" : ""}`}
          >
            {expense.name}
          </p>
          <p className="text-muted-foreground text-xs">
            Due day {expense.due_day}
          </p>
        </div>
      </div>
      <span
        className={`text-sm font-medium tabular-nums ${isPaid ? "text-muted-foreground" : ""}`}
      >
        {formatCurrency(expense.amount)}
      </span>
    </div>
  );
}

// ── Category Group ───────────────────────────────────────────────────────────

function CategoryGroup({
  group,
  checks,
  monthYear,
}: {
  group: GroupedExpenses;
  checks: ExpenseCheckRow[];
  monthYear: string;
}) {
  const [open, setOpen] = useState(true);

  const paidIds = new Set(
    checks.filter((c) => c.is_paid).map((c) => c.expense_id),
  );
  const paidCount = group.expenses.filter((e) => paidIds.has(e.id)).length;

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronDown
                className={`text-muted-foreground size-4 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
              />
              <span className="text-sm font-semibold">{group.label}</span>
              <Badge variant="outline" className="ml-1 text-xs">
                {paidCount}/{group.expenses.length}
              </Badge>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {formatCurrency(group.total)}
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-1 pt-0 pb-3">
            {group.expenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                isPaid={paidIds.has(expense.id)}
                monthYear={monthYear}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ── Summary Bar ──────────────────────────────────────────────────────────────

function SummaryBar({
  paidCount,
  totalCount,
  remaining,
}: {
  paidCount: number;
  totalCount: number;
  remaining: number;
}) {
  return (
    <div className="bg-muted/60 flex items-center justify-between rounded-lg border px-4 py-3">
      <p className="text-sm">
        <span className="font-semibold">{paidCount}</span> of{" "}
        <span className="font-semibold">{totalCount}</span> paid this month
      </p>
      <Badge variant={remaining > 0 ? "destructive" : "success"}>
        {remaining > 0 ? `${formatCurrency(remaining)} remaining` : "All paid!"}
      </Badge>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

function ExpensesPage() {
  const { data: expenses, isLoading: loadingExpenses } = useExpenses();
  const [monthYear, setMonthYear] = useState(getCurrentMonthYear);
  const { data: checks, isLoading: loadingChecks } =
    useExpenseChecks(monthYear);

  const isLoading = loadingExpenses || loadingChecks;

  // Derived data
  const { groups, totalMonthly, paidCount, totalCount, remaining } =
    useMemo(() => {
      if (!expenses)
        return {
          groups: [],
          totalMonthly: 0,
          paidCount: 0,
          totalCount: 0,
          remaining: 0,
        };

      const grps = groupByCategory(expenses);
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      const paidIds = new Set(
        (checks ?? []).filter((c) => c.is_paid).map((c) => c.expense_id),
      );
      const paid = expenses.filter((e) => paidIds.has(e.id)).length;
      const paidAmount = expenses
        .filter((e) => paidIds.has(e.id))
        .reduce((s, e) => s + e.amount, 0);

      return {
        groups: grps,
        totalMonthly: total,
        paidCount: paid,
        totalCount: expenses.length,
        remaining: total - paidAmount,
      };
    }, [expenses, checks]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return <ExpensesPageSkeleton />;
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!expenses || expenses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Recurring Expenses"
          action={
            <Button size="sm">
              <Plus className="mr-1.5 size-4" />
              Add Expense
            </Button>
          }
        />
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Start tracking your recurring monthly expenses."
        />
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Recurring Expenses"
        description={
          <>
            Monthly total:{" "}
            <Badge variant="secondary" className="ml-1 align-middle">
              {formatCurrency(totalMonthly)}
            </Badge>
          </>
        }
        action={
          <Button size="sm">
            <Plus className="mr-1.5 size-4" />
            Add Expense
          </Button>
        }
      />

      {/* Month picker */}
      <MonthPicker value={monthYear} onMonthChange={setMonthYear} />

      {/* Category groups */}
      <div className="space-y-4">
        {groups.map((group) => (
          <CategoryGroup
            key={group.category}
            group={group}
            checks={checks ?? []}
            monthYear={monthYear}
          />
        ))}
      </div>

      {/* Summary bar */}
      <SummaryBar
        paidCount={paidCount}
        totalCount={totalCount}
        remaining={remaining}
      />
    </div>
  );
}

export default withErrorBoundary(ExpensesPage, "Expenses");
