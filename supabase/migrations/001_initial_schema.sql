-- ============================================================================
-- ClearPath – Initial Schema Migration
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helper: auto-update updated_at on row modification
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text,
  currency      text        NOT NULL DEFAULT 'PHP',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. debts
-- ---------------------------------------------------------------------------
CREATE TABLE public.debts (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            text          NOT NULL,
  type            text          NOT NULL CHECK (type IN ('credit_card','personal_loan','car_loan','mortgage','student_loan','other')),
  original_amount numeric(15,2) NOT NULL CHECK (original_amount > 0),
  current_balance numeric(15,2) NOT NULL CHECK (current_balance >= 0),
  monthly_payment numeric(15,2) NOT NULL CHECK (monthly_payment > 0),
  interest_rate   numeric(5,2)  NOT NULL DEFAULT 0 CHECK (interest_rate >= 0),
  due_day         int           NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  priority        int           NOT NULL DEFAULT 0,
  is_paid_off     boolean       NOT NULL DEFAULT false,
  paid_off_at     timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_debts_user_id    ON public.debts(user_id);
CREATE INDEX idx_debts_is_paid_off ON public.debts(is_paid_off);

CREATE TRIGGER debts_updated_at
  BEFORE UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. debt_payments
-- ---------------------------------------------------------------------------
CREATE TABLE public.debt_payments (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id      uuid          NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  user_id      uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_paid  numeric(15,2) NOT NULL CHECK (amount_paid > 0),
  payment_date date          NOT NULL DEFAULT CURRENT_DATE,
  month_year   text          NOT NULL,
  created_at   timestamptz   NOT NULL DEFAULT now(),

  UNIQUE (debt_id, month_year)
);

CREATE INDEX idx_debt_payments_debt_month ON public.debt_payments(debt_id, month_year);

-- ---------------------------------------------------------------------------
-- 4. expenses
-- ---------------------------------------------------------------------------
CREATE TABLE public.expenses (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       text          NOT NULL,
  category   text          NOT NULL CHECK (category IN ('utilities','subscriptions','insurance','rent','groceries','transportation','healthcare','other')),
  amount     numeric(15,2) NOT NULL CHECK (amount > 0),
  due_day    int           NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  is_active  boolean       NOT NULL DEFAULT true,
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. expense_checks
-- ---------------------------------------------------------------------------
CREATE TABLE public.expense_checks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid        NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_year text        NOT NULL,
  is_paid    boolean     NOT NULL DEFAULT false,
  paid_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (expense_id, month_year)
);

CREATE INDEX idx_expense_checks_expense_month ON public.expense_checks(expense_id, month_year);

-- ---------------------------------------------------------------------------
-- 6. savings_goals
-- ---------------------------------------------------------------------------
CREATE TABLE public.savings_goals (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            text          NOT NULL,
  target_amount   numeric(15,2) NOT NULL CHECK (target_amount > 0),
  target_date     date          NOT NULL,
  starting_amount numeric(15,2) NOT NULL DEFAULT 0,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_savings_goals_user_id ON public.savings_goals(user_id);

CREATE TRIGGER savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. savings_logs
-- ---------------------------------------------------------------------------
CREATE TABLE public.savings_logs (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id      uuid          NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  user_id      uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_saved numeric(15,2) NOT NULL CHECK (amount_saved > 0),
  month_year   text          NOT NULL,
  logged_at    timestamptz   NOT NULL DEFAULT now(),

  UNIQUE (goal_id, month_year)
);

CREATE INDEX idx_savings_logs_goal_id ON public.savings_logs(goal_id);
