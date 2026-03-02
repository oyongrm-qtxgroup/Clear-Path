import { z } from "zod";

import { supabase, getUser } from "@/lib/supabase";
import { parseApiResponse } from "@/lib/parse-api-response";
import {
  expenseSchema,
  expenseCheckRowSchema,
  type Expense,
  type ExpenseForm,
  type ExpenseCheckRow,
} from "@/schemas/expense.schema";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Throw a descriptive error when Supabase returns an error object. */
function throwOnError<T>(
  result: { data: T; error: null } | { data: null; error: { message: string } },
): T {
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data as T;
}

/** Return the current user's ID or throw. */
async function requireUserId(): Promise<string> {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all active expenses for the current user (RLS-scoped).
 * Ordered by category ASC, then name ASC.
 */
export async function fetchExpenses(): Promise<Expense[]> {
  const data = throwOnError(
    await supabase
      .from("expenses")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true }),
  );

  return parseApiResponse(z.array(expenseSchema), data, "expenses");
}

/**
 * Fetch all expense checks for a given month (RLS-scoped).
 */
export async function fetchExpenseChecks(
  monthYear: string,
): Promise<ExpenseCheckRow[]> {
  const data = throwOnError(
    await supabase
      .from("expense_checks")
      .select("*")
      .eq("month_year", monthYear),
  );

  return parseApiResponse(
    z.array(expenseCheckRowSchema),
    data,
    "expenseChecks",
  );
}

// ── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new expense and return the inserted row.
 */
export async function createExpense(form: ExpenseForm): Promise<Expense> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...form, user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(expenseSchema, data, "expense.create");
}

/**
 * Update an existing expense and return the updated row.
 */
export async function updateExpense(
  id: string,
  form: Partial<ExpenseForm>,
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .update(form)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(expenseSchema, data, "expense.update");
}

/**
 * Soft-delete an expense by setting is_active to false.
 */
export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from("expenses")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Toggle the paid status of an expense for a given month.
 *
 * - Marking paid: upserts with is_paid=true, paid_at=now()
 * - Marking unpaid: upserts with is_paid=false, paid_at=null
 *
 * Uses Supabase upsert with onConflict on (expense_id, month_year).
 */
export async function toggleExpenseCheck(
  expenseId: string,
  monthYear: string,
  isPaid: boolean,
): Promise<ExpenseCheckRow> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("expense_checks")
    .upsert(
      {
        expense_id: expenseId,
        month_year: monthYear,
        user_id: userId,
        is_paid: isPaid,
        paid_at: isPaid ? new Date().toISOString() : null,
      },
      { onConflict: "expense_id, month_year" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(expenseCheckRowSchema, data, "expenseCheck.toggle");
}
