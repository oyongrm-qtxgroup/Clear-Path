# Plan: Propagate Skip Month to Expense & Debt Pages

**TL;DR** — When a month is skipped in the Budget page, the Expense and Debt pages should also auto-advance to the next non-skipped month on initial load. Currently only the Budget page has this behavior. The fix involves reusing the existing `useSkippedMonth` hook in the Expense and Debt pages, replicating the same auto-advance `useEffect` pattern from MonthlyBudgetPage.

## Root Cause

- All three pages initialize their `monthYear` state via `getCurrentMonthYear()` which returns the literal current calendar month (`format(new Date(), "yyyy-MM")`).
- Only `MonthlyBudgetPage` queries `useSkippedMonth(monthYear)` and has an auto-advance `useEffect` that jumps to next month when the current month is skipped.
- `ExpensesPage` and `DebtsPage` have zero skip-month awareness.

## Approach Options

### Option A: Duplicate auto-advance logic per page (simplest)

Add `useSkippedMonth(monthYear)` + the same auto-advance `useEffect` in both ExpensesPage and DebtsPage, identical to the budget page's pattern.

**Pros**: Minimal changes, no shared state/context needed, follows existing pattern.
**Cons**: Duplicated logic in 3 places.

### Option B: Create a shared hook `useSkipAwareMonth()` (recommended)

Extract a custom hook that:

1. Initializes state with `getCurrentMonthYear()`
2. Queries `useSkippedMonth(monthYear)`
3. Auto-advances on initial mount if skipped
4. Returns `{ monthYear, setMonthYear, isSkipped, skippedLoading }`

Used by all three pages instead of raw `useState(getCurrentMonthYear)`.

**Pros**: DRY, single source of truth, easy to extend (e.g., handle consecutive skipped months).
**Cons**: Slightly more refactoring, but minimal.

### Option C: Global context / route-level state

Store effective month in a React context shared across pages.

**Pros**: All pages always in sync.
**Cons**: Over-engineering — pages are independent views, user may want different months on different pages.

## Recommended: Option B

### Phase 1: Create shared hook

1. Create `useSkipAwareMonth` hook in `src/hooks/` that encapsulates:
   - `useState(getCurrentMonthYear)` for monthYear state
   - `useSkippedMonth(monthYear)` query
   - Auto-advance `useEffect` (copied from MonthlyBudgetPage lines 627-641)
   - Returns `{ monthYear, setMonthYear, isSkipped, skippedLoading }`
2. Export from `src/hooks/index.ts`

### Phase 2: Integrate into pages

3. **MonthlyBudgetPage** — replace inline `useState` + `useSkippedMonth` + `useEffect` auto-advance with `useSkipAwareMonth()`
4. **ExpensesPage** — replace `useState(getCurrentMonthYear)` with `useSkipAwareMonth()`
5. **DebtsPage** — replace `useState(getCurrentMonthYear)` with `useSkipAwareMonth()`

### Phase 3: MonthPicker enhancement

6. Add visual indicator in MonthPicker for skipped months (e.g., show a badge or subtle label). This is a nice-to-have, not required for the fix.

## Relevant Files

- `src/hooks/useBudget.ts` — existing `useSkippedMonth` hook to reuse
- `src/hooks/index.ts` — hook barrel export
- `src/features/budget/MonthlyBudgetPage.tsx` — existing auto-advance pattern (lines 618-641) to extract from
- `src/features/expenses/ExpensesPage.tsx` — needs skip-month awareness
- `src/features/debts/DebtsPage.tsx` — needs skip-month awareness
- `src/lib/utils.ts` — `getCurrentMonthYear()` function
- `src/components/common/MonthPicker.tsx` — optional enhancement

## Verification

1. Skip March 2026 in Budget page → navigate to Expenses page → confirm it auto-advances to April 2026
2. Skip March 2026 in Budget page → navigate to Debts page → confirm it auto-advances to April 2026
3. Unskip March 2026 → confirm all three pages default back to March 2026
4. Navigate backward in MonthPicker on Expenses/Debts to March 2026 → should still work (user can manually navigate to skipped months)
5. Budget page still works exactly as before (no regression from extracting the hook)

## Decisions

- Skip-month is a **budget-level concept** that logically applies to all financial tracking pages.
- Auto-advance only on **initial mount** — user can still manually navigate to a skipped month via MonthPicker (consistent with current budget behavior).
- No need for global context — pages are independent views.

## Further Considerations

1. **Consecutive skipped months**: If a user skips both March and April, the current logic only advances one month. Should the hook loop until it finds a non-skipped month? **Recommendation**: Yes, add a small loop (max 12 iterations) to find the next non-skipped month, but this can be a follow-up.
2. **MonthPicker visual**: Should the MonthPicker grey out or mark skipped months? **Recommendation**: Nice-to-have, not needed for this fix.
