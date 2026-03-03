import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { QUERY_KEYS } from "@/constants";

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

  // ── Sign in ──────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.auth.user,
        });
        toast.success("Signed in successfully!");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sign-in failed";
        toast.error(message);
        return false;
      }
    },
    [queryClient],
  );

  // ── Sign up (+ create profile) ──────────────────────────────────────────
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
    ): Promise<boolean> => {
      try {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (signUpError) throw signUpError;

        // Profile row is auto-created by the on_auth_user_created trigger,
        // which reads display_name from raw_user_meta_data.

        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.auth.user,
        });
        toast.success("Account created! Check your email to confirm.");
        return true;
      } catch (err) {
        const raw = err instanceof Error ? err.message : "Sign-up failed";

        // Supabase returns "email rate limit exceeded" when too many
        // confirmation emails are sent in a short window.
        const message = raw.toLowerCase().includes("rate limit")
          ? "Too many sign-up attempts. Please wait a few minutes and try again."
          : raw;

        toast.error(message);
        return false;
      }
    },
    [queryClient],
  );

  // ── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      queryClient.clear();
      toast.success("Signed out.");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-out failed";
      toast.error(message);
      return false;
    }
  }, [queryClient]);

  // ── Reset password ───────────────────────────────────────────────────────
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      toast.success("Password reset email sent — check your inbox.");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Password reset failed";
      toast.error(message);
      return false;
    }
  }, []);

  return { user, session, loading, signIn, signUp, signOut, resetPassword };
}
