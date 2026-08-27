-- Allow active administrators to repair a pharmacist Auth account without a profile.

CREATE OR REPLACE FUNCTION public.repair_pharmacist_profile(
  target_email text,
  target_user_name text,
  target_full_name text,
  target_pharmacy_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only active administrators can repair pharmacist profiles';
  END IF;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE lower(email) = lower(btrim(target_email))
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No Auth account was found for this email';
  END IF;

  INSERT INTO profiles (id, email, user_name, full_name, role, is_active)
  VALUES (target_user_id, lower(btrim(target_email)), btrim(target_user_name), btrim(target_full_name), 'Pharmacist', true)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      user_name = EXCLUDED.user_name,
      full_name = EXCLUDED.full_name,
      role = 'Pharmacist',
      is_active = true,
      updated_at = now();

  DELETE FROM pharmacy_memberships WHERE user_id = target_user_id;
  INSERT INTO pharmacy_memberships (user_id, pharmacy_id, role)
  VALUES (target_user_id, target_pharmacy_id, 'Pharmacist');

  RETURN target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.repair_pharmacist_profile(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.repair_pharmacist_profile(text, text, text, text) TO authenticated;
