import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import {
  savingsGoalFormSchema,
  type SavingsGoal,
  type SavingsGoalForm as SavingsGoalFormValues,
} from "@/schemas/savings.schema";
import { cn } from "@/lib/utils";
import { useCreateSavingsGoal, useUpdateSavingsGoal } from "@/hooks/useSavings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ── Props ────────────────────────────────────────────────────────────────────

interface SavingsGoalFormProps {
  defaultValues?: SavingsGoal;
  onSuccess: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SavingsGoalForm({
  defaultValues,
  onSuccess,
}: SavingsGoalFormProps) {
  const isEditing = !!defaultValues;

  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();

  const form = useForm<SavingsGoalFormValues>({
    resolver: zodResolver(
      savingsGoalFormSchema,
    ) as Resolver<SavingsGoalFormValues>,
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          target_amount: defaultValues.target_amount,
          target_date: new Date(defaultValues.target_date),
          starting_amount: defaultValues.starting_amount,
        }
      : {
          name: "",
          target_amount: 0,
          target_date: new Date(),
          starting_amount: 0,
        },
  });

  const isSubmitting = createGoal.isPending || updateGoal.isPending;

  async function onSubmit(values: SavingsGoalFormValues) {
    if (isEditing) {
      await updateGoal.mutateAsync({ id: defaultValues.id, form: values });
    } else {
      await createGoal.mutateAsync(values);
    }
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
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Emergency Fund" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Amount */}
        <FormField
          control={form.control}
          name="target_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Starting Amount */}
        <FormField
          control={form.control}
          name="starting_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starting Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Date */}
        <FormField
          control={form.control}
          name="target_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Target Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {field.value ? format(field.value, "PPP") : "Pick a date"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isEditing ? "Update Goal" : "Create Goal"}
        </Button>
      </form>
    </Form>
  );
}
