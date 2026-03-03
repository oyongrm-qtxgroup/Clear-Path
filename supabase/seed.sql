-- ============================================================================
-- ClearPath – Seed Data
-- ============================================================================
-- Populates all tables with realistic dummy data for development.
--
-- HOW TO USE
-- ----------
-- 1. Sign up / log in to the app so your auth.users row exists.
-- 2. Copy your user ID from the Supabase Auth dashboard (or run:
--        SELECT id FROM auth.users LIMIT 1;
--    ).
-- 3. Replace the placeholder below with your actual user UUID.
-- 4. Run this script in the Supabase SQL Editor.
-- ============================================================================

-- Ensure the search_path includes public (some Supabase SQL Editor contexts don't)
SET search_path TO public, auth, extensions;

-- ⚠️  SET YOUR USER ID HERE  ⚠️
DO $$
DECLARE
  uid uuid := (SELECT id FROM auth.users LIMIT 1);

  -- Debt IDs (so we can reference them in debt_payments)
  debt_cc1    uuid := gen_random_uuid();
  debt_cc2    uuid := gen_random_uuid();
  debt_car    uuid := gen_random_uuid();
  debt_persl  uuid := gen_random_uuid();
  debt_stud   uuid := gen_random_uuid();
  debt_mort   uuid := gen_random_uuid();

  -- Expense IDs (so we can reference them in expense_checks)
  exp_rent    uuid := gen_random_uuid();
  exp_elec    uuid := gen_random_uuid();
  exp_water   uuid := gen_random_uuid();
  exp_wifi    uuid := gen_random_uuid();
  exp_netflix uuid := gen_random_uuid();
  exp_spotify uuid := gen_random_uuid();
  exp_insur   uuid := gen_random_uuid();
  exp_groc    uuid := gen_random_uuid();
  exp_gas     uuid := gen_random_uuid();
  exp_health  uuid := gen_random_uuid();

  -- Savings goal IDs (so we can reference them in savings_logs)
  sav_emerg   uuid := gen_random_uuid();
  sav_vaca    uuid := gen_random_uuid();
  sav_laptop  uuid := gen_random_uuid();
  sav_car     uuid := gen_random_uuid();

BEGIN
  -- Guard: make sure we have a user
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No user found in auth.users. Sign up first, then re-run this seed.';
  END IF;

  -- ========================================================================
  -- Ensure a profile row exists
  -- ========================================================================
  INSERT INTO public.profiles (id, display_name, currency)
  VALUES (uid, 'Demo User', 'PHP')
  ON CONFLICT (id) DO NOTHING;

  -- ========================================================================
  -- DEBTS (6 items – mix of types, priorities, balances)
  -- ========================================================================
  INSERT INTO public.debts (id, user_id, name, type, original_amount, current_balance, monthly_payment, interest_rate, due_day, priority, is_paid_off)
  VALUES
    (debt_cc1,   uid, 'BPI Credit Card',        'credit_card',   85000.00,  62340.00,  4500.00, 24.00,  15, 1, false),
    (debt_cc2,   uid, 'Metrobank Visa',          'credit_card',   45000.00,  28750.00,  2500.00, 21.50,  20, 2, false),
    (debt_car,   uid, 'Toyota Vios Car Loan',    'car_loan',     780000.00, 542000.00, 15800.00,  6.50,   5, 3, false),
    (debt_persl, uid, 'CIMB Personal Loan',      'personal_loan', 50000.00,  18200.00,  5000.00, 16.00,  10, 4, false),
    (debt_stud,  uid, 'Student Loan',            'student_loan', 200000.00,  95000.00,  4200.00,  8.00,  25, 5, false),
    (debt_mort,  uid, 'Home Mortgage',           'mortgage',    3500000.00,3150000.00, 22000.00,  7.25,   1, 6, false);

  -- ========================================================================
  -- DEBT PAYMENTS (past 4 months: Nov 2025 – Feb 2026)
  -- ========================================================================
  INSERT INTO public.debt_payments (debt_id, user_id, amount_paid, payment_date, month_year)
  VALUES
    -- BPI Credit Card
    (debt_cc1, uid,  4500.00, '2025-11-15', '2025-11'),
    (debt_cc1, uid,  4500.00, '2025-12-15', '2025-12'),
    (debt_cc1, uid,  4500.00, '2026-01-15', '2026-01'),
    (debt_cc1, uid,  4500.00, '2026-02-15', '2026-02'),
    -- Metrobank Visa
    (debt_cc2, uid,  2500.00, '2025-11-20', '2025-11'),
    (debt_cc2, uid,  2500.00, '2025-12-20', '2025-12'),
    (debt_cc2, uid,  2500.00, '2026-01-20', '2026-01'),
    (debt_cc2, uid,  2500.00, '2026-02-20', '2026-02'),
    -- Car Loan
    (debt_car, uid, 15800.00, '2025-11-05', '2025-11'),
    (debt_car, uid, 15800.00, '2025-12-05', '2025-12'),
    (debt_car, uid, 15800.00, '2026-01-05', '2026-01'),
    (debt_car, uid, 15800.00, '2026-02-05', '2026-02'),
    -- Personal Loan
    (debt_persl, uid, 5000.00, '2025-11-10', '2025-11'),
    (debt_persl, uid, 5000.00, '2025-12-10', '2025-12'),
    (debt_persl, uid, 5000.00, '2026-01-10', '2026-01'),
    (debt_persl, uid, 5000.00, '2026-02-10', '2026-02'),
    -- Student Loan
    (debt_stud, uid, 4200.00, '2025-11-25', '2025-11'),
    (debt_stud, uid, 4200.00, '2025-12-25', '2025-12'),
    (debt_stud, uid, 4200.00, '2026-01-25', '2026-01'),
    (debt_stud, uid, 4200.00, '2026-02-25', '2026-02'),
    -- Mortgage
    (debt_mort, uid, 22000.00, '2025-11-01', '2025-11'),
    (debt_mort, uid, 22000.00, '2025-12-01', '2025-12'),
    (debt_mort, uid, 22000.00, '2026-01-01', '2026-01'),
    (debt_mort, uid, 22000.00, '2026-02-01', '2026-02');

  -- ========================================================================
  -- EXPENSES (10 recurring monthly expenses across all categories)
  -- ========================================================================
  INSERT INTO public.expenses (id, user_id, name, category, amount, due_day, is_active)
  VALUES
    (exp_rent,    uid, 'Apartment Rent',          'rent',           18000.00,  1, true),
    (exp_elec,    uid, 'Meralco Electric Bill',   'utilities',       3500.00,  5, true),
    (exp_water,   uid, 'Maynilad Water Bill',     'utilities',        800.00, 10, true),
    (exp_wifi,    uid, 'PLDT Fibr Internet',      'utilities',       1699.00, 15, true),
    (exp_netflix, uid, 'Netflix Premium',          'subscriptions',    549.00, 12, true),
    (exp_spotify, uid, 'Spotify Family',           'subscriptions',    239.00, 18, true),
    (exp_insur,   uid, 'Sun Life Insurance',       'insurance',      2500.00, 20, true),
    (exp_groc,    uid, 'Weekly Groceries',         'groceries',      8000.00,  7, true),
    (exp_gas,     uid, 'Gas & Commute',            'transportation', 4000.00,  1, true),
    (exp_health,  uid, 'PhilHealth Contribution',  'healthcare',     1800.00, 25, true);

  -- ========================================================================
  -- EXPENSE CHECKS (mark some as paid for past months + partial for current)
  -- ========================================================================

  -- January 2026 – ALL paid
  INSERT INTO public.expense_checks (expense_id, user_id, month_year, is_paid, paid_at)
  VALUES
    (exp_rent,    uid, '2026-01', true, '2026-01-01T08:00:00Z'),
    (exp_elec,    uid, '2026-01', true, '2026-01-05T09:00:00Z'),
    (exp_water,   uid, '2026-01', true, '2026-01-10T10:00:00Z'),
    (exp_wifi,    uid, '2026-01', true, '2026-01-15T11:00:00Z'),
    (exp_netflix, uid, '2026-01', true, '2026-01-12T12:00:00Z'),
    (exp_spotify, uid, '2026-01', true, '2026-01-18T13:00:00Z'),
    (exp_insur,   uid, '2026-01', true, '2026-01-20T14:00:00Z'),
    (exp_groc,    uid, '2026-01', true, '2026-01-07T08:30:00Z'),
    (exp_gas,     uid, '2026-01', true, '2026-01-01T09:30:00Z'),
    (exp_health,  uid, '2026-01', true, '2026-01-25T10:30:00Z');

  -- February 2026 – ALL paid
  INSERT INTO public.expense_checks (expense_id, user_id, month_year, is_paid, paid_at)
  VALUES
    (exp_rent,    uid, '2026-02', true, '2026-02-01T08:00:00Z'),
    (exp_elec,    uid, '2026-02', true, '2026-02-05T09:00:00Z'),
    (exp_water,   uid, '2026-02', true, '2026-02-10T10:00:00Z'),
    (exp_wifi,    uid, '2026-02', true, '2026-02-15T11:00:00Z'),
    (exp_netflix, uid, '2026-02', true, '2026-02-12T12:00:00Z'),
    (exp_spotify, uid, '2026-02', true, '2026-02-18T13:00:00Z'),
    (exp_insur,   uid, '2026-02', true, '2026-02-20T14:00:00Z'),
    (exp_groc,    uid, '2026-02', true, '2026-02-07T08:30:00Z'),
    (exp_gas,     uid, '2026-02', true, '2026-02-01T09:30:00Z'),
    (exp_health,  uid, '2026-02', true, '2026-02-25T10:30:00Z');

  -- March 2026 (current month) – SOME paid, some still pending
  INSERT INTO public.expense_checks (expense_id, user_id, month_year, is_paid, paid_at)
  VALUES
    (exp_rent,    uid, '2026-03', true,  '2026-03-01T08:00:00Z'),
    (exp_gas,     uid, '2026-03', true,  '2026-03-01T09:00:00Z'),
    (exp_elec,    uid, '2026-03', true,  '2026-03-03T10:00:00Z'),
    (exp_water,   uid, '2026-03', false, NULL),
    (exp_wifi,    uid, '2026-03', false, NULL),
    (exp_netflix, uid, '2026-03', false, NULL),
    (exp_spotify, uid, '2026-03', false, NULL),
    (exp_insur,   uid, '2026-03', false, NULL),
    (exp_groc,    uid, '2026-03', false, NULL),
    (exp_health,  uid, '2026-03', false, NULL);

  -- ========================================================================
  -- SAVINGS GOALS (4 goals with varied target dates & amounts)
  -- ========================================================================
  INSERT INTO public.savings_goals (id, user_id, name, target_amount, target_date, starting_amount)
  VALUES
    (sav_emerg,  uid, 'Emergency Fund',     150000.00, '2026-12-31',  20000.00),
    (sav_vaca,   uid, 'Japan Trip',          80000.00, '2026-09-30',      0.00),
    (sav_laptop, uid, 'MacBook Pro',         90000.00, '2026-06-30',  15000.00),
    (sav_car,    uid, 'Car Down Payment',   250000.00, '2027-06-30',  10000.00);

  -- ========================================================================
  -- SAVINGS LOGS (contributions over past months)
  -- ========================================================================
  INSERT INTO public.savings_logs (goal_id, user_id, amount_saved, month_year, logged_at)
  VALUES
    -- Emergency Fund
    (sav_emerg, uid,  8000.00, '2025-10', '2025-10-28T12:00:00Z'),
    (sav_emerg, uid,  8000.00, '2025-11', '2025-11-28T12:00:00Z'),
    (sav_emerg, uid, 10000.00, '2025-12', '2025-12-28T12:00:00Z'),
    (sav_emerg, uid, 10000.00, '2026-01', '2026-01-28T12:00:00Z'),
    (sav_emerg, uid, 10000.00, '2026-02', '2026-02-28T12:00:00Z'),

    -- Japan Trip
    (sav_vaca, uid,  5000.00, '2025-11', '2025-11-30T12:00:00Z'),
    (sav_vaca, uid,  5000.00, '2025-12', '2025-12-30T12:00:00Z'),
    (sav_vaca, uid,  7000.00, '2026-01', '2026-01-30T12:00:00Z'),
    (sav_vaca, uid,  7000.00, '2026-02', '2026-02-28T12:00:00Z'),

    -- MacBook Pro
    (sav_laptop, uid, 12000.00, '2025-11', '2025-11-25T12:00:00Z'),
    (sav_laptop, uid, 12000.00, '2025-12', '2025-12-25T12:00:00Z'),
    (sav_laptop, uid, 15000.00, '2026-01', '2026-01-25T12:00:00Z'),
    (sav_laptop, uid, 15000.00, '2026-02', '2026-02-25T12:00:00Z'),

    -- Car Down Payment
    (sav_car, uid,  5000.00, '2025-12', '2025-12-28T12:00:00Z'),
    (sav_car, uid,  5000.00, '2026-01', '2026-01-28T12:00:00Z'),
    (sav_car, uid,  7000.00, '2026-02', '2026-02-28T12:00:00Z');

  RAISE NOTICE '✅ Seed complete for user %', uid;
END $$;
