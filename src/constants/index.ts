// ---------------------------------------------------------------------------
// Debt types
// ---------------------------------------------------------------------------
export const DEBT_TYPES = [
  { value: "credit_card", label: "Credit Card" },
  { value: "personal_loan", label: "Personal Loan" },
  { value: "car_loan", label: "Car Loan" },
  { value: "mortgage", label: "Mortgage" },
  { value: "student_loan", label: "Student Loan" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Expense categories
// ---------------------------------------------------------------------------
export const EXPENSE_CATEGORIES = [
  { value: "utilities", label: "Utilities" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "insurance", label: "Insurance" },
  { value: "rent", label: "Rent" },
  { value: "groceries", label: "Groceries" },
  { value: "transportation", label: "Transportation" },
  { value: "healthcare", label: "Healthcare" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Debt sort / payoff strategies
// ---------------------------------------------------------------------------
export const SORT_METHODS = {
  AVALANCHE: "avalanche",
  SNOWBALL: "snowball",
} as const;

// ---------------------------------------------------------------------------
// React Query keys
// ---------------------------------------------------------------------------
export const QUERY_KEYS = {
  auth: {
    user: ["auth", "user"] as const,
    profile: ["auth", "profile"] as const,
  },
  dashboard: {
    summary: ["dashboard", "summary"] as const,
  },
  debts: {
    all: ["debts"] as const,
    detail: (id: string) => ["debts", "detail", id] as const,
    payments: (id: string) => ["debts", "payments", id] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    checks: (monthYear: string) => ["expenses", "checks", monthYear] as const,
  },
  savings: {
    goals: ["savings", "goals"] as const,
    logs: (goalId: string) => ["savings", "logs", goalId] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------
export const DEFAULT_CURRENCY = "PHP" as const;
