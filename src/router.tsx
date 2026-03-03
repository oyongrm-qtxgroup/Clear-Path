import { createBrowserRouter, Navigate } from "react-router-dom";

import { ProtectedRoute } from "@/components/common";
import { AppLayout } from "@/components/layout";

import { LoginPage, RegisterPage, ForgotPasswordPage } from "@/features/auth";
import { MonthlyBudgetPage } from "@/features/budget";
import { DashboardPage } from "@/features/dashboard";
import { DebtsPage, DebtDetailPage } from "@/features/debts";
import { ExpensesPage } from "@/features/expenses";
import { SavingsPage } from "@/features/savings";
import { SettingsPage, NotFoundPage } from "@/pages";

export const router = createBrowserRouter([
  // ── Public routes ────────────────────────────────────────────────────────
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },

  // ── Protected routes ─────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "budget", element: <MonthlyBudgetPage /> },
          { path: "debts", element: <DebtsPage /> },
          { path: "debts/:id", element: <DebtDetailPage /> },
          { path: "expenses", element: <ExpensesPage /> },
          { path: "savings", element: <SavingsPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },

  // ── 404 catch-all ────────────────────────────────────────────────────────
  { path: "*", element: <NotFoundPage /> },
]);
