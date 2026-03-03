## Plan: Skip Month for Budget Tracking

**TL;DR** — When you enter debts with post-payment balances, you need a way to tell the app "this month is already handled — don't track it." This plan adds a **"Skip Month"** toggle on the MonthlyBudgetPage. A skipped month replaces the normal budget table with a banner saying **"This month was marked as pre-paid"**, preventing accidental balance-deducting payment toggles. Balances stay untouched. The feature is backed by a new `budget_skipped_months` table, following existing migration/RLS/API/hook patterns.

**Steps**

1. **New migration: `006_budget_skip_month.sql`** in `supabase/migrations/`
   - Create table `budget_skipped_months` with: `id` (uuid PK), `user_id` (FK → profiles), `month_year` (text, CHECK regex `^\d{4}-(0[1-9]|1[0-2])$`), `created_at` (timestamptz), UNIQUE on `(user_id, month_year)`.
   - Enable RLS with 4 policies (select/insert/update/delete) matching the pattern in `002_rls_policies.sql`.

2. **Add `QUERY_KEYS.budget.skippedMonth`** in `src/constants/index.ts`
   - Add `skippedMonth: (monthYear: string) => ["budget", "skippedMonth", monthYear] as const` to the `budget` key group.

3. **Add API functions** in `src/api/budget.api.ts`
   - `fetchSkippedMonth(monthYear)` — SELECT from `budget_skipped_months` where `user_id` + `month_year`, using `.maybeSingle()` (returns row or null). Pattern matches `fetchIncomeOverride`.
   - `skipMonth(monthYear)` — INSERT into `budget_skipped_months` with `user_id` + `month_year`. Uses `requireUserId()` + `throwOnError()`.
   - `unskipMonth(monthYear)` — DELETE from `budget_skipped_months` where `user_id` + `month_year`. Pattern matches `deleteIncomeOverride`.

4. **Add hooks** in `src/hooks/useBudget.ts`
   - `useSkippedMonth(monthYear)` — `useQuery` with key `QUERY_KEYS.budget.skippedMonth(monthYear)`, returns boolean-ish (row or null).
   - `useSkipMonth()` — `useMutation` calling `skipMonth`, invalidates `skippedMonth(monthYear)` key on success, shows success toast.
   - `useUnskipMonth()` — `useMutation` calling `unskipMonth`, invalidates `skippedMonth(monthYear)` key on success, shows success toast.

5. **Integrate into `MonthlyBudgetPage`** in `src/features/budget/MonthlyBudgetPage.tsx`
   - Fetch `useSkippedMonth(monthYear)` alongside existing queries.
   - **Header area** (~line 643): Add a "Skip Month" / "Unskip Month" toggle button next to the `MonthPicker`. Use a distinguishable style (e.g., outline variant with a skip-forward icon). Wrap in a `ConfirmDialog` for the skip action to prevent accidental clicks — confirmation message: _"Mark this month as pre-paid? This means you've already paid all obligations for this month outside the app. No balances will be changed."_
   - **When month is skipped**: Replace the `BudgetContent` section (the table with debts/expenses/extras) with a **`SkippedMonthBanner`** component showing:
     - An icon + message: _"This month was marked as pre-paid."_
     - Subtext: _"All obligations for this month were already handled. No balance changes were made."_
     - An "Unskip Month" button to reverse it.
   - **Summary cards when skipped**: Show `totalObligations` as normal (so the user sees what they owed), `paidThisMonth` equal to `totalObligations` (100% progress), and `remainingBudget` = `effectiveIncome - totalObligations` (same as if everything were paid). This gives an accurate monthly budget picture.
   - The income override bar should still be visible and editable for skipped months.

6. **Export new API functions and types** from `src/api/index.ts` and hook exports from `src/hooks/index.ts`.

7. **Add Zod schema** in `src/schemas/budget.schema.ts` — a `skippedMonthSchema` with `month_year` (regex-validated YYYY-MM string) for input validation consistency.

**Verification**

- **Skip flow**: Navigate to March budget page → click "Skip Month" → confirm → budget table is replaced by the pre-paid banner, summary shows 100% paid, balances on all debts remain unchanged in the DB.
- **Unskip flow**: On the skipped March page → click "Unskip Month" → budget table reappears with all debts showing unpaid checkboxes, summary resets to 0% paid.
- **Navigation**: Navigate to April → budget page works normally (not skipped). Navigate back to March → still shows skipped state.
- **Edge case**: Skip a month that already has some `debt_payments` recorded — the skip banner should still show, and those payment records remain untouched (they'll resurface if the user unskips). Consider showing a warning if payments already exist when skipping.
- **RLS**: Verify another user cannot see or modify your skipped months.

**Decisions**

- **Skip Month (empty state) vs. Mark-as-Pre-Paid (fake payment records)**: Chose Skip Month because it doesn't create fake `debt_payment` records, keeps `current_balance` completely untouched, and is simpler to implement and undo. Fake records would risk confusion in payment history views.
- **Summary cards show 100% when skipped**: Rather than hiding obligations, showing them as "fully handled" gives the user an accurate picture of their monthly cash flow even for skipped months.
- **No schema changes to existing tables**: The feature is entirely additive — a new table, no alterations to `debts`, `debt_payments`, `expenses`, or `expense_checks`.
