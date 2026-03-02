import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { QUERY_KEYS } from "@/constants";
import {
  checkRateLimit,
  formatRetryAfter,
  type RateLimitAction,
} from "@/api/rate-limiter.api";

/**
 * Custom hook that wraps Supabase Auth and caches the session via React Query.
 *
 * Returns the current `user`, `session`, a `loading` flag and four auth
 * action helpers (`signIn`, `signUp`, `signOut`, `resetPassword`).
 */
export function useAuth() {
  const queryClient = useQueryClient();

  // ── Cached session query ─────────────────────────────────────────────────
  const { data, isLoading: loading } = useQuery({
    queryKey: QUERY_KEYS.auth.user,
    queryFn: async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const session = data ?? null;
  const user = session?.user ?? null;

  // ── Rate-limit gate ──────────────────────────────────────────────────────
  const enforceRateLimit = useCallback(
    async (action: RateLimitAction, identifier: string) => {
      const result = await checkRateLimit(action, identifier);
      if (!result.ok) {
        const wait = formatRetryAfter(result.retryAfter);
        throw new Error(`Too many attempts. Please try again in ${wait}.`);
      }
    },
    [],
  );

  // ── Sign in ──────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        await enforceRateLimit("login", email);

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.auth.user,
        });
        toast.success("Signed in successfully!");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sign-in failed";
        toast.error(message);
        throw err;
      }
    },
    [queryClient, enforceRateLimit],
  );

  // ── Sign up (+ create profile) ──────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        await enforceRateLimit("register", email);

        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        // Create a profile row with the display name
        const newUser = signUpData.user;
        if (newUser) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({ id: newUser.id, display_name: displayName });
          if (profileError) throw profileError;
        }

        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.auth.user,
        });
        toast.success("Account created! Check your email to confirm.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sign-up failed";
        toast.error(message);
        throw err;
      }
    },
    [queryClient, enforceRateLimit],
  );

  // ── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      queryClient.clear();
      toast.success("Signed out.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-out failed";
      toast.error(message);
      throw err;
    }
  }, [queryClient]);

  // ── Reset password ───────────────────────────────────────────────────────
  const resetPassword = useCallback(
    async (email: string) => {
      try {
        await enforceRateLimit("reset_password", email);

        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;

        toast.success("Password reset email sent — check your inbox.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Password reset failed";
        toast.error(message);
        throw err;
      }
    },
    [enforceRateLimit],
  );

  return { user, session, loading, signIn, signUp, signOut, resetPassword };
}
