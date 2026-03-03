# ClearPath

A personal finance management app that helps you track budgets, debts, expenses, and savings — all in one place. Built with React 19, TypeScript, and Supabase.

## Features

- **Dashboard** — At-a-glance summary of your financial health with circular progress indicators, charts, and month-by-month comparisons
- **Monthly Budget** — Plan and track your monthly income, expenses, and debt payments with skip-month support and income overrides
- **Debt Tracker** — Add, edit, and monitor debts with detailed views, payment recording, and undo capabilities
- **Expense Tracker** — Log and categorize monthly expenses with check-off tracking
- **Savings Goals** — Set savings targets, track contributions, view projections, and get a debt-free boost panel when all debts are cleared
- **Authentication** — Secure login, registration, and password recovery via Supabase Auth
- **Settings** — Profile management, theme switching (light / dark / system), currency preferences, password changes, data export, and account deletion
- **Offline Awareness** — Network status detection with automatic query pausing and toast notifications
- **Error Monitoring** — Sentry integration for production error tracking and session replays

## Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Framework    | React 19 + TypeScript 5.9                       |
| Build        | Vite 7                                          |
| Styling      | Tailwind CSS 4 + shadcn/ui (Radix)              |
| Routing      | React Router v7                                 |
| State / Data | TanStack React Query v5                         |
| Forms        | React Hook Form 7 + Zod 4                       |
| Backend      | Supabase (Auth, PostgreSQL, Row Level Security) |
| Monitoring   | Sentry (error tracking + session replays)       |
| Charts       | Recharts 3                                      |
| Theming      | next-themes                                     |
| Animations   | canvas-confetti (debt-free celebration)         |
| Testing      | Vitest 4 + Testing Library                      |
| Hosting      | Vercel                                          |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm or your preferred package manager
- A [Supabase](https://supabase.com/) project (or the local emulator)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd clearpath

# Install dependencies
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable                 | Description                                   |
| ------------------------ | --------------------------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL                     |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase publishable anon key            |
| `VITE_SENTRY_DSN`        | Sentry DSN for error monitoring (optional)    |
| `VITE_APP_ENV`           | App environment (`development`, `production`) |

> **Important:** Never commit `.env.local` or any file containing real credentials. Only `.env.example` (with blank values) should be checked in.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── api/            # API layer (Supabase calls)
├── assets/         # SVG illustrations and static assets
├── components/
│   ├── common/     # Shared components (ErrorBoundary, PageHeader, MonthPicker, etc.)
│   ├── layout/     # App shell layout
│   └── ui/         # shadcn/ui primitives
├── constants/      # App-wide constants and query keys
├── features/
│   ├── auth/       # Login, Register, Forgot Password
│   ├── budget/     # Monthly budget planner
│   ├── dashboard/  # Dashboard with summary cards and charts
│   ├── debts/      # Debt list, detail, and payment forms
│   ├── expenses/   # Expense list and item components
│   └── savings/    # Savings goals, forms, and debt-free boost
├── hooks/          # Custom React hooks (auth, data, optimistic mutations, network status)
├── lib/            # Utilities (Supabase client, Sentry init, query client, projections)
├── pages/          # Standalone pages (Settings, 404)
├── plugins/        # Vite plugins (dev-checks)
├── schemas/        # Zod validation schemas
├── test/           # Test setup
├── types/          # TypeScript type definitions
└── router.tsx      # Route definitions
supabase/
├── migrations/     # Database migrations & RLS policies
├── seed.sql        # Sample seed data
└── truncate.sql    # Truncation script for resets
```

## Database Setup

Apply the Supabase migrations in order:

1. `001_initial_schema.sql` — Tables and base schema
2. `002_rls_policies.sql` — Row Level Security policies
3. `004_rls_verification_rpc.sql` — RPC for RLS verification
4. `005_budget_features.sql` — Budget extras and income overrides
5. `006_budget_skip_month.sql` — Skip-month support for budgets

Optionally seed the database for development:

```bash
psql -f supabase/seed.sql
```

## Deployment

The app is configured for **Vercel** with SPA rewrites. Push to your connected branch and Vercel handles the rest.

## License

This project is private.
