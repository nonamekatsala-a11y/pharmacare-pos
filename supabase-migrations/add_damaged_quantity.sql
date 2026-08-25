-- Track damaged pharmacy stock separately from usable inventory.

ALTER TABLE pharmacy_inventory
ADD COLUMN IF NOT EXISTS damaged_quantity INTEGER NOT NULL DEFAULT 0;