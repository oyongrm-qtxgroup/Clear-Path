import { z } from "zod";

// ── Budget Extra form schema (create / edit) ─────────────────────────────────
export const budgetExtraFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(9_999_999_999_999.99, "Amount exceeds maximum"),
});

// ── Income override schema ───────────────────────────────────────────────────
export const incomeOverrideFormSchema = z.object({
  income_amount: z.coerce
    .number()
    .min(0, "Income cannot be negative")
    .max(9_999_999_999_999.99, "Amount exceeds maximum"),
});

// ── Full DB row schemas ──────────────────────────────────────────────────────

export const budgetExtraSchema = budgetExtraFormSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  month_year: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be in YYYY-MM format"),
  is_paid: z.boolean(),
  paid_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const budgetIncomeOverrideSchema = incomeOverrideFormSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  month_year: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be in YYYY-MM format"),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// ── Skipped month schema ─────────────────────────────────────────────────────

export const skippedMonthSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  month_year: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be in YYYY-MM format"),
  created_at: z.coerce.date(),
});

// ── Inferred types ───────────────────────────────────────────────────────────
export type BudgetExtraForm = z.infer<typeof budgetExtraFormSchema>;
export type BudgetExtra = z.infer<typeof budgetExtraSchema>;
export type IncomeOverrideForm = z.infer<typeof incomeOverrideFormSchema>;
export type BudgetIncomeOverride = z.infer<typeof budgetIncomeOverrideSchema>;
export type SkippedMonth = z.infer<typeof skippedMonthSchema>;
