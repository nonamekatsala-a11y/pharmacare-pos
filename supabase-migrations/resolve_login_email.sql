-- Allow the login form to resolve a username before authentication.

CREATE OR REPLACE FUNCTION public.resolve_login_email(login_user_name text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM profiles
  WHERE lower(user_name) = lower(btrim(login_user_name))
    AND is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_login_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_login_email(text) TO anon, authenticated;