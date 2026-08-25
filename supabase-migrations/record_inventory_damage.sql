-- Record damaged stock without adding columns to the pharmacy_inventory view.

CREATE OR REPLACE FUNCTION public.record_inventory_damage(
  target_medicine_id uuid,
  target_pharmacy_id text,
  target_damaged_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_quantity integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'Admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only active administrators can record damaged inventory';
  END IF;

  IF target_damaged_quantity <= 0 THEN
    RAISE EXCEPTION 'Damaged quantity must be a positive whole number';
  END IF;

  SELECT quantity INTO current_quantity
  FROM pharmacy_inventory
  WHERE medicine_id = target_medicine_id AND pharmacy_id = target_pharmacy_id;

  IF current_quantity IS NULL THEN
    RAISE EXCEPTION 'Medicine inventory was not found';
  END IF;
  IF target_damaged_quantity > current_quantity THEN
    RAISE EXCEPTION 'Damaged quantity cannot exceed the available quantity';
  END IF;

  UPDATE pharmacy_inventory
  SET quantity = current_quantity - target_damaged_quantity
  WHERE medicine_id = target_medicine_id AND pharmacy_id = target_pharmacy_id;

  INSERT INTO pharmacy_inventory_damage (pharmacy_id, medicine_id, damaged_quantity, updated_at)
  VALUES (target_pharmacy_id, target_medicine_id, target_damaged_quantity, now())
  ON CONFLICT (pharmacy_id, medicine_id)
  DO UPDATE SET damaged_quantity = pharmacy_inventory_damage.damaged_quantity + EXCLUDED.damaged_quantity,
                updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_inventory_damage(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_inventory_damage(uuid, text, integer) TO authenticated;
