-- Complete a sale and decrement inventory atomically.
-- Apply this migration in Supabase before using the RPC from the web app.

CREATE OR REPLACE FUNCTION public.complete_sale(
  target_pharmacy_id text,
  target_invoice_number text,
  target_sale_date timestamptz,
  target_customer_id uuid,
  target_payment_method text,
  target_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_sale_id uuid;
  current_user_id uuid := auth.uid();
  item jsonb;
  item_medicine_id uuid;
  item_quantity integer;
  item_unit_price numeric;
  inventory_quantity integer;
  inventory_expiry date;
  inventory_name text;
  total_amount numeric := 0;
  aggregated_item record;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be authenticated to complete a sale';
  END IF;

  IF target_pharmacy_id IS NULL OR btrim(target_pharmacy_id) = '' THEN
    RAISE EXCEPTION 'A pharmacy is required for the sale';
  END IF;

  IF target_invoice_number IS NULL OR btrim(target_invoice_number) = '' THEN
    RAISE EXCEPTION 'An invoice number is required';
  END IF;

  IF target_payment_method IS NULL OR target_payment_method NOT IN ('Cash', 'Card', 'Credit', 'Mpamba', 'Airtel Money', 'Bank Transfer') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  IF jsonb_typeof(target_items) <> 'array' OR jsonb_array_length(target_items) = 0 THEN
    RAISE EXCEPTION 'A sale must contain at least one item';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = current_user_id
      AND p.is_active = true
      AND (
        p.role = 'Admin'
        OR EXISTS (
          SELECT 1
          FROM pharmacy_memberships pm
          WHERE pm.user_id = current_user_id
            AND pm.pharmacy_id = target_pharmacy_id
        )
      )
  ) THEN
    RAISE EXCEPTION 'You are not authorized to sell from this pharmacy';
  END IF;

  -- Validate each submitted line before changing any data.
  FOR item IN SELECT value FROM jsonb_array_elements(target_items)
  LOOP
    BEGIN
      item_medicine_id := (item->>'medicineId')::uuid;
      item_quantity := (item->>'quantity')::integer;
      item_unit_price := (item->>'unitPrice')::numeric;
    EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
      RAISE EXCEPTION 'Each sale item must have a valid medicineId, quantity, and unitPrice';
    END;

    IF item_quantity IS NULL OR item_quantity <= 0 THEN
      RAISE EXCEPTION 'Sale quantities must be positive whole numbers';
    END IF;

    IF item_unit_price IS NULL OR item_unit_price < 0 THEN
      RAISE EXCEPTION 'Sale prices cannot be negative';
    END IF;
  END LOOP;

  -- Aggregate duplicate medicine lines and lock their inventory rows.
  FOR aggregated_item IN
    SELECT
      (value->>'medicineId')::uuid AS medicine_id,
      sum((value->>'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(target_items)
    GROUP BY (value->>'medicineId')::uuid
  LOOP
    SELECT quantity, expiry_date, medicine_name
    INTO inventory_quantity, inventory_expiry, inventory_name
    FROM pharmacy_inventory
    WHERE medicine_id = aggregated_item.medicine_id
      AND pharmacy_id = target_pharmacy_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Medicine is not available in this pharmacy''s inventory';
    END IF;

    IF inventory_expiry IS NOT NULL AND inventory_expiry < CURRENT_DATE THEN
      RAISE EXCEPTION 'Cannot sell expired medicine: %', inventory_name;
    END IF;

    IF inventory_quantity < aggregated_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %: % available, % requested',
        inventory_name, inventory_quantity, aggregated_item.quantity;
    END IF;

    UPDATE pharmacy_inventory
    SET quantity = quantity - aggregated_item.quantity
    WHERE medicine_id = aggregated_item.medicine_id
      AND pharmacy_id = target_pharmacy_id;
  END LOOP;

  FOR item IN SELECT value FROM jsonb_array_elements(target_items)
  LOOP
    total_amount := total_amount
      + ((item->>'quantity')::integer * (item->>'unitPrice')::numeric);
  END LOOP;

  INSERT INTO sales (
    invoice_number,
    user_id,
    customer_id,
    pharmacy_id,
    sale_date,
    subtotal,
    discount,
    tax,
    total,
    payment_method,
    status
  )
  VALUES (
    target_invoice_number,
    current_user_id,
    target_customer_id,
    target_pharmacy_id,
    COALESCE(target_sale_date, now()),
    total_amount,
    0,
    0,
    total_amount,
    target_payment_method,
    'Completed'
  )
  RETURNING id INTO new_sale_id;

  INSERT INTO sale_items (sale_id, medicine_id, quantity, unit_price, line_total)
  SELECT
    new_sale_id,
    (value->>'medicineId')::uuid,
    (value->>'quantity')::integer,
    (value->>'unitPrice')::numeric,
    (value->>'quantity')::integer * (value->>'unitPrice')::numeric
  FROM jsonb_array_elements(target_items);

  RETURN new_sale_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_sale(text, text, timestamptz, uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_sale(text, text, timestamptz, uuid, text, jsonb) TO authenticated;
