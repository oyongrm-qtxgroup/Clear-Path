import { useMemo, useState } from "react";
import { useSkipAwareMonth } from "@/hooks";
import { ChevronDown, Loader2, Plus, Receipt } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { EXPENSE_CATEGORIES } from "@/constants";
import type { Expense, ExpenseCheckRow } from "@/schemas/expense.schema";
import {
  expenseFormSchema,
  type ExpenseForm as ExpenseFormValues,
} from "@/schemas/expense.schema";
import {
  useExpenses,
  useExpenseChecks,
  useCreateExpense,
} from "@/hooks/useExpenses";
import { formatCurrency } from "@/lib/utils";

import {
  PageHeader,
  EmptyState,
  MonthPicker,
  CurrencyInput,
  withErrorBoundary,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ExpenseItem from "./ExpenseItem";

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
                check={checks.find((c) => c.expense_id === expense.id)}
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

// ── Add Expense Form ─────────────────────────────────────────────────────────

function AddExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const createExpense = useCreateExpense();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema) as Resolver<ExpenseFormValues>,
    defaultValues: {
      name: "",
      category: "other",
      amount: 0,
      due_day: 1,
    },
  });

  async function onSubmit(values: ExpenseFormValues) {
    await createExpense.mutateAsync(values);
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Netflix" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (PHP)</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Due Day */}
        <FormField
          control={form.control}
          name="due_day"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Day (1–31)</FormLabel>
              <FormControl>
                <Input type="number" min="1" max="31" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={createExpense.isPending}
        >
          {createExpense.isPending && (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          )}
          Add Expense
        </Button>
      </form>
    </Form>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

function ExpensesPage() {
  const { data: expenses, isLoading: loadingExpenses } = useExpenses();
  const { monthYear, setMonthYear } = useSkipAwareMonth();
  const { data: checks, isLoading: loadingChecks } =
    useExpenseChecks(monthYear);
  const [isAddOpen, setIsAddOpen] = useState(false);

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
            <Button size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-1.5 size-4" />
              Add Expense
            </Button>
          }
        />
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Start tracking your recurring monthly expenses."
          illustration="expense"
          action={{
            label: "Add Your First Expense",
            onClick: () => setIsAddOpen(true),
          }}
        />

        {/* Add Expense Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <AddExpenseForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
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
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
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

      {/* Add Expense Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <AddExpenseForm onSuccess={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withErrorBoundary(ExpensesPage, "Expenses");
