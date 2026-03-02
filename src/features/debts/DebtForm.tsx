import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
  debtFormSchema,
  type Debt,
  type DebtForm as DebtFormValues,
} from "@/schemas/debt.schema";
import { DEBT_TYPES } from "@/constants";
import { calculatePayoffDate } from "@/lib/utils";
import { useCreateDebt, useUpdateDebt } from "@/hooks/useDebts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// ── Props ────────────────────────────────────────────────────────────────────

interface DebtFormProps {
  initialData?: Debt;
  onSuccess: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DebtForm({ initialData, onSuccess }: DebtFormProps) {
  const isEditing = !!initialData;

  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema) as Resolver<DebtFormValues>,
    defaultValues: initialData
      ? {
          name: initialData.name,
          type: initialData.type,
          original_amount: initialData.original_amount,
          current_balance: initialData.current_balance,
          monthly_payment: initialData.monthly_payment,
          interest_rate: initialData.interest_rate,
          due_day: initialData.due_day,
          priority: initialData.priority,
        }
      : {
          name: "",
          type: "credit_card",
          original_amount: 0,
          current_balance: 0,
          monthly_payment: 0,
          interest_rate: 0,
          due_day: 1,
          priority: 0,
        },
  });

  const watched = form.watch([
    "current_balance",
    "monthly_payment",
    "interest_rate",
    "original_amount",
  ]);
  const [currentBalance, monthlyPayment, interestRate, originalAmount] =
    watched;

  // Prefill current_balance from original_amount when creating
  useEffect(() => {
    if (!isEditing) {
      form.setValue("current_balance", originalAmount, {
        shouldValidate: true,
      });
    }
  }, [isEditing, originalAmount, form]);

  // Compute payoff date preview
  const payoffDate = calculatePayoffDate(
    currentBalance,
    monthlyPayment,
    interestRate,
  );

  const isSubmitting = createDebt.isPending || updateDebt.isPending;

  async function onSubmit(values: DebtFormValues) {
    if (isEditing) {
      updateDebt.mutate({ id: initialData.id, form: values }, { onSuccess });
    } else {
      createDebt.mutate(values, { onSuccess });
    }
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
                <Input placeholder="e.g. BDO Credit Card" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select debt type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DEBT_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Original Amount */}
        <FormField
          control={form.control}
          name="original_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Original Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                    PHP
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    className="pl-12"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Current Balance */}
        <FormField
          control={form.control}
          name="current_balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Balance</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                    PHP
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    className="pl-12"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Monthly Payment */}
        <FormField
          control={form.control}
          name="monthly_payment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Payment</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                    PHP
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    className="pl-12"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Interest Rate */}
        <FormField
          control={form.control}
          name="interest_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interest Rate (% per year)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} {...field} />
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
                <Input type="number" min={1} max={31} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priority */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payoff Date Preview */}
        <div className="rounded-md border p-3 text-sm">
          <span className="text-muted-foreground font-medium">
            Estimated payoff:{" "}
          </span>
          {monthlyPayment > 0 && currentBalance > 0 ? (
            payoffDate ? (
              <span className="font-semibold">
                {payoffDate.toLocaleDateString("en-PH", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            ) : (
              <span className="text-destructive">
                Payment too low — debt will never be paid off
              </span>
            )
          ) : (
            <span className="text-muted-foreground">
              Enter balance &amp; payment to preview
            </span>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isEditing ? "Update Debt" : "Create Debt"}
        </Button>
      </form>
    </Form>
  );
}
