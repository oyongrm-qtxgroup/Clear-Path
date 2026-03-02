import { z } from "zod";

// ── Expense category enum (matches DB CHECK constraint) ──────────────────────
export const expenseCategoryEnum = z.enum([
  "utilities",
  "subscriptions",
  "insurance",
  "rent",
  "groceries",
  "transportation",
  "healthcare",
  "other",
]);

// ── Form schema (create / edit) ──────────────────────────────────────────────
export const expenseFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  category: expenseCategoryEnum,
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(9_999_999_999_999.99, "Amount exceeds maximum"),
  due_day: z.coerce
    .number()
    .int("Due day must be a whole number")
    .min(1, "Due day must be between 1 and 31")
    .max(31, "Due day must be between 1 and 31"),
});

// ── Expense check schema (mark paid / unpaid for a month) ────────────────────
export const expenseCheckSchema = z.object({
  expense_id: z.string().uuid("Invalid expense ID"),
  month_year: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be in YYYY-MM format"),
  is_paid: z.boolean(),
  paid_at: z.coerce.date().nullable(),
});

// ── Full DB row schema for expenses ──────────────────────────────────────────
export const expenseSchema = expenseFormSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// ── Full DB row schema for expense_checks ────────────────────────────────────
export const expenseCheckRowSchema = expenseCheckSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.coerce.date(),
});

// ── Inferred types ───────────────────────────────────────────────────────────
export type ExpenseForm = z.infer<typeof expenseFormSchema>;
export type ExpenseCheck = z.infer<typeof expenseCheckSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type ExpenseCheckRow = z.infer<typeof expenseCheckRowSchema>;
