import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Rate-limiter – calls the `rate-limiter` Edge Function before auth actions
// ---------------------------------------------------------------------------

export type RateLimitAction = "login" | "register" | "reset_password";

interface RateLimitOk {
  ok: true;
  remaining: number;
}

interface RateLimitBlocked {
  ok: false;
  retryAfter: number;
  error: string;
}

export type RateLimitResult = RateLimitOk | RateLimitBlocked;

/**
 * Calls the `rate-limiter` Supabase Edge Function.
 *
 * @returns `{ ok: true, remaining }` when under limit,
 *          `{ ok: false, retryAfter, error }` when blocked (429).
 * @throws  On unexpected network / server errors.
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string,
): Promise<RateLimitResult> {
  const { data, error } = await supabase.functions.invoke("rate-limiter", {
    body: { action, identifier },
  });

  // `supabase.functions.invoke` treats non-2xx as an error when there is no
  // `data` — but for 429 the body is still valid JSON.  The SDK returns the
  // parsed body in `data` and sets `error` for non-2xx status codes.
  if (error) {
    // 429 – rate limited: the SDK puts the parsed JSON body in `data`
    if (data && "retryAfter" in data) {
      return {
        ok: false,
        retryAfter: data.retryAfter as number,
        error: (data.error as string) ?? "Too many attempts",
      };
    }
    throw new Error(
      error.message ?? "Rate-limit check failed — please try again.",
    );
  }

  return { ok: true, remaining: (data as { remaining: number }).remaining };
}

/**
 * Helper that formats the retryAfter seconds into a human-readable string.
 */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}
