import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Wallet,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  RotateCcw,
  Check,
  SkipForward,
  CalendarCheck2,
} from "lucide-react";

import {
  useProfile,
  useDebts,
  useExpenses,
  useExpenseChecks,
  useRecordPayment,
  useUndoPayment,
  useToggleExpenseCheck,
  useBudgetExtras,
  useCreateBudgetExtra,
  useDeleteBudgetExtra,
  useToggleBudgetExtraPaid,
  useIncomeOverride,
  useUpsertIncomeOverride,
  useDeleteIncomeOverride,
  useAllDebtPaymentsForMonth,
  useSkippedMonth,
  useSkipMonth,
  useUnskipMonth,
} from "@/hooks";
import { DEBT_TYPES, EXPENSE_CATEGORIES } from "@/constants";
import { formatCurrency, getCurrentMonthYear } from "@/lib/utils";
import {
  PageHeader,
  MonthPicker,
  CurrencyInput,
  ConfirmDialog,
  withErrorBoundary,
} from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Debt } from "@/schemas/debt.schema";
import type { Expense } from "@/schemas/expense.schema";
import type { BudgetExtra } from "@/schemas/budget.schema";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDebtTypeLabel(type: string): string {
  return (
    DEBT_TYPES.find((t) => t.value === type)?.label ?? type.replaceAll("_", " ")
  );
}

function getExpenseCategoryLabel(category: string): string {
  return (
    EXPENSE_CATEGORIES.find((c) => c.value === category)?.label ??
    category.replaceAll("_", " ")
  );
}

// ── Income Bar ───────────────────────────────────────────────────────────────

function IncomeBar({
  defaultIncome,
  overrideAmount,
  monthYear,
}: {
  defaultIncome: number;
  overrideAmount: number | null;
  monthYear: string;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const upsertMutation = useUpsertIncomeOverride();
  const deleteMutation = useDeleteIncomeOverride();

  const effectiveIncome = overrideAmount ?? defaultIncome;
  const isOverridden = overrideAmount !== null;

  function handleEdit() {
    setInputValue(String(effectiveIncome));
    setEditing(true);
  }

  function handleSave() {
    const amount = parseFloat(inputValue);
    if (isNaN(amount) || amount < 0) return;
    upsertMutation.mutate(
      { monthYear, incomeAmount: amount },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleReset() {
    deleteMutation.mutate(monthYear, {
      onSuccess: () => setEditing(false),
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Wallet className="size-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Monthly Income</p>
            {editing ? (
              <div className="flex items-center gap-2 mt-1">
                <CurrencyInput
                  value={inputValue ? parseFloat(inputValue) : 0}
                  onChange={(v) => setInputValue(String(v))}
                  compact
                />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={upsertMutation.isPending}
                >
                  {upsertMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                >
                  &times;
                </Button>
              </div>
            ) : (
              <p className="text-xl font-bold">
                {formatCurrency(effectiveIncome)}
              </p>
            )}
          </div>
          {isOverridden && !editing && (
            <Badge variant="secondary" className="ml-2">
              Custom
            </Badge>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="mr-1.5 size-3.5" />
              Edit
            </Button>
            {isOverridden && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={deleteMutation.isPending}
              >
                <RotateCcw className="mr-1.5 size-3.5" />
                Reset
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({
  totalObligations,
  totalPaid,
  remainingBudget,
  paidCount,
  totalCount,
}: {
  totalObligations: number;
  totalPaid: number;
  remainingBudget: number;
  paidCount: number;
  totalCount: number;
}) {
  const progressPct =
    totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Obligations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(totalObligations)}
          </p>
          <p className="text-xs text-muted-foreground">
            debts + expenses + extras
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Paid This Month</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-success dark:text-success-light">
            {formatCurrency(totalPaid)}
          </p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {paidCount} / {totalCount} items
              </span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Remaining Budget</CardDescription>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${
              remainingBudget >= 0
                ? "text-success dark:text-success-light"
                : "text-danger dark:text-danger-light"
            }`}
          >
            {formatCurrency(remainingBudget)}
          </p>
          <p className="text-xs text-muted-foreground">income − obligations</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Add Extra Inline ─────────────────────────────────────────────────────────

function AddExtraRow({ monthYear }: { monthYear: string }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const createMutation = useCreateBudgetExtra();

  function handleAdd() {
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;
    createMutation.mutate(
      { form: { name: name.trim(), amount: parsedAmount }, monthYear },
      {
        onSuccess: () => {
          setName("");
          setAmount("");
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
  }

  return (
    <TableRow className="bg-transparent">
      <TableCell>
        <div className="flex items-center gap-2">
          <Plus className="size-4 text-muted-foreground" />
          <Input
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 w-40"
          />
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">Extra</Badge>
      </TableCell>
      <TableCell>
        <CurrencyInput
          placeholder="Amount"
          value={amount ? parseFloat(amount) : 0}
          onChange={(v) => setAmount(v > 0 ? String(v) : "")}
          compact
        />
      </TableCell>
      <TableCell>&mdash;</TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={handleAdd}
          disabled={
            createMutation.isPending || !name.trim() || !parseFloat(amount)
          }
        >
          {createMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          <span className="ml-1">Add</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ── Debt Row ─────────────────────────────────────────────────────────────────

function DebtRow({
  debt,
  isPaid,
  monthYear,
}: {
  debt: Debt;
  isPaid: boolean;
  monthYear: string;
}) {
  const recordPaymentMutation = useRecordPayment();
  const undoPaymentMutation = useUndoPayment();

  function handleToggle() {
    if (isPaid) {
      undoPaymentMutation.mutate({ debtId: debt.id, monthYear });
    } else {
      recordPaymentMutation.mutate({
        debt_id: debt.id,
        amount_paid: debt.monthly_payment,
        payment_date: new Date(),
        month_year: monthYear,
      });
    }
  }

  return (
    <TableRow className={isPaid ? "opacity-60" : ""}>
      <TableCell>
        <span className={isPaid ? "line-through" : "font-medium"}>
          {debt.name}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{getDebtTypeLabel(debt.type)}</Badge>
      </TableCell>
      <TableCell className="font-mono text-right">
        {formatCurrency(debt.monthly_payment)}
      </TableCell>
      <TableCell className="font-mono text-right">
        {formatCurrency(debt.current_balance)}
      </TableCell>
      <TableCell className="text-center">
        <Checkbox
          checked={isPaid}
          onCheckedChange={handleToggle}
          disabled={
            recordPaymentMutation.isPending || undoPaymentMutation.isPending
          }
        />
      </TableCell>
    </TableRow>
  );
}

// ── Expense Row ──────────────────────────────────────────────────────────────

function ExpenseRow({
  expense,
  isPaid,
  monthYear,
}: {
  expense: Expense;
  isPaid: boolean;
  monthYear: string;
}) {
  const toggleMutation = useToggleExpenseCheck();

  function handleToggle() {
    toggleMutation.mutate({
      expenseId: expense.id,
      monthYear,
      isPaid: !isPaid,
    });
  }

  return (
    <TableRow className={isPaid ? "opacity-60" : ""}>
      <TableCell>
        <span className={isPaid ? "line-through" : "font-medium"}>
          {expense.name}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {getExpenseCategoryLabel(expense.category)}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-right">
        {formatCurrency(expense.amount)}
      </TableCell>
      <TableCell className="text-center text-muted-foreground">
        &mdash;
      </TableCell>
      <TableCell className="text-center">
        <Checkbox
          checked={isPaid}
          onCheckedChange={handleToggle}
          disabled={toggleMutation.isPending}
        />
      </TableCell>
    </TableRow>
  );
}

// ── Extra Row ────────────────────────────────────────────────────────────────

function ExtraRow({
  extra,
  monthYear,
}: {
  extra: BudgetExtra;
  monthYear: string;
}) {
  const toggleMutation = useToggleBudgetExtraPaid();
  const deleteMutation = useDeleteBudgetExtra();

  function handleToggle() {
    toggleMutation.mutate({
      id: extra.id,
      monthYear,
      isPaid: !extra.is_paid,
    });
  }

  function handleDelete() {
    deleteMutation.mutate({ id: extra.id, monthYear });
  }

  return (
    <TableRow className={extra.is_paid ? "opacity-60" : ""}>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className={extra.is_paid ? "line-through" : "font-medium"}>
            {extra.name}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">Extra</Badge>
      </TableCell>
      <TableCell className="font-mono text-right">
        {formatCurrency(extra.amount)}
      </TableCell>
      <TableCell className="text-center text-muted-foreground">
        &mdash;
      </TableCell>
      <TableCell className="text-center">
        <Checkbox
          checked={extra.is_paid}
          onCheckedChange={handleToggle}
          disabled={toggleMutation.isPending}
        />
      </TableCell>
    </TableRow>
  );
}

// ── Section Header Row ───────────────────────────────────────────────────────

function SectionHeaderRow({
  label,
  subtotal,
  colSpan = 5,
}: {
  label: string;
  subtotal: number;
  colSpan?: number;
}) {
  return (
    <TableRow className="bg-muted/50 hover:bg-muted/50">
      <TableCell colSpan={2} className="font-semibold text-sm">
        {label}
      </TableCell>
      <TableCell className="font-mono text-right font-semibold">
        {formatCurrency(subtotal)}
      </TableCell>
      <TableCell colSpan={colSpan - 3} />
    </TableRow>
  );
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function BudgetSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

// ── Skipped Month Banner ─────────────────────────────────────────────────────

function SkippedMonthBanner({
  monthYear,
  onUnskip,
  isUnskipping,
}: {
  monthYear: string;
  onUnskip: () => void;
  isUnskipping: boolean;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        <CalendarCheck2 className="size-12 text-success" />
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold">
            This month was marked as pre-paid.
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            All obligations for{" "}
            {format(new Date(monthYear + "-01"), "MMMM yyyy")} were already
            handled. No balance changes were made.
          </p>
        </div>
        <Button variant="outline" onClick={onUnskip} disabled={isUnskipping}>
          {isUnskipping ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-2 size-4" />
          )}
          Unskip Month
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function MonthlyBudgetPage() {
  const [monthYear, setMonthYear] = useState(getCurrentMonthYear);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Data queries
  const { profile } = useProfile();
  const { data: debts, isLoading: debtsLoading } = useDebts();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: expenseChecks, isLoading: checksLoading } =
    useExpenseChecks(monthYear);
  const { data: extras, isLoading: extrasLoading } = useBudgetExtras(monthYear);
  const { data: incomeOverride, isLoading: incomeLoading } =
    useIncomeOverride(monthYear);
  const { data: skippedMonth, isLoading: skippedLoading } =
    useSkippedMonth(monthYear);

  const skipMonthMutation = useSkipMonth();
  const unskipMonthMutation = useUnskipMonth();

  const isSkipped = !!skippedMonth;

  // We need all debt payments for the month — fetch them per debt
  // This is handled via the individual debt payment query per debt below

  const isLoading =
    debtsLoading ||
    expensesLoading ||
    checksLoading ||
    extrasLoading ||
    incomeLoading ||
    skippedLoading;

  // ── Computed values ──────────────────────────────────────────────────────

  const activeDebts = useMemo(
    () => (debts ?? []).filter((d) => !d.is_paid_off),
    [debts],
  );

  const activeExpenses = useMemo(() => expenses ?? [], [expenses]);
  const budgetExtras = useMemo(() => extras ?? [], [extras]);

  const defaultIncome = profile?.monthly_income ?? 0;
  const effectiveIncome = incomeOverride?.income_amount ?? defaultIncome;

  // Build a set of paid expense IDs
  const paidExpenseIds = useMemo(() => {
    const set = new Set<string>();
    for (const check of expenseChecks ?? []) {
      if (check.is_paid) set.add(check.expense_id);
    }
    return set;
  }, [expenseChecks]);

  // Totals
  const debtSubtotal = useMemo(
    () => activeDebts.reduce((sum, d) => sum + d.monthly_payment, 0),
    [activeDebts],
  );

  const expenseSubtotal = useMemo(
    () => activeExpenses.reduce((sum, e) => sum + e.amount, 0),
    [activeExpenses],
  );

  const extraSubtotal = useMemo(
    () => budgetExtras.reduce((sum, e) => sum + e.amount, 0),
    [budgetExtras],
  );

  const totalObligations = debtSubtotal + expenseSubtotal + extraSubtotal;
  const remainingBudget = effectiveIncome - totalObligations;

  // Paid amounts (we sum amounts for items marked paid)
  const paidExpenseAmount = useMemo(
    () =>
      activeExpenses
        .filter((e) => paidExpenseIds.has(e.id))
        .reduce((sum, e) => sum + e.amount, 0),
    [activeExpenses, paidExpenseIds],
  );

  const paidExtraAmount = useMemo(
    () =>
      budgetExtras
        .filter((e) => e.is_paid)
        .reduce((sum, e) => sum + e.amount, 0),
    [budgetExtras],
  );

  // For debt paid totals, we need the payment data. We'll track this in the table.
  // Since we can't easily fetch all debt payments efficiently here, we use the
  // expense check pattern — but debt payments are fetched per-debt.
  // Instead, we'll use a simpler approach: track paid debt IDs via a component-level state
  // that gets populated by individual DebtRowWithPayment components.

  const paidExpenseCount = useMemo(
    () => activeExpenses.filter((e) => paidExpenseIds.has(e.id)).length,
    [activeExpenses, paidExpenseIds],
  );

  const paidExtraCount = useMemo(
    () => budgetExtras.filter((e) => e.is_paid).length,
    [budgetExtras],
  );

  const totalItems =
    activeDebts.length + activeExpenses.length + budgetExtras.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Monthly Budget"
          description="Track all your obligations against your income"
        />
        <div className="flex items-center gap-2">
          {!isLoading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isSkipped) {
                  unskipMonthMutation.mutate(monthYear);
                } else {
                  setShowSkipConfirm(true);
                }
              }}
              disabled={
                skipMonthMutation.isPending || unskipMonthMutation.isPending
              }
            >
              {skipMonthMutation.isPending || unskipMonthMutation.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <SkipForward className="mr-1.5 size-4" />
              )}
              {isSkipped ? "Unskip Month" : "Skip Month"}
            </Button>
          )}
          <MonthPicker value={monthYear} onMonthChange={setMonthYear} />
        </div>
      </div>

      <ConfirmDialog
        open={showSkipConfirm}
        onConfirm={() => {
          skipMonthMutation.mutate(monthYear, {
            onSuccess: () => setShowSkipConfirm(false),
          });
        }}
        onCancel={() => setShowSkipConfirm(false)}
        title="Skip this month?"
        description="Mark this month as pre-paid? This means you've already paid all obligations for this month outside the app. No balances will be changed."
        confirmLabel="Yes, skip month"
        loading={skipMonthMutation.isPending}
        loadingLabel="Skipping…"
      />

      {isLoading ? (
        <BudgetSkeleton />
      ) : isSkipped ? (
        <>
          <IncomeBar
            defaultIncome={defaultIncome}
            overrideAmount={incomeOverride?.income_amount ?? null}
            monthYear={monthYear}
          />

          <SummaryCards
            totalObligations={totalObligations}
            totalPaid={totalObligations}
            remainingBudget={remainingBudget}
            paidCount={totalItems}
            totalCount={totalItems}
          />

          <SkippedMonthBanner
            monthYear={monthYear}
            onUnskip={() => unskipMonthMutation.mutate(monthYear)}
            isUnskipping={unskipMonthMutation.isPending}
          />
        </>
      ) : (
        <BudgetContent
          monthYear={monthYear}
          defaultIncome={defaultIncome}
          overrideAmount={incomeOverride?.income_amount ?? null}
          effectiveIncome={effectiveIncome}
          activeDebts={activeDebts}
          activeExpenses={activeExpenses}
          budgetExtras={budgetExtras}
          paidExpenseIds={paidExpenseIds}
          debtSubtotal={debtSubtotal}
          expenseSubtotal={expenseSubtotal}
          extraSubtotal={extraSubtotal}
          totalObligations={totalObligations}
          remainingBudget={remainingBudget}
          paidExpenseAmount={paidExpenseAmount}
          paidExtraAmount={paidExtraAmount}
          paidExpenseCount={paidExpenseCount}
          paidExtraCount={paidExtraCount}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}

// ── Budget Content (needs per-debt payment status) ───────────────────────────

function BudgetContent({
  monthYear,
  defaultIncome,
  overrideAmount,
  effectiveIncome,
  activeDebts,
  activeExpenses,
  budgetExtras,
  paidExpenseIds,
  debtSubtotal,
  expenseSubtotal,
  extraSubtotal,
  totalObligations,
  remainingBudget,
  paidExpenseAmount,
  paidExtraAmount,
  paidExpenseCount,
  paidExtraCount,
  totalItems,
}: {
  monthYear: string;
  defaultIncome: number;
  overrideAmount: number | null;
  effectiveIncome: number;
  activeDebts: Debt[];
  activeExpenses: Expense[];
  budgetExtras: BudgetExtra[];
  paidExpenseIds: Set<string>;
  debtSubtotal: number;
  expenseSubtotal: number;
  extraSubtotal: number;
  totalObligations: number;
  remainingBudget: number;
  paidExpenseAmount: number;
  paidExtraAmount: number;
  paidExpenseCount: number;
  paidExtraCount: number;
  totalItems: number;
}) {
  // Fetch all debt payments for the month to determine paid status.
  // We do a single query for all debt payments for this month.
  const { data: allDebtPayments } = useAllDebtPaymentsForMonth(monthYear);

  const paidDebtIds = useMemo(() => {
    return new Set<string>(Object.keys(allDebtPayments ?? {}));
  }, [allDebtPayments]);

  const paidDebtAmount = useMemo(
    () =>
      activeDebts
        .filter((d) => paidDebtIds.has(d.id))
        .reduce((sum, d) => sum + d.monthly_payment, 0),
    [activeDebts, paidDebtIds],
  );

  const paidDebtCount = useMemo(
    () => activeDebts.filter((d) => paidDebtIds.has(d.id)).length,
    [activeDebts, paidDebtIds],
  );

  const totalPaid = paidDebtAmount + paidExpenseAmount + paidExtraAmount;
  const paidCount = paidDebtCount + paidExpenseCount + paidExtraCount;

  return (
    <>
      <IncomeBar
        defaultIncome={defaultIncome}
        overrideAmount={overrideAmount}
        monthYear={monthYear}
      />

      <SummaryCards
        totalObligations={totalObligations}
        totalPaid={totalPaid}
        remainingBudget={remainingBudget}
        paidCount={paidCount}
        totalCount={totalItems}
      />

      {/* ── Budget Table ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Breakdown</CardTitle>
          <CardDescription>
            {format(new Date(monthYear + "-01"), "MMMM yyyy")} — All debts,
            expenses, and extras
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Item</TableHead>
                  <TableHead className="w-[18%]">Type</TableHead>
                  <TableHead className="w-[18%] text-right">
                    Monthly Payment
                  </TableHead>
                  <TableHead className="w-[18%] text-right">
                    Total Balance
                  </TableHead>
                  <TableHead className="w-[16%] text-center">Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ── Debts Section ─────────────────────────────────────── */}
                <SectionHeaderRow
                  label={`Debts (${activeDebts.length})`}
                  subtotal={debtSubtotal}
                />
                {activeDebts.map((debt) => (
                  <DebtRow
                    key={debt.id}
                    debt={debt}
                    isPaid={paidDebtIds.has(debt.id)}
                    monthYear={monthYear}
                  />
                ))}
                {activeDebts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground py-4"
                    >
                      No active debts
                    </TableCell>
                  </TableRow>
                )}

                {/* ── Expenses Section ──────────────────────────────────── */}
                <SectionHeaderRow
                  label={`Expenses (${activeExpenses.length})`}
                  subtotal={expenseSubtotal}
                />
                {activeExpenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    isPaid={paidExpenseIds.has(expense.id)}
                    monthYear={monthYear}
                  />
                ))}
                {activeExpenses.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground py-4"
                    >
                      No active expenses
                    </TableCell>
                  </TableRow>
                )}

                {/* ── Extras Section ────────────────────────────────────── */}
                <SectionHeaderRow
                  label={`Extras (${budgetExtras.length})`}
                  subtotal={extraSubtotal}
                />
                {budgetExtras.map((extra) => (
                  <ExtraRow
                    key={extra.id}
                    extra={extra}
                    monthYear={monthYear}
                  />
                ))}
                <AddExtraRow monthYear={monthYear} />

                {/* ── Totals Footer ─────────────────────────────────────── */}
                <TableRow className="bg-primary/5 hover:bg-primary/5 border-t-2 border-primary/20">
                  <TableCell className="font-bold text-base" colSpan={2}>
                    TOTAL
                  </TableCell>
                  <TableCell className="font-mono text-right font-bold text-base">
                    {formatCurrency(totalObligations)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>

                <TableRow className="hover:bg-transparent border-0">
                  <TableCell className="font-semibold" colSpan={2}>
                    BUDGET (Monthly Income)
                  </TableCell>
                  <TableCell className="font-mono text-right font-semibold">
                    {formatCurrency(effectiveIncome)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>

                <TableRow className="hover:bg-transparent border-0">
                  <TableCell className="font-bold text-base" colSpan={2}>
                    REMAINING
                  </TableCell>
                  <TableCell
                    className={`font-mono text-right font-bold text-base ${
                      remainingBudget >= 0
                        ? "text-success dark:text-success-light"
                        : "text-danger dark:text-danger-light"
                    }`}
                  >
                    {formatCurrency(remainingBudget)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default withErrorBoundary(MonthlyBudgetPage, "Monthly Budget");
