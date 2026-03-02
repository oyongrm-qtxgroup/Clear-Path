// ── Custom error hierarchy ───────────────────────────────────────────────────
//
// All custom errors extend `AppError` so callers can do a single
// `instanceof AppError` check.  Each sub-class carries a `code` discriminant
// so error boundaries and toast handlers can react differently.

export type ErrorCode =
  | "API_ERROR"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "AUTH_ERROR";

/** Base class for all application-level errors. */
export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
  }
}

/**
 * Thrown when an API call returns data that fails Zod validation.
 *
 * `fieldErrors` carries the per-field Zod issue map (PII-sanitised before
 * being sent to Sentry).
 */
export class ValidationError extends AppError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[]> = {},
    options?: ErrorOptions,
  ) {
    super("VALIDATION_ERROR", message, options);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Thrown when a Supabase / fetch call fails due to server or transport errors.
 *
 * `status` mirrors the HTTP status code when available (e.g. 500, 502).
 */
export class ApiError extends AppError {
  readonly status?: number;

  constructor(message: string, status?: number, options?: ErrorOptions) {
    super("API_ERROR", message, options);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Thrown when the browser is offline or a request times out.
 */
export class NetworkError extends AppError {
  constructor(message = "Network request failed", options?: ErrorOptions) {
    super("NETWORK_ERROR", message, options);
    this.name = "NetworkError";
  }
}

/**
 * Thrown on 401 / 403 or when the Supabase session is missing / expired.
 */
export class AuthError extends AppError {
  constructor(message = "Authentication required", options?: ErrorOptions) {
    super("AUTH_ERROR", message, options);
    this.name = "AuthError";
  }
}
