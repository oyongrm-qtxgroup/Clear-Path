import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";

import type { Debt, DebtPayment } from "@/schemas/debt.schema";
import DebtCard from "../DebtCard";
import {
  useRecordPayment,
  useUndoPayment,
  useDeleteDebt,
} from "@/hooks/useDebts";

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------
vi.mock("@/hooks/useDebts", () => ({
  useRecordPayment: vi.fn(),
  useUndoPayment: vi.fn(),
  useDeleteDebt: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const MONTH_YEAR = "2026-03";

const mockDebt: Debt = {
  id: "debt-001",
  user_id: "user-001",
  name: "Credit Card A",
  type: "credit_card",
  original_amount: 50_000,
  current_balance: 35_000,
  monthly_payment: 3_000,
  interest_rate: 24,
  due_day: 15,
  priority: 0,
  is_paid_off: false,
  paid_off_at: null,
  created_at: new Date("2025-01-01"),
  updated_at: new Date("2025-01-01"),
};

const mockPaymentRecord: DebtPayment = {
  debt_id: "debt-001",
  amount_paid: 3_000,
  payment_date: new Date("2026-03-01"),
  month_year: "2026-03",
};

// ---------------------------------------------------------------------------
// Mock mutation functions
// ---------------------------------------------------------------------------
const mockRecordPaymentMutate = vi.fn();
const mockUndoPaymentMutate = vi.fn();
const mockDeleteDebtMutate = vi.fn();

function baseMutation(
  mutateFn: ReturnType<typeof vi.fn>,
  overrides: Record<string, unknown> = {},
) {
  return {
    mutate: mutateFn,
    mutateAsync: vi.fn(),
    isPending: false,
    isIdle: true,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
    variables: undefined,
    status: "idle" as const,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
    isPaused: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------
function renderDebtCard(props?: {
  debt?: Debt;
  monthYear?: string;
  paymentRecord?: DebtPayment;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DebtCard
          debt={props?.debt ?? mockDebt}
          monthYear={props?.monthYear ?? MONTH_YEAR}
          paymentRecord={props?.paymentRecord}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 2, 2)); // March 2, 2026

  mockRecordPaymentMutate.mockReset();
  mockUndoPaymentMutate.mockReset();
  mockDeleteDebtMutate.mockReset();

  vi.mocked(useRecordPayment).mockReturnValue(
    baseMutation(mockRecordPaymentMutate) as ReturnType<
      ReturnType<typeof useRecordPayment>
    >,
  );
  vi.mocked(useUndoPayment).mockReturnValue(
    baseMutation(mockUndoPaymentMutate) as ReturnType<
      ReturnType<typeof useUndoPayment>
    >,
  );
  vi.mocked(useDeleteDebt).mockReturnValue(
    baseMutation(mockDeleteDebtMutate) as ReturnType<
      ReturnType<typeof useDeleteDebt>
    >,
  );
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("DebtCard", () => {
  it("renders debt name, balance, and monthly payment correctly", () => {
    renderDebtCard();

    expect(screen.getByText("Credit Card A")).toBeInTheDocument();
    expect(screen.getByText("₱35,000.00")).toBeInTheDocument();
    expect(screen.getByText("₱3,000.00")).toBeInTheDocument();
  });

  it("checkbox is unchecked when no paymentRecord provided", () => {
    renderDebtCard();

    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("checkbox is checked when paymentRecord exists for the current monthYear", () => {
    renderDebtCard({ paymentRecord: mockPaymentRecord });

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("clicking unchecked checkbox calls useRecordPayment with correct args", () => {
    renderDebtCard();

    fireEvent.click(screen.getByRole("checkbox"));

    expect(mockRecordPaymentMutate).toHaveBeenCalledWith({
      debt_id: "debt-001",
      amount_paid: 3_000,
      payment_date: expect.any(Date),
      month_year: "2026-03",
    });
  });

  it("clicking checked checkbox shows a ConfirmDialog before calling useUndoPayment", () => {
    renderDebtCard({ paymentRecord: mockPaymentRecord });

    // Uncheck → opens the undo confirmation dialog
    fireEvent.click(screen.getByRole("checkbox"));

    // Dialog should be visible
    expect(
      screen.getByText(/This will undo the payment for March 2026/),
    ).toBeInTheDocument();

    // Confirm the undo via the dialog button
    fireEvent.click(screen.getByRole("button", { name: "Undo Payment" }));

    expect(mockUndoPaymentMutate).toHaveBeenCalledWith({
      debtId: "debt-001",
      monthYear: "2026-03",
    });
  });

  it('shows "Overdue" badge when due_day has passed and no payment exists', () => {
    // due_day 1 → March 1 is before March 2 (today), so overdue
    renderDebtCard({ debt: { ...mockDebt, due_day: 1 } });

    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("disables checkbox while mutation is in flight", () => {
    vi.mocked(useRecordPayment).mockReturnValue(
      baseMutation(mockRecordPaymentMutate, { isPending: true }) as ReturnType<
        ReturnType<typeof useRecordPayment>
      >,
    );

    renderDebtCard();

    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("shows success toast after payment is recorded", () => {
    // Simulate the hook's onSuccess behaviour inside the mock
    mockRecordPaymentMutate.mockImplementation(() => {
      (toast.success as ReturnType<typeof vi.fn>)("Payment recorded!");
    });

    renderDebtCard();

    fireEvent.click(screen.getByRole("checkbox"));

    expect(toast.success).toHaveBeenCalledWith("Payment recorded!");
  });
});
