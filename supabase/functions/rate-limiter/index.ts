import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Rate-limit configuration per action
// ---------------------------------------------------------------------------
const LIMITS: Record<string, { maxAttempts: number; windowMs: number }> = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  reset_password: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
};

const VALID_ACTIONS = new Set(Object.keys(LIMITS));

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Edge Function handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // ── Parse & validate request body ──────────────────────────────────────
  let action: string;
  let identifier: string;

  try {
    const body = await req.json();
    action = body.action;
    identifier = body.identifier;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!action || !identifier) {
    return jsonResponse(
      { error: "Missing required fields: action, identifier" },
      400,
    );
  }

  if (!VALID_ACTIONS.has(action)) {
    return jsonResponse(
      {
        error: `Invalid action. Must be one of: ${[...VALID_ACTIONS].join(", ")}`,
      },
      400,
    );
  }

  // ── Supabase admin client (uses service_role to bypass RLS) ────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { maxAttempts, windowMs } = LIMITS[action];
  const now = new Date();

  try {
    // ── Fetch existing record ──────────────────────────────────────────
    const { data: existing, error: fetchError } = await supabase
      .from("rate_limits")
      .select("id, attempt_count, window_start")
      .eq("identifier", identifier)
      .eq("action", action)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // ── Decide: reset window, increment, or reject ─────────────────────
    if (existing) {
      const windowStart = new Date(existing.window_start);
      const windowElapsed = now.getTime() - windowStart.getTime();

      if (windowElapsed >= windowMs) {
        // Window expired → reset counter to 1
        const { error: updateError } = await supabase
          .from("rate_limits")
          .update({ attempt_count: 1, window_start: now.toISOString() })
          .eq("id", existing.id);

        if (updateError) throw updateError;

        return jsonResponse({ ok: true, remaining: maxAttempts - 1 }, 200);
      }

      if (existing.attempt_count >= maxAttempts) {
        // Over limit → 429
        const retryAfter = Math.ceil((windowMs - windowElapsed) / 1000);

        return jsonResponse({ error: "Too many attempts", retryAfter }, 429);
      }

      // Under limit → increment
      const newCount = existing.attempt_count + 1;
      const { error: updateError } = await supabase
        .from("rate_limits")
        .update({ attempt_count: newCount })
        .eq("id", existing.id);

      if (updateError) throw updateError;

      return jsonResponse({ ok: true, remaining: maxAttempts - newCount }, 200);
    }

    // ── No existing record → create with count = 1 ────────────────────
    const { error: insertError } = await supabase.from("rate_limits").insert({
      identifier,
      action,
      attempt_count: 1,
      window_start: now.toISOString(),
    });

    if (insertError) throw insertError;

    return jsonResponse({ ok: true, remaining: maxAttempts - 1 }, 200);
  } catch (err) {
    console.error("rate-limiter error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
