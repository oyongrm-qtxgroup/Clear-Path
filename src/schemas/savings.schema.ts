import { z } from "zod";

// ── Base form schema (without cross-field refinement) for DB row extension ───
export const savingsGoalFormBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  target_amount: z.coerce
    .number()
    .positive("Target amount must be greater than 0")
    .max(9_999_999_999_999.99, "Amount exceeds maximum"),
  target_date: z.coerce.date({ message: "A valid target date is required" }),
  starting_amount: z.coerce
    .number()
    .min(0, "Starting amount cannot be negative")
    .max(9_999_999_999_999.99, "Amount exceeds maximum")
    .default(0),
});

// ── Form schema (create / edit) — includes cross-field validation ────────────
export const savingsGoalFormSchema = savingsGoalFormBaseSchema.refine(
  (data) => data.starting_amount <= data.target_amount,
  {
    message: "Starting amount cannot exceed the target amount",
    path: ["starting_amount"],
  },
);

// ── Savings log schema (monthly contribution) ────────────────────────────────
export const savingsLogSchema = z.object({
  goal_id: z.string().uuid("Invalid goal ID"),
  amount_saved: z.coerce
    .number()
    .positive("Amount saved must be greater than 0")
    .max(9_999_999_999_999.99, "Amount exceeds maximum"),
  month_year: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be in YYYY-MM format"),
});

// ── Full DB row schema for savings_goals ─────────────────────────────────────
export const savingsGoalSchema = savingsGoalFormBaseSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// ── Full DB row schema for savings_logs ──────────────────────────────────────
export const savingsLogRowSchema = savingsLogSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  logged_at: z.coerce.date(),
});

// ── Inferred types ───────────────────────────────────────────────────────────
export type SavingsGoalForm = z.infer<typeof savingsGoalFormSchema>;
export type SavingsLog = z.infer<typeof savingsLogSchema>;
export type SavingsGoal = z.infer<typeof savingsGoalSchema>;
export type SavingsLogRow = z.infer<typeof savingsLogRowSchema>;
