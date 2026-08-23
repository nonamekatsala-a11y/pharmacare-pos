-- Allow active administrators to update another user's profile.

CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_user_id uuid,
  target_user_name text,
  target_full_name text,
  target_role text,
  target_is_active boolean
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
    RAISE EXCEPTION 'Only active administrators can update users';
  END IF;

  IF target_role NOT IN ('Admin', 'Cashier', 'Pharmacist') THEN
    RAISE EXCEPTION 'Invalid user role';
  END IF;

  UPDATE profiles
  SET user_name = target_user_name,
      full_name = target_full_name,
      role = target_role,
      is_active = target_is_active,
      updated_at = now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user(uuid, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid, text, text, text, boolean) TO authenticated;