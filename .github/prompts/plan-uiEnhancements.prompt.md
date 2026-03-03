# Plan: Glassmorphism, Illustrations & UX Polish

**TL;DR:** Five coordinated enhancements across the app: (1) add eye-toggle password visibility to all 5 password inputs, (2) fix the budget extras "Add" button to a theme-aware ghost/outline style, (3) introduce a glassmorphism + gradient design system across all cards/surfaces, (4) embed unDraw SVG illustrations on auth pages, empty states, and dashboard snapshot cards, and (5) update the dashboard to incorporate the new visual language. The existing navy/blue palette is preserved; gradients blend primary colors with frosted glass `backdrop-blur` overlays. unDraw illustrations use an adaptive mid-tone blue (`#4a7fad`) that reads well in both light and dark modes.

---

## Steps

### Step 1 — Create a `PasswordInput` component

Create a new file `src/components/common/PasswordInput.tsx`. This wraps the existing `Input` from `src/components/ui/input.tsx` in a `relative` div, adding an `Eye` / `EyeOff` toggle button (from `lucide-react`) positioned `absolute right-3`. Use `useState` to flip between `type="password"` and `type="text"`. Forward all props (`React.ComponentProps<typeof Input>`) so it's a drop-in replacement. Export from `src/components/common/index.ts`.

### Step 2 — Replace all password `<Input>` usages

Swap `<Input type="password" ...>` → `<PasswordInput ...>` in these 5 locations:
- `src/features/auth/LoginPage.tsx` — 1 field (password)
- `src/features/auth/RegisterPage.tsx` — 2 fields (password, confirm)
- `src/pages/SettingsPage.tsx` — 2 fields (new password, confirm) in the `SecuritySection`

Remove `type="password"` from the call sites since `PasswordInput` handles it internally.

### Step 3 — Fix budget extras "Add" button

In `src/features/budget/MonthlyBudgetPage.tsx`, update the `AddExtraRow` component (~line 280-314):
- Change the `<Button size="sm">` to `<Button variant="outline" size="sm">`
- Add classes: `border-border text-foreground hover:bg-accent hover:text-accent-foreground` so it inherits the current theme's border/text tokens
- Change the parent `<TableRow>` from `bg-muted/30` to `bg-transparent` so the row blends naturally with the table
- This ensures the button works correctly in both light and dark mode using semantic color tokens

### Step 4 — Define glassmorphism + gradient CSS utilities

In `src/index.css`, add:

- **Light mode** CSS variables: `--gradient-start`, `--gradient-end`, `--glass-bg`, `--glass-border` using the primary navy blended with soft blue tones
- **Dark mode** overrides: darker navy-to-slate gradients, translucent glass with `rgba` white overlays
- **Utility classes via `@layer`:**
  - `.glass-card` — `background: var(--glass-bg)`, `backdrop-filter: blur(12px)`, `border: 1px solid var(--glass-border)`, subtle `box-shadow`
  - `.gradient-bg` — `background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end))`
  - `.gradient-text` — `background-clip: text` with `text-fill-color: transparent` on the gradient
  - `.gradient-border` — pseudo-element gradient border technique
- Keep existing card/component variables intact — the glass classes are opt-in additions

### Step 5 — Apply glassmorphism to the Card component

In `src/components/ui/card.tsx`, update the base `Card` to add a subtle glass effect:
- Add `backdrop-blur-sm bg-card/80` (semi-transparent card background + slight blur) alongside the existing classes
- Add a subtle gradient top-border using a `before:` pseudo-element with gradient colors
- Keep `shadow-sm` → upgrade to `shadow-lg shadow-black/5` for depth
- This gives every Card across the app a frosted-glass feel without touching individual pages

### Step 6 — Apply gradient to the sidebar

In `src/components/layout/AppLayout.tsx`:
- Replace the flat `bg-sidebar` on the desktop sidebar with `bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)]`
- Apply the same gradient to the mobile Sheet nav
- Add `backdrop-blur-md` to the sidebar for depth when overlapping content on mobile

### Step 7 — Apply gradient to auth brand panel

In `src/features/auth/AuthLayout.tsx`:
- Replace the flat `bg-primary` on the left brand panel with the gradient utility class
- Enhance the existing blob animations with gradient overlays
- Update the legend card (`bg-white/10 backdrop-blur-sm`) — already glassmorphism, just ensure consistency with new glass tokens

### Step 8 — Apply gradient to page headers

In `src/components/common/PageHeader.tsx`:
- Add a subtle gradient underline or gradient background accent to the title area
- Use `gradient-text` on the main title for a polished look that adapts to light/dark

### Step 9 — Add unDraw SVG illustrations

Create `src/assets/illustrations/` directory. Download and customize unDraw SVGs with the adaptive accent color `#4a7fad`. Save as React components or inline SVGs. Needed illustrations:

| Illustration | unDraw name (suggested) | Usage location |
|---|---|---|
| Finance/savings | "Savings" or "Piggy bank" | SavingsPage empty state |
| Debt payoff | "Pay online" or "Credit card" | DebtsPage empty state |
| Expense tracking | "Receipt" or "Online payments" | ExpensesPage empty state |
| Debt detail empty | "Void" or "No data" | DebtDetailPage empty state |
| Welcome/dashboard | "Financial data" or "Dashboard" | Dashboard snapshot when no data |
| Auth/login | "Secure login" or "Authentication" | AuthLayout brand panel (replaces or supplements the chart SVG) |

Create a wrapper component `src/components/common/Illustration.tsx` that:
- Accepts a `name` prop to select which illustration
- Renders at configurable size (`sm`, `md`, `lg`)
- Uses `currentColor` or CSS variable for the accent color, adapting to dark/light via `text-[#4a7fad] dark:text-[#7aafdb]` to be truly adaptive

### Step 10 — Update `EmptyState` component

In `src/components/common/EmptyState.tsx`:
- Add an optional `illustration` prop (illustration name)
- When provided, render the `<Illustration>` above the title, replacing or supplementing the `icon`
- Apply the glass-card styling to the empty state container
- Update all 4 call sites to pass the appropriate illustration name:
  - `src/features/savings/SavingsPage.tsx` → savings illustration
  - `src/features/debts/DebtsPage.tsx` → debt illustration
  - `src/features/expenses/ExpensesPage.tsx` → expense illustration
  - `src/features/debts/DebtDetailPage.tsx` → no-data illustration

### Step 11 — Update AuthLayout with unDraw illustration

In `src/features/auth/AuthLayout.tsx`:
- Replace or supplement the existing `ChartIllustration` SVG (~lines 31-150) with an unDraw "Secure login" or "Financial data" illustration
- Keep the animated blobs and floating icons — layer the illustration on top
- The illustration should be ~300px wide, centered in the brand panel

### Step 12 — Update Dashboard

In `src/features/dashboard/DashboardPage.tsx`:
- **Stat widgets:** Add gradient accent to the icon backgrounds (currently plain `rounded-lg bg-primary/10 p-3`). Change to `bg-gradient-to-br from-primary/15 to-primary/5` with a glass border
- **Snapshot cards (Debt, Expense, Savings):** When data exists, keep current layout. When empty/zero, show a small unDraw illustration + helpful message instead of "$0" or empty lists
- **Budget Summary card:** Add gradient progress bar (`bg-gradient-to-r from-primary to-primary/60`) instead of flat `bg-primary`
- **Welcome state:** If user has no data at all, show a full-width welcome card with the dashboard illustration and onboarding CTAs
- The Card-level glassmorphism from Step 5 automatically applies here

### Step 13 — Dashboard page header accent

Add a subtle gradient line or gradient background behind the "Dashboard" heading and the date/greeting area, using the glassmorphism card style for any summary strip at the top.

---

## Verification

- **Password toggle:** On login, register, and settings pages, click the eye icon to toggle visibility. Verify the input `type` attribute flips between `password` and `text`. Tab order should work (icon button should be focusable with keyboard).
- **Budget add button:** Switch between light and dark mode on the budget page. The outline button should have correct border/text contrast in both themes. Compare to adjacent table rows for visual consistency.
- **Glassmorphism:** Toggle between light/dark. Cards should show frosted background with slight blur. If there's text behind a card, it should be subtly visible through the translucency. Gradients should shift between navy-blue and dark-navy-slate palettes.
- **Illustrations:** Check all 4 empty states with no data present. Verify the auth brand panel illustration renders on desktop. Verify dashboard empty states show illustrations. Check the accent color adapts between light (`#4a7fad`) and dark (`#7aafdb`) modes.
- **Performance:** `backdrop-filter: blur()` can be GPU-intensive. Test on a lower-end device or throttle CPU via DevTools. If performance is poor, reduce blur radius or limit glass effects to top-level cards only.
- **Run:** `npx tsc --noEmit` to verify no TypeScript errors after all changes.
- **Run:** `npx eslint .` to check for lint issues.

## Decisions

- **Glassmorphism over subtle gradients:** User chose frosted glass + gradients — applies globally via Card component modification rather than per-page
- **Illustrations everywhere:** Auth, empty states, and dashboard all get unDraw SVGs — 6+ illustrations needed
- **Adaptive illustration color:** Mid-tone `#4a7fad` for light mode, `#7aafdb` for dark mode via CSS class switching
- **Outline/ghost add button:** Minimal fix using semantic `variant="outline"` + theme tokens rather than a custom gradient button
- **No new animation library:** All effects achieved with Tailwind utilities and CSS — no framer-motion or GSAP added
- **Card-level glass is opt-in for performance:** Base Card gets mild `bg-card/80 backdrop-blur-sm`; heavier glass only on hero/featured areas
