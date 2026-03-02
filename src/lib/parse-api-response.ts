import type { ZodType, ZodError } from "zod";

import { logError } from "@/lib/sentry";
import { ValidationError } from "@/types/errors";

// ── PII-sanitised shape ──────────────────────────────────────────────────────

/**
 * Produce a JSON-safe "shape" of `value` that conveys the structure of the
 * data without leaking Personally Identifiable Information.
 *
 * - Strings → `"string(length)"` e.g. `"string(42)"`
 * - Numbers → kept as-is (non-PII)
 * - Booleans → kept as-is
 * - null / undefined → kept as-is
 * - Arrays → first element shape + `"...(N total)"`
 * - Objects → keys preserved, values recursively replaced
 */
function sanitiseShape(value: unknown, depth = 0): unknown {
  if (depth > 4) return "…";

  if (value === null) return null;
  if (value === undefined) return undefined;

  if (typeof value === "string") return `string(${value.length})`;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    return [sanitiseShape(value[0], depth + 1), `...(${value.length} total)`];
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitiseShape(v, depth + 1);
    }
    return out;
  }

  return typeof value;
}

/**
 * Build a flat `{ fieldPath: messages[] }` map from a `ZodError`.
 */
function extractFieldErrors(zodError: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of zodError.issues) {
    const path = issue.path.join(".") || "_root";
    (fieldErrors[path] ??= []).push(issue.message);
  }
  return fieldErrors;
}

// ── Public helper ────────────────────────────────────────────────────────────

/**
 * Parse `data` with the given Zod schema.
 *
 * On success → returns the typed, parsed value.
 * On failure →
 *   1. Logs the Zod issues + a PII-sanitised data shape to Sentry.
 *   2. Throws a `ValidationError` the UI can catch and display.
 *
 * @param schema  - Any Zod schema (object, array, union, …)
 * @param data    - The raw value from Supabase / API
 * @param label   - A short human label like `"debts"` for the Sentry breadcrumb
 */
export function parseApiResponse<T>(
  schema: ZodType<T>,
  data: unknown,
  label: string,
): T {
  const result = schema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  const fieldErrors = extractFieldErrors(result.error);

  logError(result.error, {
    label: `API validation failed: ${label}`,
    dataShape: sanitiseShape(data),
    issues: result.error.issues.map((i) => ({
      path: i.path.join("."),
      code: i.code,
      message: i.message,
    })),
  });

  throw new ValidationError(
    `Invalid data received from server (${label})`,
    fieldErrors,
    { cause: result.error },
  );
}
