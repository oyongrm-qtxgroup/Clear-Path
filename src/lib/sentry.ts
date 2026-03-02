import * as Sentry from "@sentry/react";

/**
 * Initialise Sentry. Call once in main.tsx before rendering.
 * Only enables in non-development environments when a DSN is provided.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  const env = (import.meta.env.VITE_APP_ENV as string) ?? "development";

  if (!dsn || env === "development") return;

  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

/**
 * Convenience wrapper around `Sentry.captureException`.
 * Safe to call even when Sentry is not initialised.
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export { Sentry };
