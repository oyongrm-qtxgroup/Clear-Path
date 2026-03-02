import {
  calculatePayoffDate,
  calculateRequiredMonthlySavings,
  formatCurrency,
  getCurrentMonthYear,
} from "../utils";

// ---------------------------------------------------------------------------
// Fix the clock so date-dependent functions are deterministic
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 2, 2)); // March 2, 2026
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// calculatePayoffDate
// ---------------------------------------------------------------------------
describe("calculatePayoffDate", () => {
  it("returns the correct date for a standard credit card scenario (₱100k, ₱3,100/mo, 24% APR)", () => {
    const result = calculatePayoffDate(100_000, 3_100, 24);

    expect(result).toBeInstanceOf(Date);

    // Amortisation formula: n = -ln(1 - r·B/P) / ln(1+r)
    // r=0.02, B=100000, P=3100 → n ≈ 52.27 → 53 months
    const expectedDate = new Date(2026, 2, 2);
    expectedDate.setMonth(expectedDate.getMonth() + 53);

    expect(result!.getFullYear()).toBe(expectedDate.getFullYear());
    expect(result!.getMonth()).toBe(expectedDate.getMonth());
  });

  it("returns null when monthly payment is less than or equal to monthly interest", () => {
    // Monthly interest on ₱100,000 at 24% APR = ₱2,000
    expect(calculatePayoffDate(100_000, 2_000, 24)).toBeNull();
    expect(calculatePayoffDate(100_000, 1_500, 24)).toBeNull();
  });

  it("handles 0% interest rate (simple division)", () => {
    // ₱10,000 / ₱2,500 per month = 4 months
    const result = calculatePayoffDate(10_000, 2_500, 0);

    expect(result).toBeInstanceOf(Date);

    const expectedDate = new Date(2026, 2, 2);
    expectedDate.setMonth(expectedDate.getMonth() + 4);

    expect(result!.getFullYear()).toBe(expectedDate.getFullYear());
    expect(result!.getMonth()).toBe(expectedDate.getMonth());
  });

  it("returns a date for exact payoff (no rounding issues)", () => {
    // ₱6,000 / ₱3,000 per month at 0% = exactly 2 months
    const result = calculatePayoffDate(6_000, 3_000, 0);

    expect(result).toBeInstanceOf(Date);

    const expectedDate = new Date(2026, 2, 2);
    expectedDate.setMonth(expectedDate.getMonth() + 2);

    expect(result!.getFullYear()).toBe(expectedDate.getFullYear());
    expect(result!.getMonth()).toBe(expectedDate.getMonth());
  });
});

// ---------------------------------------------------------------------------
// calculateRequiredMonthlySavings
// ---------------------------------------------------------------------------
describe("calculateRequiredMonthlySavings", () => {
  it("calculates correctly for a future goal", () => {
    // Target ₱120,000, current ₱0, target date 12 months from now
    const targetDate = new Date(2027, 2, 2); // March 2, 2027
    const result = calculateRequiredMonthlySavings(120_000, 0, targetDate);

    // 120,000 / 12 = 10,000
    expect(result).toBe(10_000);
  });

  it("returns 0 if target already reached", () => {
    const targetDate = new Date(2027, 2, 2);
    expect(calculateRequiredMonthlySavings(10_000, 15_000, targetDate)).toBe(0);
    expect(calculateRequiredMonthlySavings(10_000, 10_000, targetDate)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe("formatCurrency", () => {
  it('formats 100000 as "₱100,000.00"', () => {
    expect(formatCurrency(100_000)).toBe("₱100,000.00");
  });

  it("handles 0 and negative numbers", () => {
    expect(formatCurrency(0)).toBe("₱0.00");
    // Intl negative format for en-PH PHP
    expect(formatCurrency(-5_000)).toBe("-₱5,000.00");
  });
});

// ---------------------------------------------------------------------------
// getCurrentMonthYear
// ---------------------------------------------------------------------------
describe("getCurrentMonthYear", () => {
  it("returns a string matching /^\\d{4}-\\d{2}$/", () => {
    const result = getCurrentMonthYear();

    expect(result).toMatch(/^\d{4}-\d{2}$/);
    // With the clock fixed to March 2, 2026
    expect(result).toBe("2026-03");
  });
});
