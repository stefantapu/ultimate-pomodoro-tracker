-- Expose only the total number of registered accounts to the public dashboard.
-- No user identifiers or account metadata leave the protected auth schema.

CREATE OR REPLACE FUNCTION public.get_registered_users_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*)
  FROM auth.users;
$$;

REVOKE ALL ON FUNCTION public.get_registered_users_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_registered_users_count() TO anon, authenticated;
