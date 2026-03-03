-- ============================================================================
-- ClearPath – RLS Verification RPC
-- ============================================================================
-- Exposes a server-side function to check which public tables have RLS
-- enabled/disabled. Callable via PostgREST: supabase.rpc('get_rls_status').
--
-- Only the service_role key or a logged-in user can invoke it (secured by
-- the SECURITY DEFINER + explicit grant below).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_rls_status()
RETURNS TABLE (
  table_name   text,
  rls_enabled  boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    c.relname::text   AS table_name,
    c.relrowsecurity  AS rls_enabled
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'          -- ordinary tables only
  ORDER BY c.relname;
$$;

-- Only authenticated users (and service_role) may call this function.
REVOKE ALL ON FUNCTION public.get_rls_status() FROM public;
REVOKE ALL ON FUNCTION public.get_rls_status() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_rls_status() TO authenticated;


-- ============================================================================
-- Optional: helper that returns ONLY tables missing RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_tables_without_rls()
RETURNS TABLE (
  table_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT c.relname::text AS table_name
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = false
  ORDER BY c.relname;
$$;

REVOKE ALL ON FUNCTION public.get_tables_without_rls() FROM public;
REVOKE ALL ON FUNCTION public.get_tables_without_rls() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_tables_without_rls() TO authenticated;
