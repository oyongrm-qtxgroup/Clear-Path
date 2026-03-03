import { z } from "zod";

import { supabase, getUser } from "@/lib/supabase";
import { parseApiResponse } from "@/lib/parse-api-response";
import {
  budgetExtraSchema,
  budgetIncomeOverrideSchema,
  type BudgetExtra,
  type BudgetExtraForm,
  type BudgetIncomeOverride,
} from "@/schemas/budget.schema";

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

// ── Budget Extras — Queries ──────────────────────────────────────────────────

/**
 * Fetch all budget extras for a given month (RLS-scoped).
 */
export async function fetchBudgetExtras(
  monthYear: string,
): Promise<BudgetExtra[]> {
  const data = throwOnError(
    await supabase
      .from("budget_extras")
      .select("*")
      .eq("month_year", monthYear)
      .order("created_at", { ascending: true }),
  );

  return parseApiResponse(z.array(budgetExtraSchema), data, "budgetExtras");
}

// ── Budget Extras — Mutations ────────────────────────────────────────────────

/**
 * Create a new budget extra item for a given month.
 */
export async function createBudgetExtra(
  form: BudgetExtraForm,
  monthYear: string,
): Promise<BudgetExtra> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("budget_extras")
    .insert({
      ...form,
      user_id: userId,
      month_year: monthYear,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(budgetExtraSchema, data, "budgetExtra.create");
}

/**
 * Delete a budget extra item.
 */
export async function deleteBudgetExtra(id: string): Promise<void> {
  throwOnError(await supabase.from("budget_extras").delete().eq("id", id));
}

/**
 * Toggle the paid status of a budget extra.
 */
export async function toggleBudgetExtraPaid(
  id: string,
  isPaid: boolean,
): Promise<BudgetExtra> {
  const { data, error } = await supabase
    .from("budget_extras")
    .update({
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(budgetExtraSchema, data, "budgetExtra.toggle");
}

// ── Income Overrides — Queries ───────────────────────────────────────────────

/**
 * Fetch the income override for a given month (if any).
 * Returns null if no override exists.
 */
export async function fetchIncomeOverride(
  monthYear: string,
): Promise<BudgetIncomeOverride | null> {
  const { data, error } = await supabase
    .from("budget_income_overrides")
    .select("*")
    .eq("month_year", monthYear)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  return parseApiResponse(budgetIncomeOverrideSchema, data, "incomeOverride");
}

// ── Income Overrides — Mutations ─────────────────────────────────────────────

/**
 * Set or update the income override for a given month.
 * Uses upsert with onConflict on (user_id, month_year).
 */
export async function upsertIncomeOverride(
  monthYear: string,
  incomeAmount: number,
): Promise<BudgetIncomeOverride> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("budget_income_overrides")
    .upsert(
      {
        user_id: userId,
        month_year: monthYear,
        income_amount: incomeAmount,
      },
      { onConflict: "user_id, month_year" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(
    budgetIncomeOverrideSchema,
    data,
    "incomeOverride.upsert",
  );
}

/**
 * Delete the income override for a given month (revert to default).
 */
export async function deleteIncomeOverride(monthYear: string): Promise<void> {
  const userId = await requireUserId();

  throwOnError(
    await supabase
      .from("budget_income_overrides")
      .delete()
      .eq("user_id", userId)
      .eq("month_year", monthYear),
  );
}
