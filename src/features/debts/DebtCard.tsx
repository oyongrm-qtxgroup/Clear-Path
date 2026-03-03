import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { MoreVertical, Pencil, Trash2, History } from "lucide-react";

import type { Debt, DebtPayment } from "@/schemas/debt.schema";
import { DEBT_TYPES } from "@/constants";
import {
  cn,
  formatCurrency,
  formatMonthYear,
  calculatePayoffDate,
  daysUntilDueThisMonth,
} from "@/lib/utils";
import {
  useRecordPayment,
  useUndoPayment,
  useDeleteDebt,
} from "@/hooks/useDebts";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/common";
import DebtForm from "./DebtForm";

// ── Color map by debt type ───────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  credit_card: "bg-danger",
  personal_loan: "bg-chart-1",
  car_loan: "bg-warning",
  mortgage: "bg-chart-4",
  student_loan: "bg-chart-3",
  other: "bg-muted-gray",
};

// ── Props ────────────────────────────────────────────────────────────────────

interface DebtCardProps {
  debt: Debt;
  monthYear: string;
  paymentRecord?: DebtPayment;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DebtCard({
  debt,
  monthYear,
  paymentRecord,
}: DebtCardProps) {
  const navigate = useNavigate();

  const recordPayment = useRecordPayment();
  const undoPayment = useUndoPayment();
  const deleteDebt = useDeleteDebt();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUndoDialog, setShowUndoDialog] = useState(false);

  // ── Derived values ───────────────────────────────────────────────────────

  const isPaid = !!paymentRecord;
  const isPaidOff = debt.is_paid_off;

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

  // Overdue: due day has passed this month and no payment recorded
  const isOverdue =
    !isPaid && !isPaidOff && daysUntilDueThisMonth(debt.due_day) < 0;

  // Due soon: within 3 days and not yet paid
  const isDueSoon =
    !isPaid &&
    !isPaidOff &&
    !isOverdue &&
    daysUntilDueThisMonth(debt.due_day) >= 0 &&
    daysUntilDueThisMonth(debt.due_day) <= 3;

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handlePaymentToggle(checked: boolean) {
    if (checked) {
      recordPayment.mutate({
        debt_id: debt.id,
        amount_paid: debt.monthly_payment,
        payment_date: new Date(),
        month_year: monthYear,
      });
    } else {
      setShowUndoDialog(true);
    }
  }

  function confirmUndoPayment() {
    undoPayment.mutate({ debtId: debt.id, monthYear });
    setShowUndoDialog(false);
  }

  function confirmDelete() {
    deleteDebt.mutate(debt.id, {
      onSuccess: () => setShowDeleteDialog(false),
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Card
        className={cn(
          "relative overflow-hidden transition-colors",
          isPaid && "bg-success/10 dark:bg-success/5",
        )}
      >
        {/* Left color bar */}
        <div className={cn("absolute inset-y-0 left-0 w-1.5", barColor)} />

        <CardContent className="pl-5 pr-4 py-4">
          {/* Top row: name, badges, menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-tight">
                {debt.name}
              </h3>
              <Badge variant="secondary" className="text-[11px]">
                {typeLabel}
              </Badge>
              {isPaidOff && (
                <Badge variant="success" className="text-[11px]">
                  Paid Off
                </Badge>
              )}
              {isPaid && !isPaidOff && (
                <Badge variant="success" className="text-[11px]">
                  Paid
                </Badge>
              )}
              {isDueSoon && (
                <Badge variant="warning" className="text-[11px]">
                  Due Soon
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="text-[11px]">
                  Overdue
                </Badge>
              )}
            </div>

            {/* Three-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/debts/${debt.id}`)}>
                  <History className="mr-2 h-4 w-4" />
                  View History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Balance (large) */}
          <p className="mt-3 text-2xl font-bold tracking-tight">
            {formatCurrency(debt.current_balance)}
          </p>

          {/* Details row */}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              Monthly:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(debt.monthly_payment)}
              </span>
            </span>
            <span>
              Interest:{" "}
              <span className="font-medium text-foreground">
                {debt.interest_rate}%
              </span>
            </span>
            <span>
              Payoff:{" "}
              <span className="font-medium text-foreground">
                {isPaidOff
                  ? "Complete"
                  : payoffDate
                    ? format(payoffDate, "MMM yyyy")
                    : "Never"}
              </span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progressPercent.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercent} />
          </div>

          {/* Payment checkbox */}
          <div className="mt-4 flex items-center gap-3">
            <Checkbox
              id={`pay-${debt.id}`}
              checked={isPaid}
              onCheckedChange={(checked) =>
                handlePaymentToggle(checked === true)
              }
              disabled={
                isPaidOff || recordPayment.isPending || undoPayment.isPending
              }
              className="h-5 w-5"
            />
            <label
              htmlFor={`pay-${debt.id}`}
              className={cn(
                "text-sm font-medium select-none cursor-pointer",
                isPaidOff && "text-muted-foreground cursor-not-allowed",
              )}
            >
              Paid for {formatMonthYear(monthYear)}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ── Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Debt</DialogTitle>
          </DialogHeader>
          <DebtForm
            initialData={debt}
            onSuccess={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ──────────────────────────────────────────────── */}
      <ConfirmDialog
        open={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Debt"
        description={`Are you sure you want to delete "${debt.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteDebt.isPending}
        loadingLabel="Deleting…"
      />

      {/* ── Undo Payment Confirm ────────────────────────────────────────── */}
      <ConfirmDialog
        open={showUndoDialog}
        onCancel={() => setShowUndoDialog(false)}
        onConfirm={confirmUndoPayment}
        title="Undo Payment"
        description={`This will undo the payment for ${formatMonthYear(monthYear)}. The balance will be restored. Continue?`}
        confirmLabel="Undo Payment"
        destructive
      />
    </>
  );
}
