-- Allow an administrator to move a pharmacist to another pharmacy.

CREATE OR REPLACE FUNCTION public.reassign_pharmacist(
  target_user_id uuid,
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
    RAISE EXCEPTION 'Only active administrators can reassign pharmacists';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = target_user_id
      AND role = 'Pharmacist'
  ) THEN
    RAISE EXCEPTION 'The selected user is not a pharmacist';
  END IF;

  IF target_pharmacy_id IS NULL OR btrim(target_pharmacy_id) = '' THEN
    RAISE EXCEPTION 'A target pharmacy is required';
  END IF;

  DELETE FROM pharmacy_memberships
  WHERE user_id = target_user_id;

  INSERT INTO pharmacy_memberships (user_id, pharmacy_id, role)
  VALUES (target_user_id, target_pharmacy_id, 'Pharmacist');
END;
$$;

REVOKE ALL ON FUNCTION public.reassign_pharmacist(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reassign_pharmacist(uuid, text) TO authenticated;