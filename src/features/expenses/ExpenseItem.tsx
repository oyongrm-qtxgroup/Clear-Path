import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";

import type { Expense, ExpenseCheckRow } from "@/schemas/expense.schema";
import {
  expenseFormSchema,
  type ExpenseForm as ExpenseFormValues,
} from "@/schemas/expense.schema";
import { EXPENSE_CATEGORIES } from "@/constants";
import { cn, formatCurrency } from "@/lib/utils";
import {
  useToggleExpenseCheck,
  useUpdateExpense,
  useDeleteExpense,
} from "@/hooks/useExpenses";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/common";
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
import { ConfirmDialog } from "@/components/common";

// ── Helpers ──────────────────────────────────────────────────────────────────

const categoryLabel = (value: string) =>
  EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;

// ── Props ────────────────────────────────────────────────────────────────────

interface ExpenseItemProps {
  expense: Expense;
  check?: ExpenseCheckRow;
  monthYear: string;
}

// ── Edit Form (inline) ──────────────────────────────────────────────────────

function EditExpenseForm({
  expense,
  onSuccess,
}: {
  expense: Expense;
  onSuccess: () => void;
}) {
  const updateExpense = useUpdateExpense();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema) as Resolver<ExpenseFormValues>,
    defaultValues: {
      name: expense.name,
      category: expense.category,
      amount: expense.amount,
      due_day: expense.due_day,
    },
  });

  async function onSubmit(values: ExpenseFormValues) {
    await updateExpense.mutateAsync({ id: expense.id, form: values });
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
              <FormLabel>Due Day</FormLabel>
              <FormControl>
                <Input type="number" min="1" max="31" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={updateExpense.isPending} size="sm">
            {updateExpense.isPending && (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ExpenseItem({
  expense,
  check,
  monthYear,
}: ExpenseItemProps) {
  const { mutate: toggle, isPending: isToggling } = useToggleExpenseCheck();
  const deleteExpense = useDeleteExpense();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isPaid = check?.is_paid ?? false;

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleToggle(checked: boolean) {
    toggle({ expenseId: expense.id, monthYear, isPaid: checked });
  }

  function confirmDelete() {
    deleteExpense.mutate(expense.id);
    setShowDeleteDialog(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-4 py-2 transition-colors hover:bg-muted/50",
          isPaid && "opacity-75",
        )}
      >
        {/* Checkbox */}
        <Checkbox
          checked={isPaid}
          onCheckedChange={handleToggle}
          disabled={isToggling}
          aria-label={`Mark ${expense.name} as ${isPaid ? "unpaid" : "paid"}`}
        />

        {/* Name */}
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium",
            isPaid && "text-muted-foreground line-through",
          )}
        >
          {expense.name}
        </span>

        {/* Amount */}
        <span
          className={cn(
            "shrink-0 text-sm font-medium tabular-nums",
            isPaid && "text-muted-foreground",
          )}
        >
          {formatCurrency(expense.amount)}
        </span>

        {/* Due Day */}
        <span
          className={cn(
            "text-muted-foreground hidden shrink-0 text-xs sm:inline",
            isPaid && "text-muted-foreground/60",
          )}
        >
          Day {expense.due_day}
        </span>

        {/* Category Badge */}
        <Badge
          variant="outline"
          className={cn(
            "hidden shrink-0 text-[11px] sm:inline-flex",
            isPaid && "opacity-60",
          )}
        >
          {categoryLabel(expense.category)}
        </Badge>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              aria-label="Expense actions"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <EditExpenseForm
            expense={expense}
            onSuccess={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteDialog}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        title="Delete Expense"
        description={`Are you sure you want to delete "${expense.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
