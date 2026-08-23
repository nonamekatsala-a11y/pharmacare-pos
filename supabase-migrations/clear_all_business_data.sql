-- Delete all business data while preserving user accounts and memberships.
-- Run this migration in the Supabase SQL editor before using Clear All Data.

CREATE OR REPLACE FUNCTION public.clear_all_business_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_name text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'Admin'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only active administrators can clear business data';
  END IF;

  FOREACH table_name IN ARRAY ARRAY[
    'sale_items',
    'sales',
    'warehouse_allocations',
    'warehouse_items',
    'pharmacy_inventory',
    'medicines',
    'expenses',
    'customers',
    'categories'
  ] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('DELETE FROM public.%I WHERE TRUE', table_name);
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_all_business_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_all_business_data() TO authenticated;