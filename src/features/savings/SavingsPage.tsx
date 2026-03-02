import { useState } from "react";
import { PiggyBank, Plus } from "lucide-react";

import { useSavingsGoals, useSavingsLogs } from "@/hooks/useSavings";
import { useDebts } from "@/hooks/useDebts";

import { PageHeader, EmptyState, withErrorBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import SavingsGoalCard from "./SavingsGoalCard";
import SavingsGoalForm from "./SavingsGoalForm";
import DebtFreeBoostPanel from "./DebtFreeBoostPanel";

// ── Skeleton loader ──────────────────────────────────────────────────────────

function GoalCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function SavingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <GoalCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ── Logs wrapper ─────────────────────────────────────────────────────────────
// Each card needs its own logs query, so we wrap it in a small component
// to call hooks at top level per goal.

function GoalWithLogs({
  goal,
}: {
  goal: ReturnType<typeof useSavingsGoals>["data"] extends
    | (infer G)[]
    | undefined
    ? G
    : never;
}) {
  const { data: logs = [] } = useSavingsLogs(goal.id);
  return <SavingsGoalCard goal={goal} logs={logs} />;
}

// ── Page ─────────────────────────────────────────────────────────────────────

function SavingsPage() {
  const [addOpen, setAddOpen] = useState(false);

  const { data: goals, isLoading: goalsLoading } = useSavingsGoals();
  const { data: debts } = useDebts();

  if (goalsLoading) return <SavingsPageSkeleton />;

  const hasGoals = goals && goals.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Savings Planner"
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 size-4" /> Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Savings Goal</DialogTitle>
              </DialogHeader>
              <SavingsGoalForm onSuccess={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!hasGoals && (
        <EmptyState
          icon={PiggyBank}
          title="No savings goals yet"
          description="Create a goal to start tracking your progress toward financial targets."
          action={{ label: "Add Goal", onClick: () => setAddOpen(true) }}
        />
      )}

      {/* ── Goal cards ────────────────────────────────────────────────────── */}
      {hasGoals && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalWithLogs key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {/* ── Debt-Free Boost panel ─────────────────────────────────────────── */}
      {hasGoals && <DebtFreeBoostSection goals={goals} debts={debts ?? []} />}
    </div>
  );
}

// ── Debt-Free Boost section ──────────────────────────────────────────────────
// Shows boost projection for the first goal (primary goal).

function DebtFreeBoostSection({
  goals,
  debts,
}: {
  goals: NonNullable<ReturnType<typeof useSavingsGoals>["data"]>;
  debts: NonNullable<ReturnType<typeof useDebts>["data"]>;
}) {
  const primaryGoal = goals[0];
  const { data: logs = [] } = useSavingsLogs(primaryGoal.id);

  return <DebtFreeBoostPanel goal={primaryGoal} logs={logs} debts={debts} />;
}

export default withErrorBoundary(SavingsPage, "Savings");
