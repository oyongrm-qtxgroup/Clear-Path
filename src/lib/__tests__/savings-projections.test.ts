import { buildSavingsProjection } from "../savings-projections";
import type { SavingsGoal, SavingsLog } from "@/schemas/savings.schema";

// ---------------------------------------------------------------------------
// Fix the clock so date-dependent logic is deterministic
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 2, 2)); // March 2, 2026
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const baseGoal: SavingsGoal = {
  id: "00000000-0000-0000-0000-000000000001",
  user_id: "00000000-0000-0000-0000-000000000002",
  name: "Emergency Fund",
  target_amount: 60_000,
  starting_amount: 0,
  target_date: new Date(2026, 5, 30), // June 30, 2026
  created_at: new Date(2026, 0, 1), // January 1, 2026
  updated_at: new Date(2026, 0, 1),
};

const sampleLogs: SavingsLog[] = [
  { goal_id: baseGoal.id, amount_saved: 10_000, month_year: "2026-01" },
  { goal_id: baseGoal.id, amount_saved: 8_000, month_year: "2026-02" },
];

// ---------------------------------------------------------------------------
// buildSavingsProjection
// ---------------------------------------------------------------------------
describe("buildSavingsProjection", () => {
  it("returns the correct number of months from creation to target_date", () => {
    // Jan 2026 → Jun 2026 = 6 months
    const projection = buildSavingsProjection(baseGoal, sampleLogs);

    expect(projection).toHaveLength(6);

    const months = projection.map((e) => e.monthYear);
    expect(months).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ]);
  });

  it("actual is null for future months and a number for past/current months", () => {
    // Current month is 2026-03 (March 2, 2026)
    const projection = buildSavingsProjection(baseGoal, sampleLogs);

    // Past & current months (Jan, Feb, Mar) → actual is a number
    for (const entry of projection.slice(0, 3)) {
      expect(entry.actual).toBeTypeOf("number");
    }

    // Future months (Apr, May, Jun) → actual is null
    for (const entry of projection.slice(3)) {
      expect(entry.actual).toBeNull();
    }
  });

  it("computes cumulative planned and actual values correctly", () => {
    const projection = buildSavingsProjection(baseGoal, sampleLogs);

    // planned = starting_amount(0) + requiredMonthly(10000) cumulative
    expect(projection[0].planned).toBe(10_000);
    expect(projection[1].planned).toBe(20_000);
    expect(projection[5].planned).toBe(60_000);

    // actual (cumulative): starting(0) + logged
    // Jan: 0 + 10000 = 10000
    // Feb: 10000 + 8000 = 18000
    // Mar: 18000 + 0 = 18000 (no log)
    expect(projection[0].actual).toBe(10_000);
    expect(projection[1].actual).toBe(18_000);
    expect(projection[2].actual).toBe(18_000);
  });
});
