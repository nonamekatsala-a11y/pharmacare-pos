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
DECLARE
  current_user_id uuid;
  user_role text;
  user_is_active boolean;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get user role and active status
  SELECT role, is_active INTO user_role, user_is_active
  FROM profiles
  WHERE id = current_user_id;

  -- Check if user is an active administrator
  IF user_role != 'Admin' OR user_is_active != true THEN
    RAISE EXCEPTION 'Only active administrators can create user profiles. Current role: %, Active: %', user_role, user_is_active;
  END IF;

  IF target_role NOT IN ('Admin', 'Pharmacist') THEN
    RAISE EXCEPTION 'Invalid user role: %', target_role;
  END IF;

  -- First, delete any existing profile for this user (in case Supabase auto-created one)
  DELETE FROM profiles WHERE id = target_user_id;

  INSERT INTO profiles (id, user_name, full_name, role, is_active, email, created_at, updated_at)
  VALUES (target_user_id, target_user_name, target_full_name, target_role, true, target_email, now(), now());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to create user profile';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_profile(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text, text, text) TO authenticated;
