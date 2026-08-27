-- Allow active administrators to create a pharmacist profile and membership.

CREATE OR REPLACE FUNCTION public.create_pharmacist(
  target_user_id uuid,
  target_email text,
  target_user_name text,
  target_full_name text,
  target_pharmacy_id text
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
    RAISE EXCEPTION 'Only active administrators can create pharmacists';
  END IF;

  IF target_user_id IS NULL OR target_email IS NULL OR btrim(target_email) = ''
     OR target_user_name IS NULL OR btrim(target_user_name) = ''
     OR target_full_name IS NULL OR btrim(target_full_name) = ''
     OR target_pharmacy_id IS NULL OR btrim(target_pharmacy_id) = '' THEN
    RAISE EXCEPTION 'All pharmacist details are required';
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
END;
$$;

REVOKE ALL ON FUNCTION public.create_pharmacist(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_pharmacist(uuid, text, text, text, text) TO authenticated;
