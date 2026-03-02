# ClearPath

A personal finance management app that helps you track debts, expenses, and savings — all in one place. Built with React, TypeScript, and Supabase.

## Features

- **Dashboard** — At-a-glance summary of your financial health with progress indicators and charts
- **Debt Tracker** — Add, edit, and monitor debts with detailed views per entry
- **Expense Tracker** — Log and categorize monthly expenses
- **Savings Goals** — Set savings targets and track projections over time
- **Authentication** — Secure login, registration, and password recovery via Supabase Auth
- **Settings** — Manage your profile and preferences

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix) |
| Routing | React Router v7 |
| State / Data | TanStack React Query v5 |
| Forms | React Hook Form + Zod validation |
| Backend | Supabase (Auth, Database, Edge Functions) |
| Monitoring | Sentry |
| Charts | Recharts |
| Testing | Vitest + Testing Library |

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

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase publishable anon key |
| `VITE_SENTRY_DSN` | Sentry DSN for error monitoring (optional) |
| `VITE_APP_ENV` | App environment (`development`, `production`) |

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
├── components/
│   ├── common/     # Shared components (ErrorBoundary, PageHeader, etc.)
│   ├── layout/     # App shell layout
│   └── ui/         # shadcn/ui primitives
├── constants/      # App-wide constants
├── features/       # Feature modules (auth, dashboard, debts, expenses, savings)
├── hooks/          # Custom React hooks
├── lib/            # Utilities (Supabase client, Sentry init, query client)
├── pages/          # Standalone pages (Settings, 404)
├── schemas/        # Zod validation schemas
├── types/          # TypeScript type definitions
└── router.tsx      # Route definitions
supabase/
├── functions/      # Edge Functions (rate limiter)
└── migrations/     # Database migrations & RLS policies
```

## Database Setup

Apply the Supabase migrations in order:

1. `001_initial_schema.sql` — Tables and base schema
2. `002_rls_policies.sql` — Row Level Security policies
3. `003_rate_limits.sql` — Rate limiting configuration

## License

This project is private.
