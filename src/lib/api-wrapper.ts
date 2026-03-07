/**
 * API Wrapper for Supabase calls
 *
 * Provides three layers of protection applied transparently via a custom
 * `fetch` that is injected into the Supabase client:
 *
 * 1. **Request throttling** — Token bucket: max 30 requests / 10 s per session.
 *    Overflow is queued and drained as tokens refill.
 *
 * 2. **Retry logic** (at the fetch layer, in addition to React Query retries):
 *    - Network error or 503 → retry up to 3× with exponential backoff (1 s, 2 s, 4 s).
 *    - 401 (Unauthorized) → do NOT retry; clear session and redirect to `/login`.
 *    - 429 (Rate Limited) → read `Retry-After`, wait that duration, retry once.
 *
 * 3. **Request deduplication** — In-flight GET/HEAD requests keyed by
 *    `method:url` share a single network call; callers receive cloned responses.
 *
 * Additionally exposes an `apiHealthTracker` singleton that tracks latency and
 * throttle events so the `useApiHealth()` hook can surface a "Slow connection"
 * toast to the user.
 */

// ── Utilities ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. TOKEN BUCKET — Request throttling
// ═══════════════════════════════════════════════════════════════════════════

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private queue: Array<() => void> = [];
  private drainTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly maxTokens: number;
  private readonly refillIntervalMs: number;

  constructor(maxTokens: number = 30, refillIntervalMs: number = 10_000) {
    this.maxTokens = maxTokens;
    this.refillIntervalMs = refillIntervalMs;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  // ── Internals ──────────────────────────────────────────────────────────

  /** Add tokens proportional to elapsed time since last refill. */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const rate = this.maxTokens / this.refillIntervalMs; // tokens per ms
    const tokensToAdd = Math.floor(elapsed * rate);
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /** Schedule the next drain attempt (if not already scheduled). */
  private scheduleDrain(): void {
    if (this.drainTimer !== null) return;
    // Time for one token to regenerate: interval / maxTokens ≈ 333 ms
    const delay = Math.ceil(this.refillIntervalMs / this.maxTokens);
    this.drainTimer = setTimeout(() => {
      this.drainTimer = null;
      this.drain();
    }, delay);
  }

  /** Release queued callers while tokens are available. */
  private drain(): void {
    this.refill();
    while (this.tokens > 0 && this.queue.length > 0) {
      this.tokens--;
      this.queue.shift()!();
    }
    if (this.queue.length > 0) {
      this.scheduleDrain();
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Wait until a token is available, consuming it.
   * Resolves immediately when tokens remain; otherwise the caller is queued.
   */
  acquire(): Promise<void> {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
      this.scheduleDrain();
    });
  }

  /** Number of callers currently waiting for a token. */
  get pendingCount(): number {
    return this.queue.length;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. API HEALTH TRACKER
// ═══════════════════════════════════════════════════════════════════════════

export interface ApiHealthStatus {
  /** `true` when ≥ 50 % of recent requests exceed the slow threshold. */
  isSlowConnection: boolean;
  /** Rolling average latency in milliseconds. */
  avgLatencyMs: number;
  /** Total number of requests that had to wait in the throttle queue. */
  throttledRequests: number;
}

type HealthListener = () => void;

class ApiHealthTracker {
  /** Keep the last N latency samples. */
  private latencies: number[] = [];
  private readonly maxSamples = 20;
  /** A single request is "slow" if it takes longer than this. */
  private readonly slowThresholdMs = 2_000;
  /** Minimum samples before we flag a slow connection. */
  private readonly minSamples = 5;
  /** Ratio of slow samples required to flag the connection. */
  private readonly slowRatio = 0.5;

  private throttledCount = 0;
  private listeners = new Set<HealthListener>();

  /**
   * Stable snapshot reference — only replaced when values actually change.
   * This is critical for `useSyncExternalStore` to avoid infinite re-renders.
   */
  private _snapshot: ApiHealthStatus = {
    isSlowConnection: false,
    avgLatencyMs: 0,
    throttledRequests: 0,
  };

  // ── Recording ──────────────────────────────────────────────────────────

  recordLatency(ms: number): void {
    this.latencies.push(ms);
    if (this.latencies.length > this.maxSamples) {
      this.latencies.shift();
    }
    this.updateSnapshot();
  }

  recordThrottle(): void {
    this.throttledCount++;
    this.updateSnapshot();
  }

  // ── Subscription (for useSyncExternalStore) ────────────────────────────

  /** Returns the current snapshot (stable reference). */
  getSnapshot = (): ApiHealthStatus => this._snapshot;

  /** Subscribe to snapshot changes. Returns an unsubscribe function. */
  subscribe = (listener: HealthListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  // ── Internal ───────────────────────────────────────────────────────────

  private updateSnapshot(): void {
    const len = this.latencies.length;
    const avg =
      len > 0 ? Math.round(this.latencies.reduce((a, b) => a + b, 0) / len) : 0;
    const slowCount = this.latencies.filter(
      (l) => l > this.slowThresholdMs,
    ).length;
    const isSlow = len >= this.minSamples && slowCount / len >= this.slowRatio;

    // Only allocate a new object when something actually changed
    if (
      isSlow !== this._snapshot.isSlowConnection ||
      avg !== this._snapshot.avgLatencyMs ||
      this.throttledCount !== this._snapshot.throttledRequests
    ) {
      this._snapshot = {
        isSlowConnection: isSlow,
        avgLatencyMs: avg,
        throttledRequests: this.throttledCount,
      };
      this.listeners.forEach((l) => l());
    }
  }
}

/** Singleton — shared across the whole session. */
export const apiHealthTracker = new ApiHealthTracker();

// ═══════════════════════════════════════════════════════════════════════════
// 3. REQUEST DEDUPLICATION
// ═══════════════════════════════════════════════════════════════════════════

/** Map of dedup key → in-flight master promise. */
const inflightRequests = new Map<string, Promise<Response>>();

/**
 * Build a deduplication key for safe (read-only) requests.
 * Returns `null` for non-safe methods — mutations are never deduplicated.
 */
function buildDedupeKey(
  input: RequestInfo | URL,
  init?: RequestInit,
): string | null {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") return null;

  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  return `${method}:${url}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. RETRY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse the `Retry-After` response header.
 * Supports both delta-seconds and HTTP-date formats.
 * Falls back to 5 000 ms if the header is missing or unparseable.
 */
function parseRetryAfter(response: Response): number {
  const header = response.headers.get("retry-after");
  if (!header) return 5_000;

  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return seconds * 1_000;

  const date = new Date(header);
  if (!Number.isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return 5_000;
}

/**
 * Handle a 401 Unauthorized response:
 * - Skip for Supabase Auth endpoints (they may legitimately return 401).
 * - Skip for Edge Function endpoints (they may return non-2xx legitimately).
 * - Skip if we are already on an auth page (prevents hard reload loops).
 * - Clear persisted auth tokens from localStorage.
 * - Redirect to `/login`.
 */
let isRedirecting = false;

function handleUnauthorized(input: RequestInfo | URL): void {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  // Auth endpoints return 401 for invalid credentials — that's expected
  if (url.includes("/auth/v1/")) return;

  // Edge-function invocations may 401 due to gateway/auth issues —
  // don't nuke the session for these.
  if (url.includes("/functions/v1/")) return;

  // Already on an auth page — redirecting to /login would hard-reload for no reason.
  const path = window.location.pathname;
  if (
    path === "/login" ||
    path === "/register" ||
    path === "/forgot-password"
  ) {
    return;
  }

  // Prevent multiple simultaneous redirects
  if (isRedirecting) return;
  isRedirecting = true;

  // Remove Supabase auth tokens
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
      localStorage.removeItem(key);
    }
  }

  window.location.href = "/login";
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. WRAPPED FETCH — Composes everything above
// ═══════════════════════════════════════════════════════════════════════════

const tokenBucket = new TokenBucket(30, 10_000);

/**
 * Create a wrapped `fetch` that transparently applies:
 * throttling → deduplication → retry → health tracking.
 *
 * @param nativeFetch - The original `fetch` to delegate to (usually `globalThis.fetch`).
 */
export function createWrappedFetch(
  nativeFetch: typeof globalThis.fetch,
): typeof globalThis.fetch {
  async function wrappedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    // ── Deduplication: return existing promise if one is in-flight ─────
    // Auth requests are never deduplicated — they are not idempotent.
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const dedupeKey = rawUrl.includes("/auth/")
      ? null
      : buildDedupeKey(input, init);
    if (dedupeKey) {
      const existing = inflightRequests.get(dedupeKey);
      if (existing) {
        // Each consumer gets an independent clone of the master response
        return existing.then((r) => r.clone());
      }
    }

    // ── Detect auth paths — exempt from throttling & deduplication ──
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const isAuthPath = url.includes("/auth/");

    // ── Core execution: throttle + retry ──────────────────────────────
    const execute = async (): Promise<Response> => {
      // — Throttle (skip for auth requests) —
      let throttleWait = 0;
      if (!isAuthPath) {
        const throttleStart = Date.now();
        await tokenBucket.acquire();
        throttleWait = Date.now() - throttleStart;
        if (throttleWait > 50) {
          apiHealthTracker.recordThrottle();
        }
      }

      // — Retry loop —
      let networkRetries = 0;
      let has429Retried = false;

      while (true) {
        const start = Date.now();

        try {
          const response = await nativeFetch(input, init);
          const latency = Date.now() - start + throttleWait;
          apiHealthTracker.recordLatency(latency);

          // 401 — Unauthorized: clear session & redirect. Do NOT retry.
          if (response.status === 401) {
            handleUnauthorized(input);
            return response;
          }

          // 429 — Rate limited: wait Retry-After, then retry ONCE.
          if (response.status === 429 && !has429Retried) {
            has429Retried = true;
            const waitMs = parseRetryAfter(response);
            await sleep(waitMs);
            continue;
          }

          // 503 — Service unavailable: retry with exponential backoff.
          if (response.status === 503 && networkRetries < 3) {
            const delay = 1_000 * Math.pow(2, networkRetries); // 1 s, 2 s, 4 s
            await sleep(delay);
            networkRetries++;
            continue;
          }

          return response;
        } catch (error) {
          // Network errors (e.g. DNS failure, offline): retry with backoff.
          apiHealthTracker.recordLatency(Date.now() - start + throttleWait);

          if (networkRetries < 3) {
            const delay = 1_000 * Math.pow(2, networkRetries); // 1 s, 2 s, 4 s
            await sleep(delay);
            networkRetries++;
            continue;
          }

          throw error;
        }
      }
    };

    // ── Deduplication wrapper ─────────────────────────────────────────
    if (dedupeKey) {
      // Store the master promise; all consumers (including the original
      // caller) receive clones so the master body is never consumed.
      const masterPromise = execute();
      inflightRequests.set(dedupeKey, masterPromise);

      return masterPromise
        .then((r) => r.clone())
        .finally(() => {
          inflightRequests.delete(dedupeKey);
        });
    }

    return execute();
  }

  return wrappedFetch as typeof globalThis.fetch;
}

// ── Pre-built instance using the browser's native fetch ───────────────────

export const wrappedFetch = createWrappedFetch(
  globalThis.fetch.bind(globalThis),
);
