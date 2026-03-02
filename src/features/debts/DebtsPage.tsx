import { useMemo, useState } from "react";
import { PiggyBank, Plus, ChevronDown } from "lucide-react";

import { SORT_METHODS } from "@/constants";
import type { Debt } from "@/schemas/debt.schema";
import { useDebts } from "@/hooks/useDebts";
import { useDebtFreeConfetti } from "@/hooks/useDebtFreeConfetti";
import {
  formatCurrency,
  getCurrentMonthYear,
  daysUntilDueThisMonth,
} from "@/lib/utils";

import {
  PageHeader,
  EmptyState,
  MonthPicker,
  withErrorBoundary,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import DebtForm from "./DebtForm";

// ── Helpers ──────────────────────────────────────────────────────────────────

type SortMethod = (typeof SORT_METHODS)[keyof typeof SORT_METHODS];

function sortDebts(debts: Debt[], method: SortMethod): Debt[] {
  return [...debts].sort(
    (a, b) =>
      method === SORT_METHODS.AVALANCHE
        ? b.interest_rate - a.interest_rate // highest rate first
        : a.current_balance - b.current_balance, // lowest balance first
  );
}

// ── Skeleton loader ──────────────────────────────────────────────────────────

function DebtCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

function DebtsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-px w-full" />

      {/* Sort toggle skeleton */}
      <Skeleton className="h-9 w-64" />

      {/* Month picker skeleton */}
      <Skeleton className="h-9 w-56" />

      {/* Debt cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <DebtCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ── Debt Card ────────────────────────────────────────────────────────────────

function DebtCard({ debt }: { debt: Debt }) {
  const progress =
    debt.original_amount > 0
      ? ((debt.original_amount - debt.current_balance) / debt.original_amount) *
        100
      : 0;

  const isOverdue =
    !debt.is_paid_off && daysUntilDueThisMonth(debt.due_day) < 0;
  const isDueSoon =
    !debt.is_paid_off &&
    !isOverdue &&
    daysUntilDueThisMonth(debt.due_day) >= 0 &&
    daysUntilDueThisMonth(debt.due_day) <= 3;

  function getStatusBadge() {
    if (debt.is_paid_off) return <Badge variant="secondary">Paid Off</Badge>;
    if (isOverdue) return <Badge variant="destructive">Overdue</Badge>;
    if (isDueSoon) return <Badge variant="warning">Due Soon</Badge>;
    return (
      <Badge variant="default">{formatCurrency(debt.current_balance)}</Badge>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{debt.name}</CardTitle>
            <p className="text-muted-foreground text-xs capitalize">
              {debt.type.replace("_", " ")}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>
          <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Interest Rate</p>
            <p className="font-medium">{debt.interest_rate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Monthly Payment</p>
            <p className="font-medium">
              {formatCurrency(debt.monthly_payment)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Due Day</p>
            <p className="font-medium">{debt.due_day}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Original Amount</p>
            <p className="font-medium">
              {formatCurrency(debt.original_amount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

function DebtsPage() {
  const { data: debts, isLoading } = useDebts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortMethod, setSortMethod] = useState<SortMethod>(
    SORT_METHODS.AVALANCHE,
  );
  const [monthYear, setMonthYear] = useState(getCurrentMonthYear);
  const [paidOffOpen, setPaidOffOpen] = useState(false);

  // Split debts into active / paid-off and sort active debts
  const { activeDebts, paidOffDebts, totalBalance } = useMemo(() => {
    if (!debts) return { activeDebts: [], paidOffDebts: [], totalBalance: 0 };

    const active = debts.filter((d) => !d.is_paid_off);
    const paidOff = debts.filter((d) => d.is_paid_off);
    const total = active.reduce((sum, d) => sum + d.current_balance, 0);

    return {
      activeDebts: sortDebts(active, sortMethod),
      paidOffDebts: paidOff,
      totalBalance: total,
    };
  }, [debts, sortMethod]);

  // 🎉 Debt-free celebration: fire confetti when ALL debts are paid off
  const isDebtFree = !!debts && debts.length > 0 && activeDebts.length === 0;
  useDebtFreeConfetti(isDebtFree);

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return <DebtsPageSkeleton />;
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!debts || debts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Debts"
          action={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1.5 size-4" />
                  Add Debt
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Debt</DialogTitle>
                  <DialogDescription>
                    Enter the details of the debt you want to track.
                  </DialogDescription>
                </DialogHeader>
                <DebtForm onSuccess={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          }
        />
        <EmptyState
          icon={PiggyBank}
          title="No debts yet"
          description="Start tracking your debts to build a payoff plan."
          action={{
            label: "Add Your First Debt",
            onClick: () => setDialogOpen(true),
          }}
        />
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="My Debts"
        description={
          <>
            Total outstanding:{" "}
            <Badge variant="destructive" className="ml-1 align-middle">
              {formatCurrency(totalBalance)}
            </Badge>
          </>
        }
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 size-4" />
                Add Debt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Debt</DialogTitle>
                <DialogDescription>
                  Enter the details of the debt you want to track.
                </DialogDescription>
              </DialogHeader>
              <DebtForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Sort method toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs
          value={sortMethod}
          onValueChange={(v) => setSortMethod(v as SortMethod)}
        >
          <TabsList>
            <TabsTrigger value={SORT_METHODS.AVALANCHE}>Avalanche</TabsTrigger>
            <TabsTrigger value={SORT_METHODS.SNOWBALL}>Snowball</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Month picker */}
        <MonthPicker value={monthYear} onMonthChange={setMonthYear} />
      </div>

      {/* Active debts grid */}
      {activeDebts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeDebts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center text-sm">
          All debts have been paid off! 🎉
        </p>
      )}

      {/* Paid-off debts collapsible */}
      {paidOffDebts.length > 0 && (
        <Collapsible open={paidOffOpen} onOpenChange={setPaidOffOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <ChevronDown
                className={`size-4 transition-transform ${paidOffOpen ? "rotate-180" : ""}`}
              />
              Paid Off Debts ({paidOffDebts.length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paidOffDebts.map((debt) => (
                <DebtCard key={debt.id} debt={debt} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export default withErrorBoundary(DebtsPage, "Debts");
