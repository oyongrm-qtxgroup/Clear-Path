import { z } from "zod";

// ── Debt type enum (matches DB CHECK constraint) ─────────────────────────────
export const debtTypeEnum = z.enum([
  "credit_card",
  "personal_loan",
  "car_loan",
  "mortgage",
  "student_loan",
  "other",
]);

// ── Base form schema (without cross-field refinement) for DB row extension ───
export const debtFormBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  type: debtTypeEnum,
  original_amount: z.coerce
    .number()
    .positive("Original amount must be greater than 0")
    .max(9_999_999_999_999.99, "Amount exceeds maximum"),
  current_balance: z.coerce
    .number()
    .min(0, "Current balance cannot be negative")
    .max(9_999_999_999_999.99, "Amount exceeds maximum"),
  monthly_payment: z.coerce
    .number()
    .positive("Monthly payment must be greater than 0")
    .max(9_999_999_999_999.99, "Amount exceeds maximum"),
  interest_rate: z.coerce
    .number()
    .min(0, "Interest rate cannot be negative")
    .max(999.99, "Interest rate exceeds maximum"),
  due_day: z.coerce
    .number()
    .int("Due day must be a whole number")
    .min(1, "Due day must be between 1 and 31")
    .max(31, "Due day must be between 1 and 31"),
  priority: z.coerce
    .number()
    .int("Priority must be a whole number")
    .min(0, "Priority cannot be negative")
    .default(0),
});

// ── Form schema (create / edit) — includes cross-field validation ────────────
export const debtFormSchema = debtFormBaseSchema.refine(
  (data) =>
    data.monthly_payment <= data.current_balance || data.current_balance === 0,
  {
    message: "Monthly payment should not exceed the current balance",
    path: ["monthly_payment"],
  },
);

// ── Payment schema ───────────────────────────────────────────────────────────
export const debtPaymentSchema = z.object({
  debt_id: z.string().uuid("Invalid debt ID"),
  amount_paid: z.coerce
    .number()
    .positive("Payment amount must be greater than 0")
    .max(9_999_999_999_999.99, "Amount exceeds maximum"),
  payment_date: z.coerce.date({ message: "A valid payment date is required" }),
  month_year: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be in YYYY-MM format"),
});

// ── Full DB row schema ───────────────────────────────────────────────────────
export const debtSchema = debtFormBaseSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  is_paid_off: z.boolean(),
  paid_off_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// ── Full DB row schema for debt_payments ─────────────────────────────────────
export const debtPaymentRowSchema = debtPaymentSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.coerce.date(),
});

// ── Inferred types ───────────────────────────────────────────────────────────
export type DebtForm = z.infer<typeof debtFormSchema>;
export type DebtPayment = z.infer<typeof debtPaymentSchema>;
export type Debt = z.infer<typeof debtSchema>;
export type DebtPaymentRow = z.infer<typeof debtPaymentRowSchema>;
