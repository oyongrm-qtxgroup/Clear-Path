-- ============================================================================
-- ClearPath – Row-Level Security Policies & Auto-Profile Trigger
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_delete ON public.profiles;
CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. debts
-- ---------------------------------------------------------------------------
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS debts_select ON public.debts;
CREATE POLICY debts_select ON public.debts
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS debts_insert ON public.debts;
CREATE POLICY debts_insert ON public.debts
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS debts_update ON public.debts;
CREATE POLICY debts_update ON public.debts
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS debts_delete ON public.debts;
CREATE POLICY debts_delete ON public.debts
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. debt_payments
-- ---------------------------------------------------------------------------
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS debt_payments_select ON public.debt_payments;
CREATE POLICY debt_payments_select ON public.debt_payments
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS debt_payments_insert ON public.debt_payments;
CREATE POLICY debt_payments_insert ON public.debt_payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS debt_payments_update ON public.debt_payments;
CREATE POLICY debt_payments_update ON public.debt_payments
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS debt_payments_delete ON public.debt_payments;
CREATE POLICY debt_payments_delete ON public.debt_payments
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. expenses
-- ---------------------------------------------------------------------------
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS expenses_select ON public.expenses;
CREATE POLICY expenses_select ON public.expenses
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS expenses_insert ON public.expenses;
CREATE POLICY expenses_insert ON public.expenses
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS expenses_update ON public.expenses;
CREATE POLICY expenses_update ON public.expenses
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS expenses_delete ON public.expenses;
CREATE POLICY expenses_delete ON public.expenses
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. expense_checks
-- ---------------------------------------------------------------------------
ALTER TABLE public.expense_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS expense_checks_select ON public.expense_checks;
CREATE POLICY expense_checks_select ON public.expense_checks
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS expense_checks_insert ON public.expense_checks;
CREATE POLICY expense_checks_insert ON public.expense_checks
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS expense_checks_update ON public.expense_checks;
CREATE POLICY expense_checks_update ON public.expense_checks
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS expense_checks_delete ON public.expense_checks;
CREATE POLICY expense_checks_delete ON public.expense_checks
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. savings_goals
-- ---------------------------------------------------------------------------
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS savings_goals_select ON public.savings_goals;
CREATE POLICY savings_goals_select ON public.savings_goals
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS savings_goals_insert ON public.savings_goals;
CREATE POLICY savings_goals_insert ON public.savings_goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS savings_goals_update ON public.savings_goals;
CREATE POLICY savings_goals_update ON public.savings_goals
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS savings_goals_delete ON public.savings_goals;
CREATE POLICY savings_goals_delete ON public.savings_goals
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7. savings_logs
-- ---------------------------------------------------------------------------
ALTER TABLE public.savings_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS savings_logs_select ON public.savings_logs;
CREATE POLICY savings_logs_select ON public.savings_logs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS savings_logs_insert ON public.savings_logs;
CREATE POLICY savings_logs_insert ON public.savings_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS savings_logs_update ON public.savings_logs;
CREATE POLICY savings_logs_update ON public.savings_logs
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS savings_logs_delete ON public.savings_logs;
CREATE POLICY savings_logs_delete ON public.savings_logs
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 8. Auto-create a profile row when a new user signs up
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
