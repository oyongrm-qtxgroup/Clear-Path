import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { QUERY_KEYS } from "@/constants";
import { CACHE_TIER_3 } from "@/lib/queryClient";
import { useAuth } from "./useAuth";

/**
 * Fetches the current user's profile row (display_name, currency, etc.)
 * from the `profiles` table. Only runs when a session exists.
 */
export function useProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading: loading } = useQuery({
    queryKey: QUERY_KEYS.auth.profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    ...CACHE_TIER_3,
  });

  return { profile: profile ?? null, loading };
}
