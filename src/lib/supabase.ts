import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { wrappedFetch } from "./api-wrapper";

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

if (!supabaseUrl) {
  throw new Error(
    "Missing VITE_SUPABASE_URL – add it to .env.local (see .env.example)",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_ANON_KEY – add it to .env.local (see .env.example)",
  );
}

// ---------------------------------------------------------------------------
// Supabase client singleton
// ---------------------------------------------------------------------------
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: wrappedFetch,
  },
});

/**
 * Alias — the default `supabase` export already applies the full API wrapper
 * (throttling, retry, deduplication). Use whichever name reads best at the
 * call-site.
 */
export const wrappedSupabase = supabase;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the currently authenticated user, or `null` if no active session.
 */
export async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
