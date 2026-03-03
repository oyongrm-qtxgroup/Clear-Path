import { format } from "date-fns";
import { Link } from "react-router-dom";

import { useDashboardSummary, useProfile, useIncomeOverride } from "@/hooks";
import { formatCurrency, getCurrentMonthYear } from "@/lib/utils";
import { PageHeader, withErrorBoundary } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// ── Circular progress (SVG) ──────────────────────────────────────────────────

function CircularProgress({
  value,
  size = 72,
  strokeWidth = 7,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-all duration-500"
      />
    </svg>
  );
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function WidgetSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function SnapshotSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();
  const { profile } = useProfile();
  const currentMonth = getCurrentMonthYear();
  const { data: incomeOverride } = useIncomeOverride(currentMonth);

  const effectiveIncome =
    incomeOverride?.income_amount ?? profile?.monthly_income ?? 0;
  const remainingBudget =
    effectiveIncome - (data?.total_monthly_obligations ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your financial overview at a glance"
      />

      {/* ── Stat widgets ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <WidgetSkeleton />
            <WidgetSkeleton />
            <WidgetSkeleton />
            <WidgetSkeleton />
          </>
        ) : data ? (
          <>
            {/* Widget 1 — Total Debt */}
            <Card>
              <CardHeader>
                <CardDescription>Total Debt</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500 dark:text-amber-400">
                  {formatCurrency(data.total_debt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  outstanding balance
                </p>
              </CardContent>
            </Card>

            {/* Widget 2 — Monthly Obligations */}
            <Card>
              <CardHeader>
                <CardDescription>Monthly Obligations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.total_monthly_obligations)}
                </p>
                <p className="text-xs text-muted-foreground">
                  payments + expenses
                </p>
              </CardContent>
            </Card>

            {/* Widget 3 — This Month's Progress */}
            <Card>
              <CardHeader>
                <CardDescription>This Month's Progress</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <CircularProgress
                  value={
                    data.current_month_items_total > 0
                      ? (data.current_month_items_paid /
                          data.current_month_items_total) *
                        100
                      : 0
                  }
                />
                <div>
                  <p className="text-lg font-semibold">
                    {data.current_month_items_paid} /{" "}
                    {data.current_month_items_total}
                  </p>
                  <p className="text-xs text-muted-foreground">paid</p>
                </div>
              </CardContent>
            </Card>

            {/* Widget 4 — Debt-Free Date */}
            <Card>
              <CardHeader>
                <CardDescription>Debt-Free Date</CardDescription>
              </CardHeader>
              <CardContent>
                {data.total_debt === 0 ? (
                  <p className="text-lg font-semibold text-green-600">
                    You're debt free! 🎉
                  </p>
                ) : data.debt_free_date ? (
                  <>
                    <p className="text-2xl font-bold">
                      {format(data.debt_free_date, "MMM yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      projected payoff
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Unable to calculate
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* ── Snapshot section ─────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <SnapshotSkeleton />
            <SnapshotSkeleton />
            <SnapshotSkeleton />
          </>
        ) : data ? (
          <>
            {/* Debt Snapshot */}
            <Card>
              <CardHeader>
                <CardTitle>Debt Snapshot</CardTitle>
                <CardDescription>
                  Top 3 unpaid debts by priority
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.top_debts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active debts
                  </p>
                ) : (
                  data.top_debts.map((debt) => (
                    <div
                      key={debt.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{debt.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Due day {debt.due_day} &middot;{" "}
                          {formatCurrency(debt.current_balance)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {debt.type.replaceAll("_", " ")}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Expense Snapshot */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Snapshot</CardTitle>
                <CardDescription>This month's expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {data.unpaid_expenses_count}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Unpaid expenses</p>
                    <p className="text-xs text-muted-foreground">
                      remaining this month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Savings Snapshot */}
            <Card>
              <CardHeader>
                <CardTitle>Savings Snapshot</CardTitle>
                <CardDescription>Progress toward your goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.savings_summary.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No savings goals yet
                  </p>
                ) : (
                  data.savings_summary.map((goal) => {
                    const pct =
                      goal.target_amount > 0
                        ? Math.min(
                            (goal.total_saved / goal.target_amount) * 100,
                            100,
                          )
                        : 0;
                    return (
                      <div key={goal.name} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{goal.name}</span>
                          <span className="text-muted-foreground">
                            {Math.round(pct)}%
                          </span>
                        </div>
                        <Progress value={pct} />
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(goal.total_saved)} /{" "}
                          {formatCurrency(goal.target_amount)}
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* ── Budget Summary ───────────────────────────────────────────── */}
      {!isLoading && effectiveIncome > 0 && data && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Budget Summary</CardTitle>
                <CardDescription>
                  Monthly income vs. obligations
                </CardDescription>
              </div>
              <Link
                to="/budget"
                className="text-sm font-medium text-primary hover:underline"
              >
                View Full Budget &rarr;
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-lg font-bold">
                  {formatCurrency(effectiveIncome)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Obligations</p>
                <p className="text-lg font-bold">
                  {formatCurrency(data.total_monthly_obligations)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p
                  className={`text-lg font-bold ${
                    remainingBudget >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(remainingBudget)}
                </p>
              </div>
            </div>
            <Progress
              value={
                effectiveIncome > 0
                  ? Math.min(
                      (data.total_monthly_obligations / effectiveIncome) * 100,
                      100,
                    )
                  : 0
              }
              className="mt-4 h-2"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {effectiveIncome > 0
                ? `${Math.round((data.total_monthly_obligations / effectiveIncome) * 100)}% of income allocated`
                : "Set your income in Settings"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withErrorBoundary(DashboardPage, "Dashboard");
