# Plan: ClearPath — 6-Issue Fix & Feature Batch

Six changes spanning auth debugging, budget UX fixes, a new FAQ page, first-time onboarding, and auth page visual cleanup. Most are independent and can be worked in parallel.

---

## Issue 1: Chrome Login Failure

**Root cause analysis:** The Supabase client in `src/lib/supabase.ts` uses a custom `wrappedFetch` from `src/lib/api-wrapper.ts` that adds throttling, request deduplication, and retry logic. The 401 handler clears all `sb-*-auth-token` localStorage keys and redirects. Chrome 131+ enforces stricter **third-party cookie partitioning** and **storage access policies**, which can interfere with Supabase's cross-origin token exchange. Additionally, the deduplication layer could merge concurrent auth requests (session refresh + login), but auth mutations aren't idempotent.

**Steps:**
1. In `src/lib/supabase.ts` — add explicit Supabase client auth options: `flowType: 'pkce'`, `detectSessionInUrl: true`, `persistSession: true`, explicit `storageKey`
2. In `src/lib/api-wrapper.ts` — **exclude all `/auth/` paths from deduplication AND throttling** (auth currently only exempted from 401 clear logic)
3. In `src/features/auth/LoginPage.tsx` — surface actual Supabase error messages instead of generic toast, to help debug further if config fixes aren't enough

**Verification:** Test login on Chrome (regular + Incognito), Firefox, Safari, Edge. Check DevTools Network tab for blocked requests.

---

## Issue 2: FAQ Page

**Approach:** New `/faq` route with accordion-style FAQ, content grouped by feature area.

**Steps:**
1. Create `src/features/faq/FAQPage.tsx` — collapsible accordion sections per feature (Getting Started, Budget, Debts, Expenses, Savings, Account & Settings)
2. Create `src/constants/faq.ts` — FAQ content as data array for easy maintenance
3. Add shadcn Accordion component if not installed (`src/components/ui/accordion.tsx`)
4. Add `/faq` route in `src/router.tsx`
5. Add nav item (HelpCircle icon) in `src/components/layout/AppLayout.tsx`, placed before Settings

**Verification:** Navigate to `/faq`, verify sections render/expand/collapse, check mobile layout, confirm nav item in sidebar + mobile drawer.

---

## Issue 3: First-Time User Onboarding

**Approach:** Multi-step dialog wizard shown on first login. Tracks completion via localStorage. Guides user through: Welcome → Set Income → Add Debts → Explore Features → Done.

**Steps:**
1. Create `src/components/common/OnboardingWizard.tsx` — modal-based stepper with navigation links to relevant pages (reuses existing forms rather than embedding mini-forms)
2. Mount in `src/components/layout/AppLayout.tsx` — show when `clearpath-onboarding-complete` isn't in localStorage AND user has no data
3. Add "Restart Onboarding" button in `src/pages/SettingsPage.tsx`

**Verification:** Fresh user login shows wizard; completing or skipping dismisses it permanently; restart button in settings re-triggers it; works on mobile.

---

## Issue 4: Budget Extras Delete Confirmation

**Approach:** Wrap the delete action in `ExtraRow` with the existing `ConfirmDialog` component.

**Steps:**
1. In `src/features/budget/MonthlyBudgetPage.tsx` `ExtraRow` component (~line 441–468):
   - Add `showDeleteConfirm` state
   - Change delete button to open dialog instead of directly calling `deleteMutation.mutate()`
   - Add `<ConfirmDialog>` with `destructive={true}`, `loading={deleteMutation.isPending}`, and the extra's name in the description

**Verification:** Click delete → dialog appears. Cancel → nothing. Confirm → deleted with loading state.

---

## Issue 5: Default Month Auto-Advances When Skipped

**Approach:** Add a `useEffect` that advances to next month when the budget page loads and detects the current month is skipped.

**Steps:**
1. In `src/features/budget/MonthlyBudgetPage.tsx` (~line 591):
   - Add `useRef(true)` flag for initial mount
   - Add `useEffect`: when `!skippedLoading && isInitialMount && monthYear === getCurrentMonthYear() && isSkipped` → `setMonthYear(nextMonth)` and set flag to false
   - Uses `addMonths` + `format` from date-fns for next month calculation

**Verification:** Skip current month → navigate away → return to `/budget` → defaults to next month. Non-skipped months still default to current month. Manual month navigation unaffected.

---

## Issue 6: Remove Animated Chart SVG From Auth Pages

**Steps:**
1. In `src/features/auth/AuthLayout.tsx` — remove the `ChartIllustration` component definition (~lines 31–151) and its `<ChartIllustration />` usage. Keep `AuthIllustration` and floating icons.
2. Tighten spacing where the chart was removed.

**Verification:** Visit `/login`, `/register`, `/forgot-password` — no chart graph visible. Layout still balanced.

---

## Parallelism

All 6 issues are independent and can be implemented in parallel:
```
├── Issue 1: Chrome login fix (config + fetch wrapper)
├── Issue 2: FAQ page (new route + component)
├── Issue 3: Onboarding wizard (new component + layout integration)
├── Issue 4: Extras delete confirmation (one component edit)
├── Issue 5: Default month auto-advance (one useEffect)
└── Issue 6: Remove chart SVG (one component edit)
```

## Decisions
- **Chrome fix**: Configuration-level first (auth options, fetch exclusions). Escalate if needed.
- **FAQ content**: Hardcoded data file — no DB, no API calls.
- **Onboarding tracking**: localStorage-based — no migration needed.
- **Month advance**: Simple +1 month (not recursive check for consecutive skips) — covers 99% of cases.
- **Chart removal**: Only `ChartIllustration` removed; `AuthIllustration` (shield+lock) stays.

## Further Considerations
1. **Onboarding UX**: Should wizard embed mini-forms or link to existing pages? **Recommendation: Links** — simpler, reuses validated forms.
2. **FAQ data location**: Inline vs separate `src/constants/faq.ts`? **Recommendation: Separate file** — easier to maintain.
3. **Chrome debugging**: If config fixes don't resolve, we'll need the user's Chrome DevTools console/network errors to narrow down further.
