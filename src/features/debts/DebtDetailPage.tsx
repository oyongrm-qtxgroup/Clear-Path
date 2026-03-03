import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { z } from "zod";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

import { useDebt, useDebtPayments } from "@/hooks/useDebts";
import { DEBT_TYPES } from "@/constants";
import { formatCurrency, calculatePayoffDate, cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, withErrorBoundary } from "@/components/common";

import type { Debt, DebtPayment } from "@/schemas/debt.schema";

// ── Color map by debt type ───────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  credit_card: "bg-danger",
  personal_loan: "bg-chart-1",
  car_loan: "bg-warning",
  mortgage: "bg-chart-4",
  student_loan: "bg-chart-3",
  other: "bg-muted-gray",
};

const CHART_COLOR = "var(--chart-1)"; // blue-600

// ── URL param schema ─────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid("Invalid debt ID");

// ── Payoff projection helpers ────────────────────────────────────────────────

interface ProjectionPoint {
  month: string;
  balance: number;
  projected: number;
}

function buildPayoffProjection(
  debt: Debt,
  _payments: DebtPayment[],
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  const monthlyRate = debt.interest_rate / 12 / 100;
  let remaining = debt.current_balance;
  const MAX_MONTHS = 120; // 10-year cap for the chart

  // Reconstruct historical balances by replaying payments backwards to find
  // an approximation — but since we don't store historical balance snapshots,
  // we'll just show the projected payoff from the *current* balance forward.

  // Start point: today
  const now = new Date();
  let cursor = new Date(now.getFullYear(), now.getMonth(), 1);

  for (let i = 0; i <= MAX_MONTHS; i++) {
    const label = format(cursor, "MMM yyyy");
    points.push({
      month: label,
      balance: Math.round(remaining * 100) / 100,
      projected: Math.round(remaining * 100) / 100,
    });

    if (remaining <= 0) break;

    // Apply interest then subtract payment
    const interest = remaining * monthlyRate;
    remaining = remaining + interest - debt.monthly_payment;
    if (remaining < 0) remaining = 0;

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return points;
}

// ── Payment history with running balance ─────────────────────────────────────

interface PaymentRow {
  monthYear: string;
  datePaid: string;
  amount: number;
  runningBalance: number;
}

function buildPaymentHistory(
  debt: Debt,
  payments: DebtPayment[],
): PaymentRow[] {
  // Sort oldest → newest so we can accumulate
  const sorted = [...payments].sort((a, b) =>
    a.month_year.localeCompare(b.month_year),
  );

  // We walk forward from original_amount, subtracting each payment
  // This is an approximation (doesn't replicate exact interest accrual)
  let balance = debt.original_amount;

  return sorted.map((p) => {
    balance = Math.max(0, balance - p.amount_paid);
    return {
      monthYear: p.month_year,
      datePaid: format(new Date(p.payment_date), "MMM dd, yyyy"),
      amount: p.amount_paid,
      runningBalance: Math.round(balance * 100) / 100,
    };
  });
}

// ── Skeleton loader ──────────────────────────────────────────────────────────

function DebtDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Back button skeleton */}
      <Skeleton className="h-8 w-32" />

      {/* Summary card skeleton */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-2 bg-muted" />
        <CardHeader className="pl-6">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardHeader>
        <CardContent className="pl-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-32" />
              </div>
            ))}
          </div>
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-28" />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Chart skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Payment history skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

function DebtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── Validate URL param is a valid UUID before making any API call ─────
  const isValidId = uuidSchema.safeParse(id).success;

  const {
    data: debt,
    isLoading: debtLoading,
    error: debtError,
  } = useDebt(isValidId ? id! : "");
  const { data: payments = [], isLoading: paymentsLoading } = useDebtPayments(
    isValidId ? id! : "",
  );

  const projection = useMemo(
    () => (debt ? buildPayoffProjection(debt, payments) : []),
    [debt, payments],
  );

  const paymentHistory = useMemo(
    () => (debt ? buildPaymentHistory(debt, payments) : []),
    [debt, payments],
  );

  // ── Invalid ID — show 404-style empty state without network request ──

  if (!isValidId) {
    return (
      <div className="py-12">
        <EmptyState
          icon={AlertTriangle}
          title="Debt Not Found"
          description="The debt ID in the URL is invalid. Please check the link and try again."
          illustration="no-data"
          action={{ label: "Back to Debts", onClick: () => navigate("/debts") }}
        />
      </div>
    );
  }

  // ── Loading / error states ───────────────────────────────────────────────

  if (debtLoading || paymentsLoading) {
    return <DebtDetailSkeleton />;
  }

  if (debtError || !debt) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-destructive font-medium">
          {debtError?.message ?? "Debt not found."}
        </p>
        <Button variant="outline" onClick={() => navigate("/debts")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debts
        </Button>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────

  const typeLabel =
    DEBT_TYPES.find((t) => t.value === debt.type)?.label ?? debt.type;
  const barColor = TYPE_COLORS[debt.type] ?? TYPE_COLORS.other;

  const progressPercent =
    debt.original_amount > 0
      ? Math.min(
          100,
          ((debt.original_amount - debt.current_balance) /
            debt.original_amount) *
            100,
        )
      : 0;

  const payoffDate = calculatePayoffDate(
    debt.current_balance,
    debt.monthly_payment,
    debt.interest_rate,
  );

  const totalPaid = debt.original_amount - debt.current_balance;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Back Button ─────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/debts")}
        className="-ml-2"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Debts
      </Button>

      {/* ── Debt Summary Card ───────────────────────────────────────── */}
      <Card className="relative overflow-hidden">
        <div className={cn("absolute inset-y-0 left-0 w-2", barColor)} />

        <CardHeader className="pl-6">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-2xl">{debt.name}</CardTitle>
            <Badge variant="secondary">{typeLabel}</Badge>
            {debt.is_paid_off && <Badge variant="success">Paid Off</Badge>}
          </div>
        </CardHeader>

        <CardContent className="pl-6 space-y-6">
          {/* Key figures */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold">
                {formatCurrency(debt.current_balance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Original Amount</p>
              <p className="text-lg font-semibold">
                {formatCurrency(debt.original_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Payment</p>
              <p className="text-lg font-semibold">
                {formatCurrency(debt.monthly_payment)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Interest Rate</p>
              <p className="text-lg font-semibold">{debt.interest_rate}%</p>
            </div>
          </div>

          <Separator />

          {/* Second row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-lg font-semibold">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due Day</p>
              <p className="text-lg font-semibold">
                {debt.due_day}
                <span className="text-muted-foreground text-sm ml-1">
                  of each month
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Estimated Payoff Date
              </p>
              <p className="text-lg font-semibold">
                {debt.is_paid_off
                  ? "Complete"
                  : payoffDate
                    ? format(payoffDate, "MMMM yyyy")
                    : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payments Made</p>
              <p className="text-lg font-semibold">{payments.length}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Payoff Progress</span>
              <span>{progressPercent.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* ── Payoff Timeline Chart ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Payoff Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {projection.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No projection data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={projection}
                margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat("en", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(v)
                  }
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar
                  dataKey="balance"
                  fill={CHART_COLOR}
                  radius={[4, 4, 0, 0]}
                  name="Remaining Balance"
                  opacity={0.7}
                />
                <Line
                  dataKey="projected"
                  stroke={CHART_COLOR}
                  strokeWidth={2}
                  dot={false}
                  name="Projected"
                  strokeDasharray="6 3"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Payment History Table ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No payments recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Date Paid</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {formatMonthLabel(row.monthYear)}
                    </TableCell>
                    <TableCell>{row.datePaid}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.runningBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tiny helper to turn "2026-03" into "Mar 2026" ────────────────────────────

function formatMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return format(d, "MMM yyyy");
}

export default withErrorBoundary(DebtDetailPage, "Debt Detail");
