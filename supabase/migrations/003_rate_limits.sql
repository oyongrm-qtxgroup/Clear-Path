-- ============================================================================
-- ClearPath – Rate Limits Table
-- ============================================================================
-- Tracks per-identifier, per-action attempt counts within sliding windows.
-- Used by the `rate-limiter` Edge Function to throttle sensitive auth actions.
-- ============================================================================

CREATE TABLE public.rate_limits (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier    text          NOT NULL,
  action        text          NOT NULL CHECK (action IN ('login', 'register', 'reset_password')),
  attempt_count int           NOT NULL DEFAULT 0,
  window_start  timestamptz   NOT NULL DEFAULT now(),

  UNIQUE (identifier, action)
);

-- Index for fast lookups by identifier + action
CREATE INDEX idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);

-- ---------------------------------------------------------------------------
-- RLS: The rate_limits table is only accessed by the Edge Function using the
-- service_role key, so we enable RLS but add no user-facing policies.
-- The service_role key bypasses RLS by default.
-- ---------------------------------------------------------------------------
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
