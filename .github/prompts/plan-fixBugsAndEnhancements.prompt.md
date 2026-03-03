## Plan: Fix Bugs & Enhance Debt/Expense/Currency UX

Five changes across the ClearPath app: replace the inline debt card with the standalone version (enabling edit/delete), add a reusable currency input component, add Avalanche/Snowball explanations, wire up the "Add Expense" button, and fix Vercel 404s on refresh.

---

**Steps**

### 1. Fix 404 on page refresh (Vercel)

- Create a new `vercel.json` at the project root with a single rewrite rule: `"source": "/(.*)"` → `"destination": "/index.html"`. This tells Vercel to serve the SPA index for all routes, letting `createBrowserRouter` in [src/router.tsx](src/router.tsx) handle client-side routing.

### 2. Enable edit & delete on the Debts list page

- **a.** Create a batch payment fetch hook `useAllDebtPaymentsForMonth(monthYear)` in [src/hooks/useDebts.ts](src/hooks/useDebts.ts). Model it after the inline implementation found in [src/features/budget/MonthlyBudgetPage.tsx](src/features/budget/MonthlyBudgetPage.tsx) (~lines 920–937), which queries `debt_payments` filtered by `month_year`. Return a `Map<string, DebtPayment>` keyed by `debt_id` for easy lookup.
- **b.** Also add the corresponding API function `fetchAllDebtPaymentsForMonth(monthYear)` in [src/api/debt.api.ts](src/api/debt.api.ts).
- **c.** In [src/features/debts/DebtsPage.tsx](src/features/debts/DebtsPage.tsx):
  - Remove the inline `DebtCard` function (lines ~101–165).
  - Import the standalone `DebtCard` from [src/features/debts/DebtCard.tsx](src/features/debts/DebtCard.tsx).
  - Call `useAllDebtPaymentsForMonth(monthYear)` to get all payment records for the selected month.
  - Pass `debt`, `monthYear`, and the corresponding `paymentRecord` (looked up from the map by `debt.id`) to each `<DebtCard>`.
  - This automatically brings in the edit/delete dropdown, the `DebtForm` dialog (edit mode), and the `ConfirmDialog` (delete) that are already wired in the standalone component.
- **d.** Update [src/features/debts/index.ts](src/features/debts/index.ts) if needed to re-export the standalone `DebtCard`.

### 3. Add Avalanche & Snowball explanation

- In [src/features/debts/DebtsPage.tsx](src/features/debts/DebtsPage.tsx), immediately below the `<TabsList>` containing the Avalanche/Snowball toggles (~line 298–301), add a small descriptive block (e.g., an `Alert` or subtle `<p>` with `text-muted-foreground`):
  - **Avalanche:** "Pay off debts with the **highest interest rate** first — saves the most money over time."
  - **Snowball:** "Pay off debts with the **smallest balance** first — builds momentum with quick wins."
- Show only the description for the currently selected strategy (driven by the active tab value).

### 4. Fix "Add Expense" not working

- **a.** In [src/features/expenses/ExpensesPage.tsx](src/features/expenses/ExpensesPage.tsx):
  - Add a `Dialog` state (`isAddOpen`) and wrap the "Add Expense" button(s) (~line 280 empty state, ~line 301 main view) with `onClick={() => setIsAddOpen(true)}`.
  - Inside the `Dialog`, render an expense creation form. Create a new `ExpenseForm` component (or an inline form) with fields: `description`, `amount`, `category`, `expense_date` — matching the `expenseFormSchema` from [src/schemas/expense.schema.ts](src/schemas/expense.schema.ts).
  - On submit, call `useCreateExpense()` from [src/hooks/useExpenses.ts](src/hooks/useExpenses.ts) and close the dialog on success.
- **b.** Additionally, replace the inline `ExpenseItem` component (lines ~108–137) with the imported standalone `ExpenseItem` from [src/features/expenses/ExpenseItem.tsx](src/features/expenses/ExpenseItem.tsx), which already has edit/delete functionality via dropdown menu.

### 5. Format currency inputs with live formatting as user types

- **a.** Create a reusable `CurrencyInput` component at `src/components/common/CurrencyInput.tsx`:
  - Wraps the existing `<Input>` from [src/components/ui/input.tsx](src/components/ui/input.tsx).
  - Uses `type="text"` (not `type="number"`) so commas and currency symbols render.
  - On change: strip non-numeric characters (except `.`), store raw numeric value in form state, display the formatted string (`#,###.##`) via `Intl.NumberFormat`.
  - On blur: finalize formatting.
  - Prefix with ₱ using a label/adornment (consistent with the PHP prefix already in `DebtForm`).
  - Expose a `value` (number) and `onChange(value: number)` interface compatible with `react-hook-form`'s `Controller`.
- **b.** Export from [src/components/common/index.ts](src/components/common/index.ts).
- **c.** Replace all currency `<Input type="number">` fields across the app with `<CurrencyInput>`:
  - [src/features/debts/DebtForm.tsx](src/features/debts/DebtForm.tsx) — `original_amount`, `current_balance`, `monthly_payment` (3 fields)
  - [src/features/expenses/ExpenseItem.tsx](src/features/expenses/ExpenseItem.tsx) — `amount` in EditExpenseForm (1 field)
  - New expense creation form (from Step 4) — `amount` (1 field)
  - [src/features/savings/SavingsGoalForm.tsx](src/features/savings/SavingsGoalForm.tsx) — `target_amount`, `starting_amount` (2 fields)
  - [src/features/savings/SavingsGoalCard.tsx](src/features/savings/SavingsGoalCard.tsx) — log savings input (~line 185) (1 field)
  - [src/features/budget/MonthlyBudgetPage.tsx](src/features/budget/MonthlyBudgetPage.tsx) — IncomeBar edit input (~line 118), AddExtraRow amount (~line 248) (2 fields)
- **d.** Since all Zod schemas use `z.coerce.number()`, ensure the `CurrencyInput` always passes the **raw numeric value** (not the formatted string) to the form, so validation continues to work without changes.

---

**Verification**

1. **404 fix:** Deploy to Vercel (or run `vercel dev`), navigate to any route (e.g., `/debts`), hard refresh — should load correctly instead of 404.
2. **Debt edit/delete:** On the Debts page, each card should show a "..." dropdown menu with Edit and Delete options. Edit opens a pre-filled `DebtForm` dialog; Delete shows a confirmation dialog. Both mutations should update the list.
3. **Avalanche/Snowball:** Toggle between tabs — each shows its corresponding one-line explanation.
4. **Add expense:** Click "Add Expense" button → dialog opens → fill form → submit → new expense appears in the list. Also verify edit/delete works on each expense item via dropdown.
5. **Currency inputs:** In any form with a money field, type `1234567.89` → display should show `1,234,567.89` with ₱ prefix. On submit, verify the raw number reaches the API correctly.

---

**Decisions**

- **Vercel** chosen as the deployment target for the 404 fix (per user confirmation).
- **Fetch payments per debt** via a new batch hook (`useAllDebtPaymentsForMonth`) rather than making `paymentRecord` optional — gives full card functionality on the list page.
- **Custom `CurrencyInput` component** rather than adding a library like `react-number-format` — keeps dependencies minimal, and the formatting logic is simple enough for a custom solution.
- **`interest_rate`** field in `DebtForm` will NOT use `CurrencyInput` since it's a percentage, not a currency value.
