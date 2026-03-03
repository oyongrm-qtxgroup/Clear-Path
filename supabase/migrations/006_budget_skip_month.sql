-- ============================================================================
-- ClearPath – Budget Skip Month Feature
-- ============================================================================
-- Adds:
--   1. budget_skipped_months table (per-month skip flag)
--   2. RLS policies for budget_skipped_months
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. budget_skipped_months — per-month skip flag
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budget_skipped_months (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_year text        NOT NULL CHECK (month_year ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_year)
);

-- ---------------------------------------------------------------------------
-- 2. RLS Policies — budget_skipped_months
-- ---------------------------------------------------------------------------
ALTER TABLE public.budget_skipped_months ENABLE ROW LEVEL SECURITY;

CREATE POLICY budget_skipped_months_select ON public.budget_skipped_months
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY budget_skipped_months_insert ON public.budget_skipped_months
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY budget_skipped_months_update ON public.budget_skipped_months
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY budget_skipped_months_delete ON public.budget_skipped_months
  FOR DELETE USING (user_id = auth.uid());
