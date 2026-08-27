-- Allow active administrators to create user profiles for new users.

CREATE OR REPLACE FUNCTION public.create_user_profile(
  target_user_id uuid,
  target_user_name text,
  target_full_name text,
  target_role text,
  target_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only active administrators can create user profiles';
  END IF;

  IF target_role NOT IN ('Admin', 'Cashier', 'Pharmacist') THEN
    RAISE EXCEPTION 'Invalid user role';
  END IF;

  INSERT INTO profiles (id, user_name, full_name, role, is_active, email, created_at, updated_at)
  VALUES (target_user_id, target_user_name, target_full_name, target_role, true, target_email, now(), now());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to create user profile';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_profile(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text, text, text) TO authenticated;
