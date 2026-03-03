import { z } from "zod";

import { supabase, getUser } from "@/lib/supabase";
import { parseApiResponse } from "@/lib/parse-api-response";
import {
  debtSchema,
  debtPaymentSchema,
  type Debt,
  type DebtForm,
  type DebtPayment,
} from "@/schemas/debt.schema";

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
 * Fetch all debts for the current user (RLS-scoped).
 * Ordered by priority ASC, then interest_rate DESC.
 */
export async function fetchDebts(): Promise<Debt[]> {
  const data = throwOnError(
    await supabase
      .from("debts")
      .select("*")
      .order("priority", { ascending: true })
      .order("interest_rate", { ascending: false }),
  );

  return parseApiResponse(z.array(debtSchema), data, "debts");
}

/**
 * Fetch a single debt by ID (RLS-scoped).
 */
export async function fetchDebtById(id: string): Promise<Debt> {
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(debtSchema, data, "debt");
}

// ── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new debt and return the inserted row.
 */
export async function createDebt(form: DebtForm): Promise<Debt> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("debts")
    .insert({ ...form, user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(debtSchema, data, "debt.create");
}

/**
 * Update an existing debt and return the updated row.
 */
export async function updateDebt(
  id: string,
  form: Partial<DebtForm>,
): Promise<Debt> {
  const { data, error } = await supabase
    .from("debts")
    .update(form)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  return parseApiResponse(debtSchema, data, "debt.update");
}

/**
 * Hard-delete a debt (cascades to its payments via FK).
 */
export async function deleteDebt(id: string): Promise<void> {
  throwOnError(await supabase.from("debts").delete().eq("id", id));
}

// ── Payments ─────────────────────────────────────────────────────────────────

/**
 * Fetch all payment records for a debt, newest first.
 */
export async function fetchDebtPayments(
  debtId: string,
): Promise<DebtPayment[]> {
  const data = throwOnError(
    await supabase
      .from("debt_payments")
      .select("debt_id, amount_paid, payment_date, month_year")
      .eq("debt_id", debtId)
      .order("payment_date", { ascending: false }),
  );

  return parseApiResponse(z.array(debtPaymentSchema), data, "debtPayments");
}

/**
 * Fetch all debt payment records for a given month (across all debts).
 * Returns one row per debt that has a payment recorded for `monthYear`.
 */
export async function fetchAllDebtPaymentsForMonth(
  monthYear: string,
): Promise<DebtPayment[]> {
  const data = throwOnError(
    await supabase
      .from("debt_payments")
      .select("debt_id, amount_paid, payment_date, month_year")
      .eq("month_year", monthYear),
  );

  return parseApiResponse(
    z.array(debtPaymentSchema),
    data,
    "allDebtPaymentsForMonth",
  );
}

/**
 * Record a payment against a debt.
 *
 * **Approach:** Sequential updates (no server-side RPC). Steps:
 * 1. Insert the payment row.
 * 2. Fetch the debt's current_balance.
 * 3. Compute new balance = current_balance − amount_paid (floored at 0).
 * 4. Update the debt with the new balance; if ≤ 0 mark as paid off.
 *
 * This is *not* an atomic transaction — if step 4 fails the payment row
 * will still exist. In a production app you'd wrap this in a Postgres
 * function / RPC for atomicity. Documented here for clarity.
 */
export async function recordPayment(payment: DebtPayment): Promise<void> {
  const userId = await requireUserId();

  // 1. Insert payment
  throwOnError(
    await supabase.from("debt_payments").insert({
      debt_id: payment.debt_id,
      user_id: userId,
      amount_paid: payment.amount_paid,
      payment_date:
        payment.payment_date instanceof Date
          ? payment.payment_date.toISOString().split("T")[0]
          : String(payment.payment_date),
      month_year: payment.month_year,
    }),
  );

  // 2. Fetch current balance
  const { data: debt, error: debtError } = await supabase
    .from("debts")
    .select("*")
    .eq("id", payment.debt_id)
    .single();
  if (debtError) throw new Error(debtError.message);
  if (!debt) throw new Error("Debt not found");

  // 3. Compute new balance
  const newBalance = Math.max(
    0,
    Number(debt.current_balance) - payment.amount_paid,
  );

  // 4. Update debt — mark paid off if balance is zero
  const updates: Record<string, unknown> = { current_balance: newBalance };
  if (newBalance <= 0) {
    updates.is_paid_off = true;
    updates.paid_off_at = new Date().toISOString();
    updates.current_balance = 0;
  }

  throwOnError(
    await supabase.from("debts").update(updates).eq("id", payment.debt_id),
  );
}

/**
 * Undo a previously recorded payment for a given month.
 *
 * **Approach:** Sequential updates (same caveat as `recordPayment`).
 * 1. Look up the payment row to get amount_paid.
 * 2. Delete the payment row.
 * 3. Re-add amount_paid to the debt's current_balance.
 * 4. Reset is_paid_off / paid_off_at if the debt was marked paid this month.
 */
export async function undoPayment(
  debtId: string,
  monthYear: string,
): Promise<void> {
  // 1. Fetch the payment to find out how much was paid
  const { data: paymentRow, error: paymentError } = await supabase
    .from("debt_payments")
    .select("*")
    .eq("debt_id", debtId)
    .eq("month_year", monthYear)
    .single();
  if (paymentError) throw new Error(paymentError.message);
  if (!paymentRow) throw new Error("Payment not found");

  // 2. Delete the payment row
  throwOnError(
    await supabase
      .from("debt_payments")
      .delete()
      .eq("debt_id", debtId)
      .eq("month_year", monthYear),
  );

  // 3. Fetch current debt state
  const { data: debt, error: debtError } = await supabase
    .from("debts")
    .select("*")
    .eq("id", debtId)
    .single();
  if (debtError) throw new Error(debtError.message);
  if (!debt) throw new Error("Debt not found");

  // 4. Restore balance and reset paid-off flag
  const restoredBalance =
    Number(debt.current_balance) + Number(paymentRow.amount_paid);
  const updates: Record<string, unknown> = {
    current_balance: restoredBalance,
  };

  if (debt.is_paid_off) {
    updates.is_paid_off = false;
    updates.paid_off_at = null;
  }

  throwOnError(await supabase.from("debts").update(updates).eq("id", debtId));
}
