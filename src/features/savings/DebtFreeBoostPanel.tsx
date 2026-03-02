import { useMemo } from "react";
import {
  TrendingUp,
  PartyPopper,
  ArrowRight,
  CalendarCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import type { Debt } from "@/schemas/debt.schema";
import type { SavingsGoal, SavingsLogRow } from "@/schemas/savings.schema";
import {
  calculateDebtFreeBoostProjection,
  calculateDebtPayoffMilestones,
  calculateTotalSaved,
  type DebtFreeBoostEntry,
  type DebtPayoffMilestone,
} from "@/lib/savings-projections";
import { formatCurrency, formatMonthYear } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ── Props ────────────────────────────────────────────────────────────────────

interface DebtFreeBoostPanelProps {
  goal: SavingsGoal;
  logs: SavingsLogRow[];
  debts: Debt[];
}

// ── Chart tooltip ────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  name: string;
  value: number | null;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{formatMonthYear(label)}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}:{" "}
          {entry.value != null ? formatCurrency(entry.value) : "—"}
        </p>
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DebtFreeBoostPanel({
  goal,
  logs,
  debts,
}: DebtFreeBoostPanelProps) {
  const activeDebts = debts.filter(
    (d) => !d.is_paid_off && d.current_balance > 0,
  );

  // ── No active debts → congratulatory state ─────────────────────────────

  if (activeDebts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PartyPopper className="size-5 text-green-600" />
            <CardTitle className="text-lg">You're Debt-Free!</CardTitle>
          </div>
          <CardDescription>
            Congratulations! With no active debts, every peso you earn can go
            straight into building your savings. Keep up the great work!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // ── Compute projections & milestones ───────────────────────────────────

  const totalSaved = useMemo(() => calculateTotalSaved(logs), [logs]);

  const projection: DebtFreeBoostEntry[] = useMemo(
    () => calculateDebtFreeBoostProjection(debts, goal, logs),
    [debts, goal, logs],
  );

  // Base monthly savings (same logic as in the projection utility)
  const baseMonthlySavings = useMemo(() => {
    const remainingToSave = Math.max(
      goal.target_amount - goal.starting_amount - totalSaved,
      0,
    );
    return projection.length > 0 ? remainingToSave / projection.length : 0;
  }, [goal, totalSaved, projection.length]);

  const milestones: DebtPayoffMilestone[] = useMemo(
    () => calculateDebtPayoffMilestones(debts, baseMonthlySavings),
    [debts, baseMonthlySavings],
  );

  if (projection.length === 0) {
    return null;
  }

  // Total freed-up amount once all tracked debts are paid off
  const totalMonthlyFreed =
    milestones.length > 0
      ? milestones[milestones.length - 1].cumulativeMonthlyBoost
      : 0;

  // Chart data — sample to keep the chart readable for very long projections
  const chartData = useMemo(() => {
    if (projection.length <= 24) return projection;
    // For long projections, sample every Nth month + always include last
    const step = Math.ceil(projection.length / 24);
    const sampled = projection.filter((_, i) => i % step === 0);
    const last = projection[projection.length - 1];
    if (sampled[sampled.length - 1]?.monthYear !== last.monthYear) {
      sampled.push(last);
    }
    return sampled;
  }, [projection]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-green-600" />
          <CardTitle className="text-lg">Debt-Free Boost</CardTitle>
        </div>
        <CardDescription>
          As debts are paid off, freed-up payments accelerate your savings.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── Summary message ──────────────────────────────────────────── */}
        <div className="rounded-lg border border-green-200 bg-green-50/60 p-4 dark:border-green-900 dark:bg-green-950/30">
          <p className="text-sm">
            As your debts are paid off, you'll free up{" "}
            <span className="font-bold text-green-700 dark:text-green-400">
              {formatCurrency(totalMonthlyFreed)}/month
            </span>{" "}
            in additional savings capacity.
          </p>
        </div>

        {/* ── Payoff timeline ──────────────────────────────────────────── */}
        {milestones.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Payoff Timeline</h4>
            <div className="space-y-0">
              {milestones.map((ms, idx) => (
                <div
                  key={ms.debtName + ms.payoffMonth}
                  className="relative flex gap-3"
                >
                  {/* vertical connector line */}
                  {idx < milestones.length - 1 && (
                    <div className="absolute left-[11px] top-7 h-[calc(100%-12px)] w-px bg-border" />
                  )}

                  {/* dot */}
                  <div className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background">
                    <CalendarCheck className="size-3.5 text-green-600" />
                  </div>

                  {/* content */}
                  <div className="flex-1 pb-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">{ms.debtName}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatMonthYear(ms.payoffMonth)}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1 text-xs">
                      <span>
                        +{formatCurrency(ms.monthlyAmountFreed)}/mo freed
                      </span>
                      <ArrowRight className="size-3" />
                      <span className="font-medium text-foreground">
                        {formatCurrency(ms.cumulativeMonthlySavingsRate)}/mo
                        total savings
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* ── Line chart: With Boost vs Without ────────────────────────── */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">
            Savings Growth: With Boost vs. Without
          </h4>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="monthYear"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => {
                  const [y, m] = v.split("-");
                  return `${m}/${y.slice(2)}`;
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`}
                width={55}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="top"
                height={30}
                formatter={(value: string) => (
                  <span className="text-xs">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="withoutBoost"
                name="Without Boost"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="withBoost"
                name="With Boost"
                stroke="hsl(142.1 76.2% 36.3%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Summary stats ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Active Debts</p>
            <p className="font-semibold">{activeDebts.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              Projected (w/ Boost)
            </p>
            <p className="font-semibold text-green-600">
              {formatCurrency(
                projection[projection.length - 1]?.withBoost ?? 0,
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              Projected (w/o Boost)
            </p>
            <p className="text-muted-foreground font-semibold">
              {formatCurrency(
                projection[projection.length - 1]?.withoutBoost ?? 0,
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
