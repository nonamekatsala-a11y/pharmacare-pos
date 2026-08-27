-- Allow active administrators to permanently delete pharmacist accounts.

CREATE OR REPLACE FUNCTION public.delete_pharmacist(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_role text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only active administrators can delete pharmacists';
  END IF;

  IF target_user_id IS NULL OR target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'The selected pharmacist cannot be deleted';
  END IF;

  SELECT role INTO target_role
  FROM public.profiles
  WHERE id = target_user_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Pharmacist profile not found';
  END IF;

  IF target_role <> 'Pharmacist' THEN
    RAISE EXCEPTION 'Only pharmacist accounts can be deleted here';
  END IF;

  DELETE FROM public.pharmacy_memberships WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_pharmacist(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_pharmacist(uuid) TO authenticated;
