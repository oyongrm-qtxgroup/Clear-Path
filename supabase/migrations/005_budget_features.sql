-- ============================================================================
-- ClearPath – Monthly Budget Features
-- ============================================================================
-- Adds:
--   1. monthly_income column on profiles
--   2. budget_income_overrides table (per-month income override)
--   3. budget_extras table (ad-hoc one-time items per month)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add monthly_income to profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_income numeric NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 2. budget_income_overrides — per-month income override
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budget_income_overrides (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_year    text        NOT NULL CHECK (month_year ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  income_amount numeric     NOT NULL CHECK (income_amount >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_year)
);

-- Auto-update updated_at
CREATE TRIGGER set_budget_income_overrides_updated_at
  BEFORE UPDATE ON public.budget_income_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. budget_extras — ad-hoc monthly items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budget_extras (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       text        NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 255),
  amount     numeric     NOT NULL CHECK (amount > 0),
  month_year text        NOT NULL CHECK (month_year ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  is_paid    boolean     NOT NULL DEFAULT false,
  paid_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER set_budget_extras_updated_at
  BEFORE UPDATE ON public.budget_extras
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. RLS Policies — budget_income_overrides
-- ---------------------------------------------------------------------------
ALTER TABLE public.budget_income_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY budget_income_overrides_select ON public.budget_income_overrides
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY budget_income_overrides_insert ON public.budget_income_overrides
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY budget_income_overrides_update ON public.budget_income_overrides
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY budget_income_overrides_delete ON public.budget_income_overrides
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. RLS Policies — budget_extras
-- ---------------------------------------------------------------------------
ALTER TABLE public.budget_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY budget_extras_select ON public.budget_extras
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY budget_extras_insert ON public.budget_extras
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY budget_extras_update ON public.budget_extras
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY budget_extras_delete ON public.budget_extras
  FOR DELETE USING (user_id = auth.uid());
