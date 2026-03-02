import { z } from "zod";

import { supabase, getUser } from "@/lib/supabase";
import { parseApiResponse } from "@/lib/parse-api-response";
import {
  savingsGoalSchema,
  savingsLogRowSchema,
  type SavingsGoal,
  type SavingsGoalForm,
  type SavingsLogRow,
} from "@/schemas/savings.schema";

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
 * Fetch all savings goals for the current user (RLS-scoped).
 * Ordered by target_date ASC.
 */
export async function fetchSavingsGoals(): Promise<SavingsGoal[]> {
  const data = throwOnError(
    await supabase
      .from("savings_goals")
      .select("*")
      .order("target_date", { ascending: true }),
  );

  return parseApiResponse(z.array(savingsGoalSchema), data, "savingsGoals");
}

/**
 * Fetch all savings logs for a given goal, newest first.
 */
export async function fetchSavingsLogs(
  goalId: string,
): Promise<SavingsLogRow[]> {
  const data = throwOnError(
    await supabase
      .from("savings_logs")
      .select("*")
      .eq("goal_id", goalId)
      .order("month_year", { ascending: false }),
  );

  return parseApiResponse(z.array(savingsLogRowSchema), data, "savingsLogs");
}

/**
 * Fetch a single goal together with all of its logs.
 */
export async function fetchGoalWithLogs(
  goalId: string,
): Promise<{ goal: SavingsGoal; logs: SavingsLogRow[] }> {
  const [goalResult, logsResult] = await Promise.all([
    supabase.from("savings_goals").select("*").eq("id", goalId).single(),
    supabase
      .from("savings_logs")
      .select("*")
      .eq("goal_id", goalId)
      .order("month_year", { ascending: false }),
  ]);

  if (goalResult.error) throw new Error(goalResult.error.message);
  if (logsResult.error) throw new Error(logsResult.error.message);

  return {
    goal: parseApiResponse(savingsGoalSchema, goalResult.data, "savingsGoal"),
    logs: parseApiResponse(
      z.array(savingsLogRowSchema),
      logsResult.data,
      "savingsLogs",
    ),
  };
}

// ── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new savings goal and return the inserted row.
 */
export async function createSavingsGoal(
  form: SavingsGoalForm,
): Promise<SavingsGoal> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      ...form,
      target_date:
        form.target_date instanceof Date
          ? form.target_date.toISOString().split("T")[0]
          : String(form.target_date),
      user_id: userId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(savingsGoalSchema, data, "savingsGoal.create");
}

/**
 * Update an existing savings goal and return the updated row.
 */
export async function updateSavingsGoal(
  id: string,
  form: Partial<SavingsGoalForm>,
): Promise<SavingsGoal> {
  const payload: Record<string, unknown> = { ...form };

  // Normalise date to ISO date string if present
  if (form.target_date !== undefined) {
    payload.target_date =
      form.target_date instanceof Date
        ? form.target_date.toISOString().split("T")[0]
        : String(form.target_date);
  }

  const { data, error } = await supabase
    .from("savings_goals")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(savingsGoalSchema, data, "savingsGoal.update");
}

/**
 * Hard-delete a savings goal (cascades to its logs via FK).
 */
export async function deleteSavingsGoal(id: string): Promise<void> {
  throwOnError(await supabase.from("savings_goals").delete().eq("id", id));
}

/**
 * Log (or update) the monthly savings entry for a goal.
 *
 * Uses Supabase upsert with `onConflict: "goal_id,month_year"` so that
 * re-submitting the same month simply overwrites the previous amount.
 */
export async function logMonthlySavings(data: {
  goalId: string;
  amountSaved: number;
  monthYear: string;
}): Promise<SavingsLogRow> {
  const userId = await requireUserId();

  const { data: row, error } = await supabase
    .from("savings_logs")
    .upsert(
      {
        goal_id: data.goalId,
        user_id: userId,
        amount_saved: data.amountSaved,
        month_year: data.monthYear,
      },
      { onConflict: "goal_id,month_year" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(savingsLogRowSchema, row, "savingsLog.upsert");
}
