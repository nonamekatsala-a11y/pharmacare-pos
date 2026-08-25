-- Track damaged pharmacy stock separately from the pharmacy_inventory view.

CREATE TABLE IF NOT EXISTS pharmacy_inventory_damage (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	pharmacy_id text NOT NULL,
	medicine_id uuid NOT NULL,
	damaged_quantity INTEGER NOT NULL DEFAULT 0 CHECK (damaged_quantity >= 0),
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
	UNIQUE (pharmacy_id, medicine_id)
);

ALTER TABLE pharmacy_inventory_damage ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON pharmacy_inventory_damage TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view inventory damage" ON pharmacy_inventory_damage;
CREATE POLICY "Authenticated users can view inventory damage"
ON pharmacy_inventory_damage FOR SELECT
TO authenticated
USING (true);