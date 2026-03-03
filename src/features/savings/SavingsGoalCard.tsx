import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { MoreVertical, Pencil, Trash2, Target } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import type { SavingsGoal, SavingsLogRow } from "@/schemas/savings.schema";
import {
  formatCurrency,
  formatMonthYear,
  calculateRequiredMonthlySavings,
  getCurrentMonthYear,
} from "@/lib/utils";
import {
  calculateTotalSaved,
  buildSavingsProjection,
} from "@/lib/savings-projections";
import { useDeleteSavingsGoal, useLogMonthlySavings } from "@/hooks/useSavings";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog, CurrencyInput } from "@/components/common";
import SavingsGoalForm from "./SavingsGoalForm";

// ── Props ────────────────────────────────────────────────────────────────────

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  logs: SavingsLogRow[];
}

// ── Custom tooltip ───────────────────────────────────────────────────────────

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

export default function SavingsGoalCard({ goal, logs }: SavingsGoalCardProps) {
  const deleteSavingsGoal = useDeleteSavingsGoal();
  const logMonthlySavings = useLogMonthlySavings();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [logAmount, setLogAmount] = useState("");

  // ── Derived values ─────────────────────────────────────────────────────

  const totalSaved = calculateTotalSaved(logs) + goal.starting_amount;
  const progressPercent =
    goal.target_amount > 0
      ? Math.min(100, (totalSaved / goal.target_amount) * 100)
      : 0;

  const isGoalReached = totalSaved >= goal.target_amount;

  const requiredMonthly = calculateRequiredMonthlySavings(
    goal.target_amount,
    totalSaved,
    goal.target_date,
  );

  const targetDateStr = format(goal.target_date, "MMM yyyy");
  const isOverdue = new Date() > goal.target_date && !isGoalReached;

  // Projection data for chart
  const projection = buildSavingsProjection(goal, logs);

  // ── Handlers ───────────────────────────────────────────────────────────

  function confirmDelete() {
    deleteSavingsGoal.mutate(goal.id);
    setShowDeleteDialog(false);
  }

  function handleLogSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = parseFloat(logAmount);
    if (!amount || amount <= 0) return;

    logMonthlySavings.mutate(
      {
        goalId: goal.id,
        amountSaved: amount,
        monthYear: getCurrentMonthYear(),
      },
      { onSuccess: () => setLogAmount("") },
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      <Card className="relative overflow-hidden transition-colors">
        {/* Left accent bar */}
        <div
          className={
            isGoalReached
              ? "absolute inset-y-0 left-0 w-1.5 bg-success"
              : isOverdue
                ? "absolute inset-y-0 left-0 w-1.5 bg-danger"
                : "absolute inset-y-0 left-0 w-1.5 bg-brand"
          }
        />

        <CardHeader className="pl-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="text-muted-foreground size-4" />
              <CardTitle className="text-base">{goal.name}</CardTitle>
            </div>

            <div className="flex items-center gap-2">
              {isGoalReached && <Badge variant="success">Reached!</Badge>}
              {isOverdue && <Badge variant="destructive">Overdue</Badge>}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 size-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pl-5">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {formatCurrency(totalSaved)} of{" "}
                {formatCurrency(goal.target_amount)}
              </span>
              <span className="font-medium">{progressPercent.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Target Date</p>
              <p className="font-medium">{targetDateStr}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Starting Amount</p>
              <p className="font-medium">
                {formatCurrency(goal.starting_amount)}
              </p>
            </div>
            {!isGoalReached && (
              <>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Required / Month
                  </p>
                  <p className="font-medium">
                    {formatCurrency(requiredMonthly)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Remaining</p>
                  <p className="font-medium">
                    {formatCurrency(
                      Math.max(goal.target_amount - totalSaved, 0),
                    )}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ── Log this month's savings ──────────────────────────────────── */}
          {!isGoalReached && (
            <form
              onSubmit={handleLogSubmit}
              className="flex items-end gap-2 pt-1"
            >
              <div className="flex-1 space-y-1">
                <Label htmlFor={`log-${goal.id}`} className="text-xs">
                  Log this month's savings
                </Label>
                <CurrencyInput
                  id={`log-${goal.id}`}
                  placeholder="0.00"
                  value={logAmount ? parseFloat(logAmount) : 0}
                  onChange={(v) => setLogAmount(v > 0 ? String(v) : "")}
                  compact
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="h-8"
                disabled={
                  logMonthlySavings.isPending ||
                  !logAmount ||
                  parseFloat(logAmount) <= 0
                }
              >
                {logMonthlySavings.isPending ? "Saving…" : "Log"}
              </Button>
            </form>
          )}

          {/* ── Projection chart ─────────────────────────────────────────── */}
          {projection.length > 1 && (
            <div className="pt-2">
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                Savings Projection
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={projection}
                  margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted/40"
                  />
                  <XAxis
                    dataKey="monthYear"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) =>
                      format(
                        new Date(
                          Number(v.split("-")[0]),
                          Number(v.split("-")[1]) - 1,
                          1,
                        ),
                        "MMM yy",
                      )
                    }
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: number) =>
                      new Intl.NumberFormat("en", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(v)
                    }
                    width={48}
                  />
                  <Tooltip content={<ChartTooltip />} />

                  {/* Goal reference line */}
                  <ReferenceLine
                    y={goal.target_amount}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="6 3"
                    label={{
                      value: "Goal",
                      position: "insideTopRight",
                      fontSize: 10,
                      fill: "hsl(var(--destructive))",
                    }}
                  />

                  {/* Planned line (dashed blue) */}
                  <Line
                    type="monotone"
                    dataKey="planned"
                    name="Planned"
                    stroke="var(--chart-1)"
                    strokeDasharray="6 3"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />

                  {/* Actual line (solid green, null for future months) */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual"
                    stroke="var(--color-success)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Savings Goal</DialogTitle>
          </DialogHeader>
          <SavingsGoalForm
            defaultValues={goal}
            onSuccess={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ──────────────────────────────────────────────── */}
      <ConfirmDialog
        open={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        title="Delete Savings Goal"
        description={`Are you sure you want to delete "${goal.name}"? All associated logs will also be removed. This cannot be undone.`}
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
