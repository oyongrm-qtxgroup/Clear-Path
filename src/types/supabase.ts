export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          currency: string;
          monthly_income: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          currency?: string;
          monthly_income?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          currency?: string;
          monthly_income?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      debts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          original_amount: number;
          current_balance: number;
          monthly_payment: number;
          interest_rate: number;
          due_day: number;
          priority: number;
          is_paid_off: boolean;
          paid_off_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          original_amount: number;
          current_balance: number;
          monthly_payment: number;
          interest_rate?: number;
          due_day: number;
          priority?: number;
          is_paid_off?: boolean;
          paid_off_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          original_amount?: number;
          current_balance?: number;
          monthly_payment?: number;
          interest_rate?: number;
          due_day?: number;
          priority?: number;
          is_paid_off?: boolean;
          paid_off_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "debts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      debt_payments: {
        Row: {
          id: string;
          debt_id: string;
          user_id: string;
          amount_paid: number;
          payment_date: string;
          month_year: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          debt_id: string;
          user_id: string;
          amount_paid: number;
          payment_date?: string;
          month_year: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          debt_id?: string;
          user_id?: string;
          amount_paid?: number;
          payment_date?: string;
          month_year?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey";
            columns: ["debt_id"];
            isOneToOne: false;
            referencedRelation: "debts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "debt_payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          amount: number;
          due_day: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: string;
          amount: number;
          due_day: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          amount?: number;
          due_day?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_checks: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          month_year: string;
          is_paid: boolean;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          month_year: string;
          is_paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          expense_id?: string;
          user_id?: string;
          month_year?: string;
          is_paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expense_checks_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_checks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          target_date: string;
          starting_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          target_date: string;
          starting_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          target_date?: string;
          starting_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "savings_goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      savings_logs: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          amount_saved: number;
          month_year: string;
          logged_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          amount_saved: number;
          month_year: string;
          logged_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          user_id?: string;
          amount_saved?: number;
          month_year?: string;
          logged_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "savings_logs_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "savings_goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "savings_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_income_overrides: {
        Row: {
          id: string;
          user_id: string;
          month_year: string;
          income_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month_year: string;
          income_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month_year?: string;
          income_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_income_overrides_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_extras: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          month_year: string;
          is_paid: boolean;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          month_year: string;
          is_paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          month_year?: string;
          is_paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_extras_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---------------------------------------------------------------------------
// Convenience aliases
// ---------------------------------------------------------------------------
type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];
export type ProfileInsert = Tables["profiles"]["Insert"];
export type ProfileUpdate = Tables["profiles"]["Update"];

export type Debt = Tables["debts"]["Row"];
export type DebtInsert = Tables["debts"]["Insert"];
export type DebtUpdate = Tables["debts"]["Update"];

export type DebtPayment = Tables["debt_payments"]["Row"];
export type DebtPaymentInsert = Tables["debt_payments"]["Insert"];
export type DebtPaymentUpdate = Tables["debt_payments"]["Update"];

export type Expense = Tables["expenses"]["Row"];
export type ExpenseInsert = Tables["expenses"]["Insert"];
export type ExpenseUpdate = Tables["expenses"]["Update"];

export type ExpenseCheck = Tables["expense_checks"]["Row"];
export type ExpenseCheckInsert = Tables["expense_checks"]["Insert"];
export type ExpenseCheckUpdate = Tables["expense_checks"]["Update"];

export type SavingsGoal = Tables["savings_goals"]["Row"];
export type SavingsGoalInsert = Tables["savings_goals"]["Insert"];
export type SavingsGoalUpdate = Tables["savings_goals"]["Update"];

export type SavingsLog = Tables["savings_logs"]["Row"];
export type SavingsLogInsert = Tables["savings_logs"]["Insert"];
export type SavingsLogUpdate = Tables["savings_logs"]["Update"];

export type BudgetIncomeOverride = Tables["budget_income_overrides"]["Row"];
export type BudgetIncomeOverrideInsert =
  Tables["budget_income_overrides"]["Insert"];
export type BudgetIncomeOverrideUpdate =
  Tables["budget_income_overrides"]["Update"];

export type BudgetExtra = Tables["budget_extras"]["Row"];
export type BudgetExtraInsert = Tables["budget_extras"]["Insert"];
export type BudgetExtraUpdate = Tables["budget_extras"]["Update"];
