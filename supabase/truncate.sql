-- ============================================================================
-- ClearPath – Truncate All Seed Data
-- ============================================================================
-- Removes all user-created data so you can test the empty-state UI/UX.
-- The profile row is kept (you stay logged in) but all financial data is wiped.
--
-- TO UNDO: re-run seed.sql in the Supabase SQL Editor.
-- ============================================================================

-- Truncate child tables first (respects FK ordering), then parents.
-- CASCADE handles any remaining FK dependencies automatically.
TRUNCATE TABLE
  public.savings_logs,
  public.savings_goals,
  public.expense_checks,
  public.expenses,
  public.debt_payments,
  public.debts,
  public.budget_extras,
  public.budget_income_overrides
CASCADE;

-- Reset profile financial fields but keep the auth row intact
UPDATE public.profiles
SET monthly_income = 0,
    updated_at     = now();
